# PRD — Scout

*Scout goes ahead and reports back what's useful — sets up camp at project start, then hands you the right tool from the pack at the moment it applies.*

**Name:** Scout (command namespace: `/scout`) · **The pack** is the link-collection module; **the manifest** is its compiled ambient index
**Version:** 0.4 · July 19, 2026
**Owner:** Nick
**Status:** Draft — open-source direction folded in
**Changes in 0.3:** plugin-first/local-first inversion (tiers), agent-as-brain principle, embeddings deferred, ships-empty, the tracks concept and courier prompt, three-plane update model, discovery-not-curation stance, ninth seed entry.
**Changes in 0.4:** `review` → `survey` (fixes the code-review ambiguity; plain English and in-register), verb slate locked (`add, archive, list, start, explain, survey, setup`), the register doctrine ("plain in, brand out"), the write-deliberate/read-ambient principle (tenet 7).

---

## 1. Problem

Useful UI libraries, effects, frameworks, and skills are discovered continuously but forgotten at the exact moment they'd apply. Retroactive application is costly; prospective memory ("remember to use X when doing Y") reliably fails — both for the user and for models asked to "remember" to check a tool. Separately, valuable project practices (changelogs, decision logs, milestone screenshots) are inconsistently applied across projects because they depend on the same failing memory.

The core design constraint, stated as a requirement: **the system must require zero recall from the user during a working session.** No remembering to invoke, no remembering trigger vocabulary, no remembering the tool exists. Surfacing must be ambient and structural, not behavioral.

## 2. Solution summary

Scout is an open-source, local-first companion for coding agents, installed as a plugin, with two entry types in one store:

- **Pack entries** — analyzed links (libraries, effects, tools, skills) that surface *conditionally* when project work matches their use cases.
- **Step entries** — project practices that execute at project start or persist as standing instructions the agent follows throughout.

One store (a folder of files the user owns), one command namespace, one setup ritual per project. Scout is choreography over the user's files; all intelligence is borrowed from the host agent.

## 3. Design tenets

1. **Zero recall.** Relevant pack entries appear during feature work without any user or model "remembering." If a behavior depends on remembering, it's misdesigned.
2. **File over app** (the Obsidian principle). The pack is plain JSON/markdown files in a folder the user owns. Scout is a lens over those files; if Scout vanished tomorrow, the pack remains a perfectly readable record of the user's tools and practices. No lock-in, no export problem, no migration risk.
3. **Agent as brain.** Scout performs no LLM calls of its own. Ingestion analysis, compilation, matching judgment, and history scanning are all performed by the host agent the user already runs. Zero API keys, zero model configuration, zero marginal inference cost.
4. **Local by default.** After install, everything happens on the filesystem or inside the host agent. No servers, no accounts, no telemetry. Data leaves the machine only when the user physically carries it (see §5.8, §7.3).
5. **Ships empty; structure, not content.** Scout imposes no defaults. Shipping "the best 25 libraries" would converge every user's output (the shadcn homogenization lesson: it had an ownership escape hatch, and defaults won anyway). Taste is emergent — it lives in the pack's contents, its archives, and its supersession chains, never in a Scout-shipped list.
6. **Restraint.** Scout expects to say nothing most of the time. Suggestions pass a gate; rejections are logged; "nothing surfaced" is a good result.
7. **Write-deliberate, read-ambient.** Three ways into the pack (`add`, setup's scan, wrap-phase nudges — each user-ratified); no retrieval verb out. Using the pack is `start` wiring it into a project and reports arriving unbidden; `survey` is a backstop, not a workflow. The day someone needs a "use my pack" command, zero-recall has failed.

## 4. Non-goals

- Not a general bookmark manager. Entries are things with *application potential in projects*, curated small.
- Not a recommendation engine. No taste profiles, no "users like you," no ranked pack charts. Discovery of community packs may exist (flat, unranked, community-owned directory — the awesome-list pattern); curation never does. Scout links to *example* packs framed explicitly as personal, never "best."
- Not a taxonomy. No folders, no tag trees, no ratings. Matching is judgment-based; the only organizational metadata is status and phase.
- Not stack-policing. Stack metadata is recorded at ingest and available to matching, but never hard-filters or editorializes (e.g., React vs. Angular). At most, stack appears as context on a surfaced card.
- Not a hosted service. The optional Tier 2 connector exists for those who want it; it is never required and never the default path.

## 5. Architecture

### 5.0 Tiers

| Tier | What it adds | Requirements |
|---|---|---|
| **0 — Plugin (default)** | Full Scout: local pack, ingestion, manifest, surfacing, all verbs. Working in ~60 seconds. | The host agent (Claude Code; degraded-gracefully elsewhere, §5.6). Nothing else. |
| **1 — Synced pack** | Pack folder pointed at a personal git remote: cross-machine sync, history, free Pages-hosted browse page. | A git remote the user owns. |
| **2 — Remote connector (optional)** | Self-hosted MCP endpoint (e.g., Cloudflare Worker) for claude.ai connectors across work/personal accounts and a permanent add-from-anywhere URL. | Self-hosting appetite. Documented; never default. |

Tiers are depth, not paywalls. Everything is open source.

```
                 ┌──────────────────────────────────┐
                 │   THE PACK (user-owned folder)    │
                 │   1 file per entry (JSON/md)      │
                 │   optionally a git repo (Tier 1)  │
                 └───────┬───────────────┬──────────┘
                         │               │
            ┌────────────┘               └────────────────┐
            ▼                                             ▼
   INGESTION (host agent)                    COMPILE (host agent, on change)
   url → fetch → analysis                    ├─ the manifest (active one-liners, capped)
   text → step drafting                      └─ standing-instructions block
   → draft → user confirms → commit                        │
            ▲                                              ▼
   ┌────────┴─────────────┐              ┌────────────────────────────────┐
   │  CAPTURE              │              │  DELIVERY                      │
   │  /scout add           │              │  CLAUDE.md / AGENTS.md blocks  │
   │  natural language     │              │  planning-moment hook (gated   │
   │  (Tier 2: remote URL) │              │    reports; Claude Code)       │
   └──────────────────────┘              │  MCP verbs (local stdio)       │
                                          │  browse page (static, local    │
                                          │    or Pages)                   │
                                          └────────────────────────────────┘
```

### 5.1 The store

- One entry per JSON file in a plain folder (`~/.scout/pack` or user-chosen); optionally a git repo for Tier 1. Human-readable, hand-editable, diffable.
- **Schema versioning:** entries carry a `schema` field; new Scout versions read old entries forever. A Scout update never migrates or rewrites the user's data.
- Git history (Tier 1) provides the audit trail: when an entry was added, archived, superseded, and why.

### 5.2 Ingestion

Performed by the host agent as a skill; Scout supplies the choreography and the prompts.

- **URL input:** fetch page/repo → analysis produces summary, `surfaces_when` conditions, `ambient_line`, install string, stack metadata. Output is a *draft* shown for confirmation before commit.
- **Text input:** drafts a step entry — instruction, inferred phase, `produces` artifact — shown for confirmation.
- **Overlap detection:** new entries are compared against existing active entries; significant overlap is flagged in the draft (e.g., "overlaps Silk — note the distinction?") so the distinction is captured at save time.
- **Fetched content is data, not instructions:** page/repo content is strictly material to analyze. Embedded instructions in fetched sources are flagged in the draft and never followed.
- **Lazy verification:** entries carry a `verified` timestamp. Staleness is checked when an entry is about to be surfaced or adopted — offer re-verify then. No scheduler, no cron, no infrastructure. Surfaced cards show age when stale.

### 5.3 Compile

Runs via the host agent whenever the pack changes. Produces two artifacts:

1. **The manifest** — the `ambient_line` of every `status: active` pack entry, hard-capped at ~25 lines. If the cap is exceeded, compile stops with a prompt to archive or demote. The cap is a feature: it forces curation, keeps context pollution at zero, and a pack you can't carry is a pack you don't bring.
2. **Standing-instructions block** — all `ongoing` and `milestone` phase steps rendered as CLAUDE.md/AGENTS.md instructions (e.g., maintain DECISIONS.md; prompt for screenshots after defined milestone triggers).

**Embeddings: deferred (v2+, if ever).** At personal-pack scale (30–150 entries), the full `surfaces_when` index is 2–4K tokens — small enough to hand to the matching step whole and let LLM judgment do the matching, which handles "does this feature genuinely benefit" better than cosine similarity anyway. Vector search earns its place somewhere north of ~500 entries, which the manifest-cap philosophy suggests no one should have. No embedding model, no API key, no index build in v1.

### 5.4 `start` — the per-project ritual

Invoked once per new project (`/scout start`):

1. Pull latest pack state; compile if stale.
2. **Brief project interview** (pattern: Pocock's per-repo setup skill): 2–3 overlay questions — any steps to skip here? what concretely counts as a "milestone" in this project? Answers recorded as the project overlay, not silent defaults.
3. Execute all `phase: init` steps (scaffold CHANGELOG.md, DECISIONS.md, etc.).
4. Write the manifest + standing-instructions block into the project's CLAUDE.md/AGENTS.md (marked section, idempotent — re-running updates in place; this is also how projects lazily pick up new Scout capabilities, §8).
5. Record the overlay ("this project skips the changelog") locally — the canonical runbook is never forked.

### 5.5 `setup` — first-ever onboarding + the history scan

Invoked once per user (`/scout setup`), immediately after plugin install:

1. Choose/confirm the pack folder location; offer Tier 1 (point at a git remote).
2. **Offer the history scan** — the cold-start answer to ships-empty. With permission, the host agent scans the user's local footprint and proposes entries *derived from their own revealed behavior*:
   - **Repos/artifacts (primary corpus):** recurring dependencies across `package.json` files ("framer-motion in 5 of 7 projects — pack it?"); practice files that keep appearing (CHANGELOG.md in every repo = a step you already follow; in half = one you aspire to — both proposed, framed differently); recurring scripts; patterns across per-project CLAUDE.md files (anything repeatedly hand-written is manifest material by definition).
   - **Agent session transcripts (secondary, v1.5):** local session history — noisier, but captures libraries discussed-and-liked that never landed.
3. All scan output flows through the standard gate-and-confirm machinery: evidence attached ("found in 4 of 6 repos," with paths), capped at top 5–7 by recurrence, batch-reviewable, nothing auto-committed. The scan proposes; the user ratifies.

**Rationale — the unreliability of stated vs revealed preferences:** an onboarding interview asks what people *say* they do (unreliable, and the questions themselves impose a menu). The scan reads what they *did*. Everyone's "defaults" are personal by construction — two users running `setup` get different proposals because they lived different histories. This is the structural answer to the homogenization problem.

**Chat-history bridge (the courier prompt):** Scout never reads claude.ai/chat history — it structurally can't and shouldn't. Instead, the docs and site feature a copyable prompt the user runs *themselves* in their own chat session, scoped to revealed tooling behavior (recurring libraries, tools, practices — never personality assessment). The user reads the output privately and carries whatever rings true into `setup`/`add`. Consent is the physical shape of the flow: every crossing from private history into the pack is the user's own hands. Same drafts-and-gate treatment as all scan output.

**Post-launch recurrence detection** (model-invoked, §7.2): the same detector runs quietly at project wrap — "you hand-added dnd-kit again, third project running — pack it?" One mechanism, two moments: a big retrospective scan at cold start, a small nudge at wrap. No user verb needed for the latter; deliberate re-scans later are natural language to the MCP tool.

### 5.6 Surfacing (the zero-recall core)

- **Always-on layer:** the manifest simply exists in context. The agent plans features with standing awareness of the active pack, the same way it "knows" React exists. No trigger to miss. Because the manifest is plain text in CLAUDE.md/AGENTS.md, this layer works in *any* agent — Cursor, Codex, etc. — on day one.
- **Reports layer (Claude Code):** a hook fires on planning moments (plan/todo generation preferred over raw prompts — richer matching material, fewer noisier moments). The host agent judges the plan against the full active `surfaces_when` index and injects survivors as a compact **report**: link, one-liner, why it matched. The user clicks through to refresh their memory, then adopts or ignores.
- **The gate** (pattern: Emil Kowalski's find-animation-opportunities — a filter as much as a finder): every candidate must pass (1) does this feature genuinely benefit, or is it a surface-level keyword match? (2) is adopting now meaningfully cheaper than retrofitting later? (3) has this entry been dismissed in a similar context? Failures are logged to a **rejection ledger** with reasons — richer signal than raw dismissal counts. Hard cap: max 2 reports per planning moment. A quiet system that's right is trusted; a chatty system is learned-around and dies. Target: reports feel apt ≥ 2 of 3 times, and "nothing surfaced" is a good result.
- **`survey` (retroactive backstop):** ambient surfacing is the offense; `/scout survey` is the safety net. At milestone/wrap, surveys the whole project against the full active pack and reports missed opportunities — gate-filtered and capped exactly like live reports. Plain English ("survey the site") and perfectly in-register (surveying terrain is scout work), with none of the code-review ambiguity `review` carried.
- **Graceful degradation:** hooks are Claude Code-specific. Elsewhere, users get the manifest layer (full ambient awareness) without gated planning-time reports. The docs say this plainly.

### 5.7 Lifecycle

- Statuses: `active → archived`. Archived entries leave the manifest and match pool immediately.
- `superseded_by` links archive to successor. If a match would have hit an archived entry, the successor surfaces instead, with a one-line note ("you archived shadcn in favor of X").
- `dismissals` increments when a report is ignored in similar contexts. At threshold (default 3), Scout asks once: "archive this?" — then respects the answer. No eternal nagging.
- **Signal symmetry:** dismissal tracking is the *removal* signal; wrap-phase recurrence detection (§5.5) is its *addition* twin. Repeated ignoring suggests archiving; repeated manual adoption suggests packing. One learning posture, two directions.
- Resurrection: archiving is never deletion. Any archived entry reactivates with full history intact.
- The archive is taste data: supersession chains are a public changelog of evolving judgment. (Parked v2 idea: rendering supersession chains as the centerpiece of a shared pack page.)

### 5.8 Pack sharing (format, not platform)

Packs are shareable because they're files: "here's my pack" is a repo link — forkable, diffable, cherry-pickable, in the dotfiles tradition. Scout builds no social features; the file format *is* the sharing mechanism. The owner's own pack (the nine seed entries, §6) is published as the first example. Community discovery, if it emerges, lives in a community-owned flat directory (§4). Browsing someone's pack reveals their taste faster than their portfolio — what they reach for, not just what they shipped.

## 6. Entry schema

One structure, two types, discriminated by `type`.

```jsonc
{
  // shared core
  "schema": 1,                     // schema version; new code reads old entries forever
  "id": "dialkit",                 // stable slug
  "type": "pack",                  // "pack" | "step"
  "title": "DialKit",
  "status": "active",              // "active" | "archived"
  "superseded_by": null,           // id of successor when archived in favor of something
  "notes": null,                   // user's own words: why saved, caveats, overlap notes
  "added": "2026-07-17",
  "verified": "2026-07-17",        // last verification of source (lazy, §5.2)
  "dismissals": 0,

  // pack-only
  "url": "https://…",
  "repo": "https://github.com/…",  // optional
  "stack": ["react"],              // recorded, not enforced
  "install": "npm i dialkit",
  "summary": "…",                  // 2–3 sentences, what it is and what it's good at
  "surfaces_when": ["…", "…"],     // machine-side match conditions, generated at ingest
  "ambient_line": "…",             // the one-liner that earns a slot in the manifest

  // step-only
  "instruction": null,             // imperative practice text
  "phase": null,                   // "init" | "ongoing" | "milestone" | "wrap"
  "automation": null,              // script/skill path if automated
  "produces": null                 // artifact created/maintained, e.g. "CHANGELOG.md"
}
```

**Seed entries — Nick's pack, published as the first example (never pre-installed; Scout ships empty):**
Pack: shadcn/ui, Paper Shaders, DialKit, emilkowalski/skills, mattpocock/skills (the references that shaped Scout, stored in Scout).
Steps: changelog (init+ongoing), decision log (ongoing, produces DECISIONS.md), milestone screenshots (milestone), **agent-team builds** (ongoing): *for large features — multi-file, multi-day, or architecturally novel — plan first, then build with an agent team: a dedicated orchestrator, a reviewer, and several build subagents; assign models per task (capable models for orchestration/review, lighter models for well-specified builds), keeping cost and tokens reasonable.*
These nine are the acceptance fixtures for ingestion quality — the two skills repos deliberately pressure-test meta-entries (collections of practices, not npm packages).

## 7. User-invoked vs. Model-invoked

A first-class design boundary. **User-invoked** actions are explicit, deliberate, and always confirmed. **Model-invoked** actions are ambient, automatic, and never demand more attention than a glanceable note.

### 7.1 User-invoked

| Action | Surface | Behavior |
|---|---|---|
| `/scout add <url>` | Slash command (plugin) or natural language (MCP) | Routes to pack ingestion. Draft → confirm → commit. |
| `/scout add <text>` | Same | Routes to step drafting. Inferred type + phase shown ("Adding as **step**, phase: **milestone** — look right?") → confirm → commit. Input shape *is* the routing. |
| `/scout archive <id> [in favor of <id>]` | Same | Sets status, optional supersession pointer. Confirmed before commit. |
| `/scout list [filter]` | Same | Readable listing by type/status. |
| `/scout explain <id>` | Same | Full entry detail *with provenance*: summary, surfaces_when, notes, supersession history, dismissal history, reasoning. The name promises reasoning, and the output delivers it. |
| `/scout start` | Same | The per-project ritual (§5.4). Once per project. |
| `/scout survey` | Same | Retroactive backstop against the full pack (§5.6). Milestone/wrap moments. |
| `/scout setup` | Same | First-ever onboarding + optional history scan (§5.5). Once per user. |
| Browse page | Any browser | View collection (Steps / Pack tabs), archive graveyard with supersession chains, reactivate. Static; local or Pages. |
| The courier prompt | User's own chat session | User-run chat-history scan; user chooses what crosses into the pack (§5.5). |
| Adopt / ignore a report | In-flow during coding | The user's call; ignoring in similar contexts feeds the dismissal counter. |
| Answer an archive nudge | In-flow | One-time "archive this?" at dismissal threshold. |

**Verb slate — locked: `add, archive, list, start, explain, survey, setup`.** Every verb is a common English word; nothing programmer-coded. `start` (per-project) vs `setup` (once ever) are distinguished by scope. **Register doctrine — plain in, brand out:** the user speaks to Scout in plain English (commands cost recall, so they take universal names); Scout speaks back in-world (narration and output cost nothing to read, so they can carry the brand). Scan narration and report framing draw from the expedition vocabulary — *reading your tracks… gathering signals… surveying past projects… here are the markers, with evidence* — none of which anyone must ever remember or type. Brand names live in concepts, copy, and Scout's voice; never in required vocabulary. **Layering rule** (via Pocock): user-invoked commands orchestrate model-invoked machinery but never chain into other user-invoked commands — the command surface stays flat.

### 7.2 Model-invoked

| Action | Trigger | Behavior |
|---|---|---|
| Ambient awareness | Always, once `start` has run | Agent plans with the manifest in context; naturally proposes a pack library where apt. No lookup call involved. |
| Gated reports | Hook on plan/todo generation (Claude Code) | Judge plan against full surfaces_when index → gate (§5.6) → inject ≤2 reports as a compact FYI. |
| Standing-instruction execution | Continuously / at defined moments | Maintains DECISIONS.md when meaningful choices occur; prompts for screenshots at concretely defined milestone triggers; applies agent-team practice to large features. |
| Ingestion analysis | On `add` | Host agent fetches, analyzes, drafts. (User-triggered; model-executed; user-confirmed.) |
| Overlap detection | On `add` | Flags significant overlap with existing entries in the draft. |
| Recurrence detection | At project wrap | "You hand-added X again, third project running — pack it?" The addition twin of dismissal tracking. Proposes only. |
| Supersession redirect | On match against archived entry | Surfaces successor with one-line provenance note. |
| Dismissal tracking | On repeated ignores | Increments counter; raises archive nudge at threshold. Never auto-archives. |
| Lazy verification | When an entry is about to surface / be adopted | Checks staleness; offers re-verify. No scheduler. |

**Boundary rules:** the model never commits an entry without user confirmation; never archives without user confirmation; never surfaces more than a glanceable note in-flow. The user never has to remember vocabulary, invoke a check during feature work, or know the match machinery exists.

### 7.3 The courier pattern (privacy architecture)

Whenever data crosses a boundary — private chat history into the pack (§5.5), or a locally earned patch onto the public site (§11 parked) — the user physically carries it: copy a prompt, read output privately, choose what to paste; or copy a locally generated code, paste it into a static client-side renderer. Scout never reaches across the boundary itself. Consent isn't a checkbox; it's the shape of the flow.

## 8. Distribution & updates (three planes)

| Plane | Mechanism | Update behavior |
|---|---|---|
| **Scout's code** (skills, hooks, commands, scan logic) | Claude Code plugin marketplace (a git repo the owner pushes to) | **Subscribe-not-fork:** ship today, installed users have it on next update check — effectively next-day, zero infrastructure. Copy-the-files installs (skills.sh-style) deliberately do *not* auto-update — they forked on purpose; overwriting their edits would be a betrayal. Two install modes, two philosophies, both documented. |
| **Pack data** (the user's entries) | The user's own folder/repo | Never touched by Scout updates. Schema versioning (§5.1): new code reads old entries forever. Syncs across machines via the user's git remote (Tier 1). |
| **Compiled artifacts in projects** (manifest + standing instructions already written into some project's CLAUDE.md) | Refreshed by `start` (idempotent) | Lazy: existing projects pick up new capabilities on next `/scout start`. Documented plainly so no one files "update didn't apply." |

MCP: local stdio server bundled in the plugin (no auth needed — it's local). Tier 2's remote streamable-HTTP endpoint (self-hosted Worker, bearer token) exists solely for claude.ai connectors and add-from-anywhere; documented, optional, never default.

## 9. Build phases

| Phase | Scope | Value unlocked |
|---|---|---|
| **1. Store + ingestion** | Folder schema, ingestion prompts (URL + text), the nine seed entries as acceptance fixtures, confirmation flow via plain conversation | The keystone. Ingestion quality determines everything downstream; iterate hardest here. |
| **2. Compile + start ritual + plugin packaging** | The manifest, standing-instructions block, CLAUDE.md/AGENTS.md injection, init-step execution, idempotent re-run, plugin marketplace scaffolding | ~80% of daily value; fully local; the manifest layer already works in any agent. |
| **3. Reports (hook + gate)** | Planning-moment hook, LLM-judged matching over the surfaces_when index, the gate, rejection ledger, dismissal capture | The long-tail zero-recall layer beyond the manifest cap. |
| **4. `setup` + history scan** | Onboarding flow, repo/artifact scan with evidence-attached proposals, the courier prompt (docs + site) | The cold-start answer; personal defaults by construction. |
| **5. Browse page + Tier 2 (optional)** | Static cards page (local/Pages), graveyard, reactivation; the self-hosted remote connector for those who want it | Least load-bearing; Tier 2 is the owner's own deployment first, docs second. |

Phases 1–2 are testable inside a single Claude Code session before anything is packaged.

## 10. Success criteria

- Tier 0 install → first `add` in under 60 seconds, zero configuration, zero keys.
- Capturing a link or practice takes < 15 seconds from any connected surface.
- After `start`, a new project has all init artifacts and standing instructions with no manual steps.
- Reports feel apt ≥ 2 of 3 times (precision over recall); "nothing surfaced" sessions are common and correct.
- At least one retroactive-application incident avoided per month — a library adopted at build time that would previously have been forgotten.
- `setup`'s scan proposals make a first-time user say "that *is* what I do" — personal defaults, not imposed ones.
- The user never types a trigger phrase, never invokes a check during feature work, and never sees a report for an archived approach.
- The manifest stays at or under the 25-line cap without feeling like a loss.
- A Scout code update never modifies a user's pack data.

## 11. Prior art & parked ideas

- **emilkowalski/skills → find-animation-opportunities:** the gate-and-reject posture. Adopted: the surfacing gate, rejection ledger with reasons, hard report caps, "nothing surfaced is a good result," fetched-content-is-data rule, adoption-ready cards. Its retroactive mode is inverted into `/scout survey` — backstop, not primary mechanism.
- **mattpocock/skills:** independently organizes on the user-invoked/model-invoked axis (§7), validating the boundary. Adopted: the layering rule, the per-repo interview pattern (now inside `start`), and the plugin "subscribe rather than fork" distribution model.
- **Obsidian:** file-over-app as trust architecture (§3, tenet 2).
- **Parked — expedition patches:** earned collectibles at Any Distance Achievement Medal quality, rewarding *curation, never accumulation* (first supersession, a survey that finds nothing, a season under the manifest cap — never entry counts). Locally generated; shared via the courier pattern: paste a locally minted code into a static client-side renderer on the site — no registry, no server, no account. Codes are forgeable by design: patches are collectibles, not credentials, and adding verification means adding a secret, a server, and unraveling the thesis over a sticker. Detail lives in the marketing PRD; v-later.
- **Parked — supersession chains as shared-pack centerpiece:** the archive is the richest taste signal (what someone stopped using, and why). v2.

## 12. Open questions

1. ~~Service name.~~ **Resolved: Scout, with the pack.** Wilderness/expedition register — warm, not twee, not military. Lexicon (capped, user-facing nouns only): **Scout**, **the pack**, **the manifest**, **reports**, **tracks** (the *concept* behind setup's scan — retired as a verb, alive in copy: "Scout reads tracks, not answers"). Scout's *voice* additionally draws on **signals** (what the scan detects), **markers** (what it proposes, evidence attached), and expedition narration ("gathering signals… surveying past projects…") per the register doctrine (§7.1) — voice vocabulary is free because nobody has to remember it. Machinery keeps literal names.
2. ~~Store substrate.~~ **Resolved: local folder / user's git repo (Tiers 0–1); optional self-hosted Worker at Tier 2 only.**
3. **Dismissal capture mechanics:** what concretely counts as an "ignore"? Report surfaced + different library chosen for the same need = strong signal; report surfaced + feature abandoned = not. Define before Phase 3.
4. **Milestone trigger definition** for the screenshot step: current draft is "after any stakeholder demo, or when a major feature first works end-to-end, prompt to capture." Confirm or refine.
5. **"Large feature" threshold** for the agent-team step: current draft is "multi-file, multi-day, or architecturally novel." Owner to calibrate against real practice.
6. **Manifest cap value:** 25 is a starting hypothesis; tune against real context-pollution feel.
7. **Recurrence-detection threshold:** how many repeat manual adoptions trigger the wrap-phase "pack it?" nudge (draft: 3, mirroring the dismissal threshold — symmetry is tidy but should be validated).
8. **Naming/namespace availability:** GitHub org/repo and domain for the open-source release (see marketing PRD Open Questions — "scout" is taken broadly; establish "Scout for Claude Code / for agents" phrasing early). Blocks the plugin marketplace name, so resolve before Phase 2 completes.
