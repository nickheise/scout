# Scout

**Scout is a curated cross-project pack for your agent — links and practices
*you* chose, compiled into a small ambient manifest your agent already
carries into every plan.** It is not a memory tool: Scout never reads session
transcripts, keeps no database, and does no vector recall. It's a plain
folder of entries you own, compiled to plain text your agent already "knows"
the way it knows React exists — no trigger to miss, nothing to search for.

> If you've found `scout` in the community marketplace and expected a
> web-search plugin: that's a different project by a different author. This
> is **Scout for Claude Code** — the pack-and-manifest tool — installed from
> its own marketplace at `nickheise/scout`. Plugin names are per-marketplace,
> not global, so the two coexist without conflict (see
> [Coexistence](#coexistence-with-the-community-scout-plugin) below).

## Install (60 seconds)

```
/plugin marketplace add nickheise/scout
/plugin install scout@scout
```

That's it — zero configuration, zero API keys. Scout ships empty; your first
`/scout:add` starts the pack. (`scout@scout` is not a typo: the plugin is
named `scout` and this repo is its own marketplace, also named `scout` — the
part before `@` is the plugin, the part after is the marketplace it came
from.)

## The seven verbs

Claude Code plugins namespace their commands with the plugin name and a
**colon** — not a space. Scout's real command surface is:

| Command | What it does |
|---|---|
| `/scout:add` | Add a link or a practice to your pack. Paste a URL and it's fetched, analyzed, and drafted; describe a practice in plain words and it drafts a step. Every draft is shown for confirmation before anything is saved. |
| `/scout:start` | The per-project ritual. A short interview, scaffolding of init-step artifacts (changelog, decision log, …), and injection of the compiled manifest into your project's `CLAUDE.md`/`AGENTS.md` as a managed block. Idempotent — re-run any time. |
| `/scout:list` | List your active pack, by tier and phase. |
| `/scout:archive` | Retire an entry, optionally pointing at what superseded it. |
| `/scout:explain` | Show an entry's full provenance — where it came from, when it was verified, why it's in the pack. |
| `/scout:review` | Retroactive backstop: reviews the current project against your full active pack and reports anything that should have surfaced but didn't. |
| `/scout:setup` | First-ever onboarding: choose your pack location, optionally point it at a git remote (Tier 1), and offer a history scan that proposes entries from your own revealed practices. |

**Shipped today:** `add`, `start`, `list`, `archive`, `explain`, `review`.
`setup` is designed (see `docs/plan.md` §4, Phase 4) and lands as this
plugin's next version — because it's a subscribe-not-fork plugin, you get
it automatically (see [Updates](#how-updates-work), below), no
reinstall needed.

## Reports

Beyond the always-on manifest (§ above — the ambient layer that works in any
agent), Scout has a second, Claude-Code-only layer: gated, planning-moment
reports.

- **The planning-moment hook** fires on `PreToolUse(ExitPlanMode)` (primary
  trigger — the model has just written a full plan) and falls back to
  `PostToolUse(TodoWrite)` for todo-driven sessions that skip plan mode. It's
  a plain Node script (`bin/scout-hook-plan.mjs`) — cheap, no LLM call, no
  network, and it never judges anything itself: it only points the host
  agent at the surfacing skill with the plan text in hand.
- **The gate** (`skills/surfacing`) does the actual judging: every candidate
  answers three questions, in order — does this genuinely benefit the plan
  (not a surface-level keyword match); is adopting it now meaningfully
  cheaper than retrofitting later; was it already dismissed in a similar
  context. A rejection at any question ends that candidate silently; it's
  logged to a rejection ledger, never shown.
- **Hard cap: 2 reports per planning moment.** Whatever else survives the
  gate gets cut by leverage and ledgered, not squeezed onto the card.
- **"Nothing surfaced" is the good, common result** — not a fallback message
  to apologize for. A card only appears when a match earns its place; most
  planning moments should produce silence.
- **`/scout:review`** runs the identical gate retroactively against a
  project's actual history (commits, CHANGELOG, dependencies) instead of a
  live plan — the backstop for whatever the ambient hook missed. Same cap,
  same restraint, same ledger.

**Delivery honesty (D-013):** the hook spike (`docs/research/hook-spike.md`)
confirmed, from decompiled CLI source, that `PreToolUse(ExitPlanMode)`
reliably carries the model's full plan text — but whether a hook's
`additionalContext` output demonstrably reaches the model, versus being
silently dropped, was **not** confirmed with a live run in the build
sandbox (no authenticated `claude` session was available there). Rather than
ship an unverified claim, the hook implements both delivery mechanisms
behind one constant: `additionalContext` injection (the shipped default,
pending that confirmation) and an `exit 2`/stderr block (a verified-working
fallback — coarser, since it interrupts the tool call once instead of
quietly informing). Run `docs/hook-selfcheck.md`'s two-minute procedure on
your own machine to find out which one you're actually getting, and flip the
constant in `bin/scout-hook-plan.mjs` if it turns out to be the fallback.

### Prefer typing `/scout add` without the colon?

A plugin can never claim the bare `/scout` command — that namespace belongs
to *personal* skills. Scout ships a tiny, logic-free personal router
(`templates/scout-router/`) that installs to `~/.claude/skills/scout/` and
forwards `/scout <verb> <args>` straight into the plugin's real machinery.
It contains no duplicated logic, so it almost never needs updating even as
the plugin evolves underneath it. `/scout:setup` offers to install it for
you (Phase 4); see `docs/router.md` for the manual install steps today.

## Tiers

Tiers are depth, not paywalls — everything here is open source, and Tier 0
alone is the whole product for most people.

| Tier | What it adds | Requirements |
|---|---|---|
| **0 — Plugin** (default) | Full Scout, as designed: local pack, ingestion, manifest, surfacing, all verbs. Shipped today: `add`, `start`, `list`, `archive`, `explain`, `review`; `setup` lands as this plugin's next version (see "Shipped today," above). Working in under 60 seconds. | Just the plugin. Degrades gracefully outside Claude Code (see below) — nothing else required. |
| **1 — Synced pack** | Point your pack folder at a personal git remote: cross-machine sync, history, a free Pages-hosted browse page. | A git remote you own. |
| **2 — Remote connector** (optional) | A self-hosted MCP endpoint (e.g. a Cloudflare Worker) for claude.ai connectors and a permanent add-from-anywhere URL. | Self-hosting appetite. Documented, optional, never the default — design doc lands in Phase 5 (task 5.3, not yet written). |

## The three-plane update model

Scout separates three things that change at different rates, so an update to
one never touches the others:

| Plane | Lives in | Update behavior |
|---|---|---|
| **Scout's code** — skills, hooks, MCP server | This plugin marketplace | **Subscribe-not-fork.** Push a fix here, every installed user has it on their next update check — no reinstall, no infrastructure. (Copy-the-files installs are a deliberate exception: they forked on purpose, and Scout never overwrites a fork.) |
| **Your pack data** | Your own folder, optionally your own git repo | **Never touched by a Scout update, ever.** Entries carry a schema version; new Scout code reads old entries forever. This is the file-over-app promise, kept literally: nothing Scout ships can rewrite, migrate, or delete a file in your pack. |
| **Compiled artifacts in your projects** — the manifest + standing-instructions block already written into some project's `CLAUDE.md` | That project's own `CLAUDE.md`/`AGENTS.md` | **Lazy.** A project picks up new pack entries and new Scout capabilities the next time you run `/scout:start` there — not automatically, and not silently. |

## Graceful degradation

The **manifest layer works in any agent** — Cursor, Codex, whatever you're
running — because it's plain text compiled into `CLAUDE.md`/`AGENTS.md`.
Your agent has standing awareness of your active pack on day one, everywhere,
the same way it "knows" your dependencies exist.

The **reports layer is Claude Code-only.** Gated, planning-moment surfacing
(`/scout:review` and its ambient counterpart) runs on Claude Code's hook
system, which other agents don't expose. Outside Claude Code you keep full
ambient awareness; you lose the proactive nudge at planning time. The docs
say this plainly because a tool that quietly does less than advertised is
worse than one that says so.

## File-over-app, kept literally

Your pack is one JSON file per entry, in a folder you chose, readable and
diffable with tools you already have. A Scout update is a change to *code* —
skills, the compiler, the MCP server. It is never a migration script against
*your* files. If Scout disappeared tomorrow, your pack would still be a
folder of plain JSON you can read with `cat`.

## Coexistence with the community `scout` plugin

There is an unrelated `scout` plugin (a web-search tool) in the community
marketplace, published by a different author. Plugin names in Claude Code
are scoped to the marketplace they came from, not global, so installing both
is safe: they show up as `scout@scout` (this project) and
`scout@shidoyu-scout` (the community one), each with its own command
namespace and no shared skill names to collide. This was verified empirically
in an isolated `CLAUDE_CONFIG_DIR` — both plugins installed and enabled
side by side with no conflict (`claude plugin list` showed both `enabled`,
`claude plugin details` showed distinct component inventories). Observing
the actual live `/scout:*` slash-command resolution inside an interactive
session was **not** verified — the isolated sandbox has no authenticated
session by design, and re-using the real login there was out of scope for a
throwaway experiment. Since the two plugins don't share any skill name today
(`add`/`start` vs. `fetch`/`search`/`setup`), there is nothing to actually
disambiguate in practice.

## Learn more

- `docs/prd.md` — the product requirements this repo builds toward.
- `docs/plan.md` — build plan, phases, and binding technical rules.
- `docs/router.md` — install steps for the optional bare-`/scout` router.
- `docs/hook-selfcheck.md` — two-minute procedure to confirm which planning-moment
  hook delivery mechanism (`additionalContext` vs. the `exit 2` fallback) is
  actually reaching the model on your machine; see [Reports](#reports) above.
- The Tier 2 remote connector design doc is planned for Phase 5 (task 5.3,
  not yet written); it will land at `docs/tier2-design.md`.
- `DECISIONS.md` — the project's append-only decision log.
- `CHANGELOG.md` — what shipped, when.

## Development

Plain Node ≥18, zero npm dependencies for the core (the bundled MCP server is
the one documented exception, using `@modelcontextprotocol/sdk`). No build
step.

```
npm ci
node --test test/*.test.mjs
node bin/scout-store.mjs validate --all --pack fixtures/seed-pack
```

## License

MIT — see `LICENSE`.
