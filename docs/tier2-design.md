# Tier 2 design — self-hosted remote MCP connector

**Status: document-only (D-010).** Nothing in this file is built or tested.
It's a design and deploy-guide skeleton, written so a future build task can
implement it without re-deriving the shape from the PRD. Phases 1–5 ship
without this; Scout is complete and fully useful at Tier 0/1 with none of
it. Build this only when someone actually wants it (PRD §9: "Tier 2 is the
owner's own deployment first, docs second").

**Never-default framing, stated once, binding throughout this doc:**
Tier 2 is explicitly a non-goal as a product ("Not a hosted service," PRD
§4) except as an optional, self-hosted, documented escape hatch (PRD §5.0
row 2, §8). It is never required to use Scout, never the install path
`setup` steers anyone toward, and never something Scout operates on the
user's behalf — the user deploys their own Worker, to their own Cloudflare
account, over their own pack repo, gated by a secret only they hold. If
this doc is ever read as "Scout wants you to run a server," it has failed
its own PRD.

## 1. What this is

A small Cloudflare Worker, deployed by the user to their own account, that
exposes the pack as a **streamable-HTTP MCP endpoint** instead of the
bundled stdio server (`bin/scout-mcp.mjs`) Tier 0 already ships. Same tool
contract, different transport and a different storage backend: instead of
reading `pack/*.json` off local disk, it reads and writes the user's Tier 1
pack repo through the GitHub API.

```
                    ┌───────────────────────────┐
   claude.ai   ───▶ │  Cloudflare Worker         │ ───▶  GitHub REST API
  (work acct.)      │  /mcp  (streamable HTTP)   │       (Contents + Trees)
                     │  Authorization: Bearer …  │            │
   claude.ai   ───▶ │  (checked on every call)  │            ▼
  (personal acct.)   └───────────────────────────┘   user's pack repo
                                                       (the same Tier 1
                                                        remote `git push`
                                                        already targets)
```

Prerequisite: **Tier 1** (a pack repo with a git remote). Tier 2 has no
independent storage of its own — it's a different door onto the same
house. There is exactly one pack; Tier 0 (local stdio), Tier 1 (git sync +
Pages), and Tier 2 (remote MCP) are three ways to reach it, not three
copies of it.

## 2. Tool contract — same seven shapes, different backend

The Worker exposes **the same seven tools** `bin/scout-mcp.mjs` already
defines, unchanged in name, input schema, and semantics:

| Tool | Local (Tier 0) | Remote (Tier 2) |
|---|---|---|
| `scout_list_entries` | `fs.readdir` + read each file | GitHub Trees API (`GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`), one call, then batch-fetch blobs |
| `scout_read_entry` | `fs.readFile` + scan all entries for predecessors | `GET /contents/{path}` for the entry; predecessor scan needs the same full-list read as `scout_list_entries` |
| `scout_compile` | `compilePack(packDir)` | same rendering logic, fed a pre-fetched entry list (see §5's refactor note) |
| `scout_create_entry` | validate → write new file | validate → `PUT /contents/{path}` (create, no `sha`) with a commit message |
| `scout_update_entry` | merge patch → validate → overwrite | `GET` current file for its `sha` → merge → validate → `PUT` with that `sha` |
| `scout_archive_entry` | set `status`/`superseded_by` → overwrite | same merge-and-`PUT` as update |
| `scout_reactivate_entry` | set `status: active`, clear `superseded_by` → overwrite | same merge-and-`PUT` as update |

No new tool, no renamed tool, no retrieval/search tool added (D-014's
compliance note: the shipped MCP surface stays CRUD/compile only — that
holds here too). This is deliberate: **the tool contract is the API**, and
keeping it identical means a client (claude.ai, or anything else speaking
MCP) doesn't need to know which tier it's talking to. Every GitHub write
above is a real commit, so the pack repo's git history — Tier 1's audit
trail (PRD §5.1) — is populated by Tier 2 writes exactly as it would be by
a local `/scout:add` followed by `git push`.

## 3. Auth model — two secrets, two trust boundaries

Two distinct secrets, each answering a different question, both set once
at deploy time via `wrangler secret put` (never committed, never in
`wrangler.toml`):

1. **`SCOUT_BEARER_TOKEN`** — answers *"is this caller allowed to talk to
   my Worker at all?"* A single, user-generated opaque token
   (`openssl rand -hex 32`). The Worker checks
   `Authorization: Bearer <token>` on every request and returns `401`
   without it. This is the credential the user pastes into claude.ai's
   custom-connector auth field. Single-user by design (PRD §8: "no auth
   needed [for stdio] — it's local"; the remote endpoint's one bearer token
   is the entire access-control model — no OAuth, no per-caller identity,
   no roles). Rotating it is one `wrangler secret put` away; there is no
   user table to update.
2. **`SCOUT_GITHUB_TOKEN`** — answers *"what is the Worker itself allowed
   to do to my repo?"* A GitHub fine-grained personal access token, scoped
   to exactly the one pack repo, with **Contents: Read and write** and
   nothing else. The Worker uses this to call the GitHub API on the user's
   behalf. It never leaves the Worker's secret store and is never returned
   in any tool response.

A caller who has the bearer token can do anything the seven tools allow
(read, create, update, archive, reactivate) — there's no finer-grained
permission split inside the tool contract itself. That's an acceptable
trade for "one user, several devices/accounts they own" and an explicit
non-fit for "share my pack's write access with someone else" (use the
read-only Pages browse page and the courier pattern for sharing instead,
D-011, `docs/pages.md`).

## 4. What this enables

- **claude.ai custom connectors, on any account.** Claude Code's plugin
  install is per-machine; claude.ai's connector settings are per-account.
  A work Claude.ai account and a personal one can each add the same Worker
  URL + bearer token as a custom connector, giving both accounts access to
  one pack without a local clone on either.
- **A permanent add-from-anywhere URL.** Paste a link into claude.ai from a
  phone's share sheet, a work laptop with no dev environment, or any
  browser — no git clone, no local pack folder, no Claude Code install —
  and it round-trips through the same draft-confirm-commit flow (skills
  still do the drafting; the tools only ever write what they're handed,
  exactly as `bin/scout-mcp.mjs`'s header already states for the local
  server).
- **Nothing Tier 0/1 didn't already promise**, just reachable from more
  places. Tier 2 adds no new capability to the pack itself — same schema,
  same seven verbs' worth of operations, same entries. It only widens
  *where* those operations can be triggered from.

## 5. Constraints — stated plainly, not glossed over

These are estimates from GitHub's published API behavior, not
measurements — nothing here has been load-tested, because nothing here has
been built. Revisit with real numbers once it exists.

- **Latency.** Every tool call becomes at least one network hop to the
  Worker plus at least one more from the Worker to the GitHub API — call it
  low hundreds of milliseconds to a couple of seconds, versus effectively
  instant local filesystem reads. `scout_read_entry`'s predecessor scan and
  `scout_compile` need the *whole* active pack, meaning either one Trees
  API call plus N blob fetches, or a Worker-side cache (see below) — either
  way, noticeably slower than the local server for those two tools
  specifically. Fine for occasional `add`/`archive`/`explain` from a phone;
  not a fit for anything latency-sensitive.
- **GitHub API rate limits.** An authenticated fine-grained PAT gets 5,000
  REST requests/hour — generous for one person's occasional use, but a
  naive per-entry-fetch implementation of `scout_list_entries` or
  `scout_compile` (one API call per file) scales with pack size and adds
  up faster than it looks. Use the Trees API's `recursive=1` to enumerate
  the whole pack in one call, and consider a short-TTL in-Worker cache
  (Cloudflare KV or just Workers' in-memory cache on the request context)
  invalidated on any write, rather than hitting GitHub fresh on every read.
- **No offline mode.** The local plugin needs network only to install
  itself; every verb after that is pure filesystem I/O. Tier 2 needs
  network to the Worker *and* from the Worker to GitHub's API, for every
  single call, every time. Offline means Tier 2 tools simply fail — there
  is no local cache to fall back to. This is fine because it's additive:
  the manifest layer (already compiled into the project's CLAUDE.md,
  PRD §5.6) is fully offline-safe regardless of which tiers are in play,
  since it doesn't depend on any live tool call.
- **One PAT, full write access, no per-request identity.** Anyone holding
  the bearer token can do anything the seven tools allow to the whole pack
  repo. This is the same shape as any personal API key and is scoped
  appropriately for its stated use case (one person, multiple surfaces
  they control) — it is not a multi-tenant or sharing mechanism, and
  should not be extended into one without redesigning the auth model.
- **Cloudflare Worker cost/cold-start.** Negligible for personal-scale
  traffic on the free tier; noted only for completeness, not because it's
  expected to matter.

## 6. Deploy-guide skeleton

Written for whoever picks this up later, assuming familiarity with
`wrangler` and the existing codebase but no memory of this conversation.

### 6.0 Design note before starting: the reuse seam

`bin/scout-mcp.mjs`'s `TOOLS` array and `HANDLERS` map are already storage-
agnostic in shape — they call `listEntries`/`readEntry`/`createEntry`/
`updateEntry`/`archiveEntry`/`reactivateEntry` imported from
`scout-store.mjs`. The remote server should import those same five verbs
from a **new** `bin/scout-github-store.mjs` that implements identical
signatures against the GitHub API instead of `fs`, and otherwise reuse
`TOOLS`/`HANDLERS` unchanged (swap the import, swap the transport, done).

One seam needs adding first: `scout-compile.mjs`'s `compilePack(packDir)`
currently calls `listEntries(packDir, …)` (from `scout-store.mjs`) directly
inside itself — it's coupled to the local-fs store, not just to a
`packDir` string. Before Tier 2 can share the manifest-rendering logic
(rather than re-deriving the rendering rules Phase 2 already wrote and
tested), give `compilePack` a small injection seam — e.g. accept a
pre-fetched `{ packEntries, stepEntries }` pair, or an injected
`listEntries`-shaped function — so the same tested rendering code runs
over both a local directory and a GitHub-API-backed entry list. This is a
few-line refactor to an existing pure function, not a rewrite.

### 6.1 Prerequisites

- A Cloudflare account (free tier is sufficient) and the `wrangler` CLI.
- A GitHub fine-grained personal access token scoped to only the pack
  repo, with **Contents: Read and write**, nothing broader.
- The pack repo already exists and is Tier 1 (a git remote you push to).

### 6.2 Steps

1. `wrangler init scout-connector` — a new, separate deploy artifact; it
   does not live inside the plugin's `bin/` distribution, since it runs on
   Cloudflare, not inside Claude Code.
2. Implement `bin/scout-github-store.mjs`: same five function signatures as
   `scout-store.mjs`'s `listEntries`/`readEntry`/`createEntry`/
   `updateEntry`/`archiveEntry`/`reactivateEntry`, backed by GitHub's
   Contents and Trees APIs instead of `fs`. Reuses `schema/entry.v1.json`
   validation as-is — validation is pure data-in/boolean-out and has no fs
   dependency to swap out.
3. Apply the `compilePack` injection seam from §6.0; confirm the existing
   compile golden-file tests still pass unmodified against the local path.
4. Port `bin/scout-mcp.mjs` into the Worker's `fetch` handler: same
   `TOOLS`/`HANDLERS`, swap `import … from './scout-store.mjs'` for
   `'./scout-github-store.mjs'`, and swap `StdioServerTransport` for the
   MCP SDK's streamable-HTTP transport. Add one middleware step before any
   tool dispatch: check `Authorization: Bearer` against
   `env.SCOUT_BEARER_TOKEN`, return `401` on mismatch or absence.
5. `wrangler.toml` vars (non-secret config):
   ```toml
   name = "scout-connector"
   main = "src/worker.mjs"
   compatibility_date = "2026-07-19"

   [vars]
   SCOUT_REPO = "you/my-scout-pack"
   SCOUT_BRANCH = "main"
   SCOUT_PACK_PATH = "pack"
   ```
6. Secrets (never in `wrangler.toml`, never committed):
   ```
   wrangler secret put SCOUT_BEARER_TOKEN     # e.g. `openssl rand -hex 32`
   wrangler secret put SCOUT_GITHUB_TOKEN      # the fine-grained PAT
   ```
7. `wrangler deploy` — yields
   `https://scout-connector.<your-subdomain>.workers.dev`.
8. Smoke-test the endpoint directly before touching claude.ai: a bare
   `curl` with and without the bearer header should show `401` vs. a valid
   MCP response for a `tools/list` call.
9. Connect from claude.ai: Settings → Connectors → Add custom connector →
   URL `https://scout-connector.<your-subdomain>.workers.dev/mcp`,
   transport streamable HTTP, paste the bearer token into the connector's
   auth field. (claude.ai's custom-connector UI is a moving target —
   confirm the exact field names/flow against the live product at build
   time rather than trusting this description.) Repeat on a second
   account (work/personal) to exercise the "one pack, two accounts" case.
10. Verify end to end: ask claude.ai "list my scout pack" and confirm it
    invokes `scout_list_entries` and returns real entries; then try an
    `add` and confirm a real commit lands in the pack repo.

### 6.3 Out of scope for this doc

Anything not named above — multi-user sharing, per-caller permissions,
webhook-driven cache invalidation, a management UI for the Worker itself —
is a redesign, not an extension, and isn't part of what D-010 scoped.
