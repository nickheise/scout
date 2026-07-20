# Decisions

Append-only log of meaningful project decisions. One entry per decision,
newest last. Statuses: `proposed` → `accepted`; an overturned decision stays
in the log with `superseded by D-XXX`.

---

## D-001 — Adopt PRD v0.3 as the build baseline (2026-07-18, accepted)

`docs/prd.md` is the source of truth for scope and tenets. Its resolved
questions (name: Scout; store: local folder / user git repo; embeddings
deferred to v2+; ships empty) are inherited here, not re-litigated.

## D-002 — Dogfood Scout's step practices in this repo (2026-07-18, accepted)

This repo maintains CHANGELOG.md and DECISIONS.md from day one, and large
features are built plan-first with an agent team (orchestrator + reviewer +
build subagents, models assigned per task). Scout's own development is the
first acceptance test of its step entries.

## D-003 — Build order follows PRD §9 phases (2026-07-18, accepted)

Store + ingestion first (the keystone), then compile + `start` + plugin
packaging, then reports, then `setup`/history scan, then browse page + Tier 2.
Phases 1–2 are exercised inside a live Claude Code session before packaging.

## D-004 — Milestone trigger: confirm PRD draft wording (2026-07-18, accepted)

The screenshot step's default trigger ships as drafted: "after any stakeholder
demo, or when a major feature first works end-to-end, prompt to capture."
The `start` interview lets each project redefine what "milestone" means, so
the default only needs to be sane, not perfect. Resolves PRD §12.4 / P-2.

## D-005 — Agent-team threshold: confirm PRD draft wording (2026-07-18, accepted)

The agent-team step applies to features that are "multi-file, multi-day, or
architecturally novel" — the qualitative three-part test, judged by the agent.
Resolves PRD §12.5 / P-3.

## D-006 — Browse page: zero-build static, shadcn-grade polish by hand (2026-07-18, accepted)

A single static HTML/CSS/JS page that reads the pack's JSON directly — no
framework, no build step — because it is the philosophical fit with
file-over-app and survives forever on local disk or GitHub Pages. Owner's
caveat on record: he'd normally reach for GitHub/Vercel/Neon + shadcn-style
UI, and accepted vanilla on the strength of the philosophy. Consequence: the
page must be designed to shadcn-level visual quality by hand; if the UI
outgrows one page, revisit (Astro is the named fallback). Resolves P-7's
stack half; the reactivation mechanism remains open.

## D-007 — Namespace: repo `scout`, plugin `scout`, own marketplace (2026-07-18, accepted)

GitHub repo stays `<owner>/scout`; the plugin is named `scout` and the repo is
its own single-plugin marketplace (mattpocock/skills pattern), so commands keep
the PRD's namespace — note the platform reality is `/scout:add`, not
`/scout add`. Distribution target is Anthropic's *official* plugin directory,
where the `scout` slug is free; we skip the community marketplace, where a
`scout` plugin already exists. If npm/domain are ever needed: `scoutcc` and
scoutcc.dev / getscout.dev are verified available. Avoid outright:
`claude-scout` (active npm package in our niche), `scout-cli` (Docker Scout).
Resolves PRD §12.8 / P-6.

*Addendum 2026-07-19:* a "Recon" rename was floated and declined after
marketing evaluation (register clash, semantic mismatch, worse collision
profile) — full reasoning in `docs/research/naming.md`. The name stays Scout.

*Addendum 2026-07-19 (b):* repo home confirmed as github.com/nickheise/scout
(personal account; no org move). Domain deferred — Nick's lowest concern;
marketing's scoutpack.dev recommendation stays on the table for when the
site needs it. The shidoyu/scout community-marketplace entry costs us
nothing on this path (plugin names are per-marketplace, not global); the one
time-sensitive item is the *official* directory submission — slugs there are
first-come and immutable, so we submit promptly once Phase 2's package
passes the quality bar.

## D-012 — Invocation surface: plugin verbs + optional bare `/scout` router (2026-07-19, accepted)

Verified platform facts: plugins can never expose a bare `/scout` (always
`plugin:skill` namespaced); a personal skill at `~/.claude/skills/scout/` IS
invoked as literally `/scout` with args via $ARGUMENTS; the two namespaces
cannot conflict. Decision: ship the hybrid — the plugin remains the
auto-updating brain (`/scout:add` … via subscribe distribution), and a thin,
logic-free personal router skill (`templates/scout-router/`) provides
`/scout add <url>` for those who want the colon-free form. Built in Phase 2;
offered interactively by `setup` in Phase 4. The router contains no logic so
it almost never needs updating (the subscribe-not-fork boundary stays clean).

## D-008 — Dismissal = inferred at wrap, explicit wave-off immediate (2026-07-18, accepted)

An "ignore" is recorded when a report surfaced for a need AND that need was
subsequently built with a different approach in the same project — judged by
the agent at wrap / `/scout review` moments, written to the rejection ledger
with the reason. Feature abandoned or deferred = no signal. An explicit
in-flow "no thanks" counts immediately. No telemetry; agent-as-brain.
Resolves PRD §12.3 / P-1.

## D-009 — Recurrence threshold: 3, symmetric with dismissals (2026-07-18, accepted)

Three repeat manual adoptions across projects trigger the wrap-phase
"pack it?" nudge. Ships as a named tunable constant. Resolves PRD §12.7 / P-5.

## D-010 — Tier 2 connector: document-only in this effort (2026-07-18, accepted)

Phases 1–4 plus the browse page get built; the self-hosted Worker MCP
connector ships as a documented design (endpoint contract, auth model, deploy
guide skeleton) and gets built when actually wanted. Resolves P-8.

## D-011 — Reactivation via the courier pattern; browse page stays read-only (2026-07-18, accepted)

The static browse page never writes to the pack (it can't, when Pages-hosted).
"Reactivate" on the graveyard yields a copyable natural-language instruction
("reactivate <id> in my scout pack") the user pastes into their agent, which
edits the entry file — consistent with §7.3 and keeping the verb slate final
(no `reactivate` verb). Resolves the second half of P-7.

## D-013 — Planning-moment hook ships with dual delivery (2026-07-19, accepted)

The hook spike confirmed PreToolUse(ExitPlanMode) carries the full plan text,
but whether hook-returned `additionalContext` demonstrably reaches the model
(Q2) remains unverified — headless auth on this machine can't be driven from
the build session, and the owner's live test is pending. Decision: the Phase 3
hook implements both delivery mechanisms behind a constant — `additionalContext`
(primary, pending Q2) and exit-2/stderr (verified fallback, coarser UX) — plus
a documented two-minute self-check so any machine can confirm which works.
Flip the default when Q2 closes; no rework either way.

## D-014 — Adopt PRD v0.4: `review` → `survey`, register doctrine, tenet 7 (2026-07-19, accepted)

`docs/prd.md` updated to v0.4 (supersedes the v0.3 baseline referenced in
D-001; all other decisions unaffected). Three changes, all applied
retroactively to built artifacts:
1. **Verb rename `review` → `survey`** — fixes the code-review ambiguity the
   PRD previously accepted as a known tradeoff; plain English and in-register
   (surveying terrain is scout work). Verb slate LOCKED:
   `add, archive, list, start, explain, survey, setup`. Plugin bumps to
   0.3.0 (user-facing rename).
2. **Register doctrine — plain in, brand out** (§7.1): commands take
   universal names; Scout's narration and report framing may draw on the
   expedition voice (*signals, markers, reading tracks, surveying*) because
   output costs nothing to read and nothing to remember. Machinery keeps
   literal names.
3. **Tenet 7 — write-deliberate, read-ambient**: three user-ratified ways
   into the pack, no retrieval verb out; `survey` is a backstop, not a
   workflow. Compliance note: the shipped MCP server exposes no search tool
   at all (seven CRUD/compile tools only) — if retrieval machinery is ever
   added for the matching step, it stays model-side and is never documented
   as a "search your pack" user workflow.

## D-015 — Marketing site lifted into monorepo at `/site` (2026-07-20, accepted)

The marketing site (built standalone as `scout-marketing` per that repo's own
D-013, which named this exact trigger — "once the site reaches a stable
point") is merged here as `site/` via `git subtree add --squash`, now that
Scout core is public with all five build phases shipped (v0.4.0). Full
site-side history (kickoff through the brand-positioning pass and demo
reconciliation against this repo's real output) is squashed into one commit
(`985ed71`) rather than interleaved, keeping this repo's phase-based commit
history legible; the site's own decision/changelog record stays intact
inside `site/DECISIONS.md` and `site/CHANGELOG.md` as the detailed history.
The standalone `scout-marketing` repo is now superseded — no further pushes
expected there; new site work lands in `site/` going forward.

Consequence for P-9 below: the site thread's brand positioning canvas
(`site/docs/scout-positioning.md`) recommended a category-anchored one-liner
for comparison surfaces (README, plugin directory, launch post) — *"memory
for your coding agent's taste, not its transcripts."* Canonical strings are
in `site/docs/copy-deck.md`'s final section.

**Applied (2026-07-20):** README opening line, `.claude-plugin/plugin.json`,
and `.claude-plugin/marketplace.json` descriptions replaced — all three
previously led with category *rejection* ("not a memory tool"), which
Dunford's framework flags directly: a category a stranger already
half-recognizes (claude-mem-style transcript memory) is more useful
affirmed-then-narrowed than disclaimed outright. New framing leads with the
category, then carves the subsegment in the same breath ("memory for your
coding agent's taste, not its transcripts"). Added a README "Isn't this
just…?" section (memory plugin / knowledge base / awesome list / bookmarks)
matching the copy deck's FAQ verbatim. `package.json`'s description was left
alone — it's `private: true` and never rendered on a comparison surface.
Validated with `claude plugin validate --strict .` (passed).

---

## Pending decisions

| # | Question | Source | Status |
|---|---|---|---|
| P-1 | Dismissal capture mechanics | PRD §12.3 | Resolved → D-008 |
| P-2 | Milestone trigger wording | PRD §12.4 | Resolved → D-004 |
| P-3 | "Large feature" threshold | PRD §12.5 | Resolved → D-005 |
| P-4 | Manifest cap value (25 = starting hypothesis; ship as tunable constant) | PRD §12.6 | Open — non-blocking, tune with real use |
| P-5 | Recurrence-detection threshold | PRD §12.7 | Resolved → D-009 |
| P-6 | GitHub org/repo + plugin marketplace name | PRD §12.8 | Resolved → D-007 |
| P-7 | Browse page stack + reactivation mechanism | PRD §5.7/§7.1 gap | Resolved → D-006, D-011 |
| P-8 | Tier 2 remote connector scope | Scope | Resolved → D-010 |
| P-9 | PRD prose writes space form (`/scout add`) while colon form (`/scout:add`) is the only real syntax (D-007/D-012). Marketing flagged the same drift in the site PRD. Next PRD revision: switch prose to colon form, or add a one-line "space form = concept, colon form = typed" note. Owner's call — repo docs already use colon form everywhere. | Marketing thread, 2026-07-19 | Open — non-blocking |
