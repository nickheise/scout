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
nothing on this path (plugin names are per-marketplace, not global).

*Correction 2026-07-20:* the "submit promptly to the official directory
before the slug is taken" framing above was wrong — re-read against
Anthropic's current plugin docs directly (code.claude.com/docs/en/plugins),
not the earlier research brief. `claude-plugins-official` has **no
submission process at all**: "Anthropic decides which plugins to include at
its discretion. There is no application process, and the submission form
does not add plugins to the official marketplace." There was never a
first-come race to lose here. The only real submission path is the
**community marketplace** (two in-app forms — claude.ai for Team/Enterprise
orgs, or platform.claude.com/plugins/submit for individual authors — running
`claude plugin validate` + automated safety screening, synced nightly once
approved) — and `scout` is already taken there by shidoyu/scout, so listing
in that specific catalog would need a rename scoped to it alone. No action
taken; open question for Nick, not a live time-pressure item.

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

## D-016 — One namespace only: skip the community marketplace under a mismatched name (2026-07-20, accepted)

Verified platform mechanic: a marketplace entry's `name` can differ from the
plugin's own `plugin.json` `name`, and when it does, **the marketplace entry
name — not the plugin's own name — governs that install's command
namespace**. So listing Scout in Anthropic's community marketplace under an
alternate entry name (e.g. `getscout`, since `scout` is already taken there
by an unrelated plugin, shidoyu/scout) would work mechanically: our own
marketplace stays `/scout:*` and the community listing would be `/getscout:*`
for whoever installs from that catalog — two real command surfaces for one
plugin, split by install source.

Decision: never split. Our own marketplace and any other marketplace listing
must use the identical entry name, full stop — a user's command surface
should never depend on where they discovered Scout. Consequence: since
`scout` is unavailable in the community marketplace and a mismatched name is
now ruled out on principle, **Scout does not list in the community
marketplace** under the current name. This isn't a loss — our own
subscribe-from-`nickheise/scout` distribution is complete and independent of
that catalog; a community listing was always discovery upside, never a
dependency. Revisit only if the `scout` slug there ever frees up, or if a
full-project rename is ever on the table (it currently isn't — see D-007,
D-014).

---

## D-017 — Context cost is a CI-gated invariant; audit before restructuring (2026-07-20, accepted)

Scout's most expensive path is also its most invisible: a planning moment
costs ~4,200–4,800 tokens (hook injection + `surfacing/SKILL.md`),
uncached and unbidden, and its designed-common outcome is silence. A tool
whose silent path is expensive earns a poor-value-exchange reputation — so
context cost becomes a first-class invariant, like the manifest cap.

Decision, three parts. (1) Every user-facing artifact's size is measured
and modeled in `docs/research/token-audit.md` on a frequency×cache basis
(always-on / per-planning-moment / per-verb). (2) Those sizes are frozen
as freeze-plus-headroom budgets in `test/budgets.test.mjs`: growth
requires a deliberate budget bump in the same diff — cost changes become
reviewable line items, never silent. Two behavioral invariants are gated
alongside the sizes: all seven verbs keep `disable-model-invocation:
true` (T1 hygiene), and the hook's `MAX_OUTPUT_CHARS` stays ≤ 4,000.
(3) The audit's restructuring findings (surfacing fast-path, doctrine-as-
artifact extraction for the `survey`→`surfacing` and `setup`→`add`
cross-reads) are explicitly **deferred** behind the skill-quality
checklist pass from the "Building Great Agent Skills" review — cutting
tokens by moving doctrine out of the model's face is a behavior change,
and it wants the deletion test's live-usage data first. Audit → checklist
→ restructure, in that order (owner-confirmed 2026-07-20).

---

## D-018 — Field notes: local-only deviation capture, Phase A (2026-07-24, accepted)

Adopted from the Drop skill's field-report design (relayed cross-session;
evaluation in `docs/research/field-reports.md`). Skill-mechanics knowledge
— a documented step failing in a real environment, a user correcting a
run — currently evaporates with the session; the dogfooding register
(skill-checklist-review.md) is blocked on exactly that evidence.

Decision. (1) **Deviation-triggered capture as an architectural
contract**: three closed triggers (`step-failed`,
`undocumented-environment`, `user-corrected`), max one note per run,
smooth runs write nothing — the contract lives in one shared artifact
(`references/field-notes.md`); skills carry only a pointer. (2) **Notes
are machine-local, decoupled from the pack**: `~/.scout/field-notes.jsonl`
— *not* inside the pack dir, so a Tier 1 synced pack can never carry
error text and paths to a git remote. Nothing is collected or
transmitted; the plugin never modifies itself from notes. (3) **Stamping
is code, not prompt**: `bin/scout-note.mjs` validates enums and stamps
schema/date/plugin-version/platform itself — version-filtered triage
(dropping notes from already-fixed versions) only works if the stamp is
never guessed. (4) **Schema designed for Phase B, building only A**: the
note shape already carries what a courier-mediated public report would
need (accretion-only evolution, house rules); Phase B — a user-carried,
reviewed share surface with privacy statement and retention wording —
stays document-only until real external users exist (D-010 pattern).

---

## D-019 — Thin-skills restructure begins: add's paths split, setup points at the craft (2026-07-24, accepted)

First structural application of the skill-checklist review
(`docs/research/skill-checklist-review.md` R2+R3, owner-ruled 2026-07-24
in the order R6-Phase-A → R2 → R3). The add skill's two paths are
exclusive branches resolved by input shape before either is needed —
the checklist's canonical case for external references.

Decision. (1) **R2:** Path A (URL→pack) and Path B (text→step) move
verbatim into `skills/add/path-a-pack-entry.md` and
`skills/add/path-b-step.md`; SKILL.md keeps persona, Hard Rules, routing,
Preflight, Commit, Done-when, and loads exactly one path file per run
("never both" is stated in the routing). Per-invocation context drops
from ~14.2K chars to ~12.4K (URL) / ~8.9K (step). (2) **R3:** setup Hard
Rule 6 now points at the path files instead of all of add's SKILL.md —
the craft is read at the granularity it exists at; the single source of
truth is unchanged (the same files add itself executes). R2 and R3 land
atomically because R2 alone would leave setup's pointer aimed at a file
that no longer contains the craft. (3) Budgets updated in the same diff
per D-017: add's budget cut 14,500 → 6,700 (the enforced reduction);
the path files and `skills-repos.md` join the budgeted-reference table.
R1 (surfacing's dismissal branch) stays open pending the scripted
wave-off/wrap scenario check; R4/R5 stay gated on dogfooding evidence —
now collectable via D-018 field notes.

---

## D-020 — R1 landed: surfacing's dismissal branch behind a context pointer, scenario-verified (2026-07-24, accepted)

The last of the ruled restructurings (skill-checklist-review.md R1).
Dismissal capture and the archive nudge — material serving only the
wave-off and wrap/milestone branches — moved verbatim from
`skills/surfacing/SKILL.md` into `skills/surfacing/dismissals.md`,
behind a pointer section. SKILL.md drops 15,574 → 13,891 chars (~420
tokens off every planning moment, the T2 cost center); budgets cut in
the same diff per D-017 (surfacing 16,000 → 14,200; the combined
planning-moment ceiling 20,000 → 18,200).

The named risk — does dismissal bookkeeping still execute when the
procedure is one hop away — was tested before landing: five isolated
scenario agents ran the restructured skill cold (given only trigger
context, never the procedure), with effects verified independently on
disk (12/12 checks). Planning regression: keyword trap killed at gate
(a), already-committed choice killed at (b), one card surfaced with its
condition quoted verbatim, closed-enum ledger lines only. Wave-off:
silent capture, increment + `dismissed-explicit` line. Nudge threshold:
asked once in the exact documented shape, no marker without an answer,
no archive. Nudge suppression: marker respected, silent. Wrap: CHANGELOG
evidence judged built-differently (not no-signal), `dismissed-inferred`
line naming the alternative. Every dismissal-branch agent explicitly
followed the SKILL.md → dismissals.md pointer.

Scope honesty: these scenarios verify the procedure *across the hop*
under explicit invocation; whether surfacing gets invoked at all at
real wave-off/wrap moments (the description-only trigger, review finding
t2) is a production question that only dogfooding answers — field notes
(D-018) are the instrument.

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

---

## D-021 — D-013's Q2 closed: `additionalContext` delivery confirmed live (2026-07-26, accepted)

The one open verification gap in D-013 — whether a hook's
`hookSpecificOutput.additionalContext` demonstrably reaches the model,
versus being silently dropped — is now closed. Tested live (not
decompiled-source inference) against CLI 2.1.220 in a properly-authenticated
sandbox, using the codeword method `docs/hook-selfcheck.md` prescribes: a
scratch `PreToolUse` hook (matcher `Bash`, since this sandbox's headless
`claude -p` doesn't expose `ExitPlanMode` as a callable tool — see the
method note in `hook-selfcheck.md`) and, independently, a `UserPromptSubmit`
hook, each injected a nonce codeword. Both times the model quoted the
codeword verbatim and correctly attributed it to a hook-originated
system-reminder — not a guess, a genuine report of injected content. Full
trace in `docs/research/hook-spike.md` Q2 (updated) and
`docs/hook-selfcheck.md`'s log.

**Consequence:** `DELIVERY = 'context'` in `bin/scout-hook-plan.mjs` — the
shipped default — is confirmed correct. No code change: D-013 already put
the constant on the right value, this only removes the uncertainty around
it. The `block` fallback stays in the code as a documented, verified-working
safety net (D-013's own reasoning: "no rework either way" if the CLI's hook
plumbing ever changes), not because today's default is in question.

## D-022 — Architecture review follow-ups: sequencing, platform scope, and one deferred question (2026-07-26, accepted)

Prompted by a staff-engineer-style review of Scout's architecture against
Anthropic's "dynamic workflows" post (multi-agent JS-orchestrated
subagent harnesses for classify-and-act / fan-out-synthesize / adversarial
verification / tournament / loop-until-done patterns). Full proposal set
lives in that review's transcript; this entry records the decisions made
against it, owner-confirmed 2026-07-26.

**Sequencing:** eval-workflows-for-Scout's-own-skill-testing (formalizing
the D-020 scenario-agent method — parallel scripted runs against
`surfacing`, graded against a rubric) runs **first**, ahead of any
workflow-based rebuild of the history scan or `/scout:survey`. This
resolves the tension with D-017's audit → checklist → restructure
ordering by generating the dogfooding evidence that ordering was already
waiting on, rather than picking a side.

**Cost posture (owner-stated, binding on future proposals):** Scout's
primary audience is developers on personal projects, not teams needing
high-performance/high-complexity orchestration. The owner has a strong
bias toward token/context efficiency and speed over capability breadth —
"if it's slow or costly relative to what they get back, people simply
won't use it." Concretely: workflow-based restructurings of the history
scan and `/scout:survey` (proposed during the review) are **downgraded
from default behavior to a conditionally-offered mode** (e.g., triggered
only past some corpus-size threshold), not something every user pays for
on every run — the same "does it really need more compute?" gate the
source post itself applies. This is the standing test for any future
workflows proposal in this repo: default paths stay cheap; workflow
machinery is opt-in or threshold-gated, never a tax on the common case.

**Platform scope — resolved, not actually in tension.** The owner
originally worried that going deeper on Claude-Code-specific machinery
(workflows) versus staying broadly cross-platform (Codex, Cursor) was a
real tradeoff requiring a choice. On inspection it isn't: Scout's three-
plane split (README "Graceful degradation") already makes the ambient
manifest layer the only cross-platform surface, and it's plain text with
no hook or workflow involvement at all. Workflows would only ever be
applied inside skills that are already Claude-Code-only today (`/scout:
survey`, the history scan) — those verbs never ran on Codex/Cursor to
begin with, so adopting workflows inside them costs the cross-platform
story nothing. No decision to make here beyond noting it: depth on T3
Claude-Code verbs and breadth on the ambient layer are independent axes,
not opposing ends of one dial.

**Pack-maintenance (mining ledger/dismissal/staleness data to keep the
pack honest over time) — assessed, not built, not scheduled.** This
capability is real and eventually wanted (the README's own "kept honest by
archives and supersession" claim implies something has to do that
keeping-honest work eventually) but its value is gated by *usage
maturity*, not by whether dynamic workflows exist as a mechanism: a
fresh install's ledger is empty, so there's nothing yet to mine. This is
the same phased posture as D-018 (field notes Phase A before a Phase B
share surface) — build it once real ledger/dismissal history has
accumulated across dogfooding, not now. It also collides with D-014's
locked seven-verb slate (it's neither `survey` nor `setup`'s job as
currently scoped) — reopening that slate is a separate decision, not
implied by this one. No verb added, no code written.

**Deferred to a later review — noted, not resolved (see also D-023):** whether the
"dynamic workflows" era normalizes practices Scout's own tenets currently
reject (the source post's own example — mining recent chat sessions for
corrections — is precisely what `setup` Hard Rule 3 forbids; Scout's
courier pattern exists to keep that boundary user-carried, not
agent-crossed). No tenet changes now. Revisit once real-world workflow
practice has matured enough to judge whether that tension is worth
reopening, not on a fixed date.

---

## D-023 — Install was broken by a redundant manifest hooks key; verify installs empirically (2026-07-26, accepted)

A user install of v0.4.0 failed outright: `Duplicate hooks file detected:
./hooks/hooks.json resolves to already-loaded file`. Root cause:
`.claude-plugin/plugin.json` declared `"hooks": "./hooks/hooks.json"` while
Claude Code already auto-loads that conventional path, so the manifest key
registered it twice. Per the plugins reference, `manifest.hooks` exists only
to point at *additional* hook files beyond the standard one.

Three things worth recording beyond the one-line fix.

1. **The failure was total, and silent to our own CI.** `claude plugin list`
   reported `Status: × failed to load` — not a degraded hooks layer but the
   entire plugin unavailable, every verb and the MCP server included. Yet
   `claude plugin validate --strict .` passed green, because with both
   manifests present it validates only the *marketplace* manifest, and
   because duplicate-hooks detection happens at load time, not validate
   time. Our packaging test and CI both relied on `validate`, so nothing
   caught it. **Consequence: `validate` is necessary but not sufficient.
   Release checks must include a real install into an isolated
   `CLAUDE_CONFIG_DIR` and an assertion on `plugin list` status** — the
   check that would have caught this.

   **Landed the same day.** `test/packaging.test.mjs` now carries three
   guards, and all three were verified by reintroducing the bug and
   confirming they fail: (i) a static assertion that `plugin.hooks` never
   names `hooks/hooks.json` — no CLI needed, so it runs on every CI run
   everywhere; (ii) an existence/shape check on the now-unreferenced
   `hooks/hooks.json` itself, which nothing else guarded once the manifest
   key was removed; (iii) a real marketplace install into a throwaway
   `CLAUDE_CONFIG_DIR` asserting `plugin list` reports the plugin enabled
   and `plugin details` shows all 8 skills and both hooks — self-skipping
   when the `claude` binary is absent, so it's a local/dev gate rather than
   a required CI signal. Note the *previous* version of the hooks test
   asserted the opposite invariant (that the referenced file exists), which
   is precisely why it stayed green through the outage.
2. **Version bumps are the delivery mechanism, not bookkeeping.** Because
   `plugin.json` sets an explicit `version`, installed users only receive
   updates when it changes. A fix committed without a bump reaches nobody
   on the subscribe-not-fork path. Bumped 0.4.0 → 0.4.1 in both
   `plugin.json` and `marketplace.json`.
3. **Surface support, now documented rather than assumed.** Checked against
   the platform docs while answering a related user question: plugins —
   including hooks — do work in the Claude Desktop app's **Code** tab,
   which shares configuration files with the CLI, installed through the
   plugin manager UI rather than `/plugin`. The desktop **Chat** tab is a
   different surface: plugin *skills* run there, hooks and subagents do
   not. Plugins are unavailable in WSL sessions, and cloud sessions need
   the plugin declared in `.claude/settings.json` `enabledPlugins`. The
   README's "Where it works" table now states this; previously the docs
   said only "Claude Code" and left users to guess whether the desktop app
   counted.

Incidental finding, recorded because it bears on D-017's cost model:
`claude plugin details` reports Scout's always-on cost as ~1,116 tokens,
which contradicts the token audit's ~195. The audit is right and the CLI's
projection is a naive sum that ignores `disable-model-invocation: true` —
verified by asking a live model in an isolated install to name every
`scout` skill it could see, which returned `scout:surfacing` alone. No
action needed; noted so the discrepancy isn't re-litigated from the CLI's
number later.
