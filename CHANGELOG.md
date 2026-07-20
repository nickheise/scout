# Changelog

All notable changes to Scout are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions will track
the plugin's release tags once Phase 2 (plugin packaging) lands.

## [Unreleased]

### Added
- 2026-07-19 — **Phases 4+5 complete** (plugin v0.4.0) — **all PRD build
  phases shipped.** Phase 4: `/scout:setup` (onboarding, Tier 1 offer, D-012
  router offer, history scan with explicit named roots, evidence-attached
  proposals capped 5–7, nothing auto-committed), `bin/scout-scan.mjs`
  (deterministic gatherer, agent judges; truth-checked against real repos),
  `docs/courier-prompt.md`. Phase 5: `page/index.html` zero-build browse page
  (fetch + drag-drop modes, tolerant reader, graveyard with supersession
  chains, stale badges, courier reactivate; passed live browser review in
  light + dark), `docs/pages.md` (deploy path verified live after review
  caught a broken layout), `docs/tier2-design.md` (document-only, D-010).
  README full sweep. First review attempt died mid-response and was re-run
  from scratch — verdict accept-after-fixes. 223/223 tests;
  `claude plugin validate --strict` green.

### Changed
- 2026-07-19 — **PRD v0.4 adopted and retrofitted** (D-014, plugin v0.3.0):
  `/scout:review` renamed `/scout:survey` across skills, router, manifests,
  and docs (verb slate locked: add, archive, list, start, explain, survey,
  setup); register-doctrine voice pass ("plain in, brand out") over
  user-facing narration — survey's code-review apology removed, expedition
  vocabulary only in framing, never in required vocabulary; tenet-7 audit
  passed (no retrieval-verb workflow anywhere; the MCP server exposes no
  search tool). Adversarial review verdict: accept. 193/193 tests.

### Added
- 2026-07-19 — **Phase 3 complete** (plugin v0.2.0): planning-moment hook
  (`bin/scout-hook-plan.mjs` + `hooks/hooks.json`) — PreToolUse(ExitPlanMode)
  primary, PostToolUse(TodoWrite) fallback, dual delivery per D-013
  (`SCOUT_HOOK_DELIVERY`), six silent fast-exit guards, <100ms, 10k-cap-safe;
  `compile --index`; the surfacing skill (the one model-invoked skill: 3-question
  gate, cap 2, rejection ledger `.scout/ledger.jsonl`, D-008 dismissals, nudge-once
  at 3, supersession redirect, lazy verification); `/scout:review` retroactive
  backstop with D-008 reconciliation + D-009 recurrence proposals. Adversarial
  review verdict accept-after-fixes; reviewer hand-walked the animated-background
  scenario (Paper Shaders surfaces, keyword matches ledgered). 193/193 tests.
- 2026-07-19 — Post-review tightening: review-recorded dismissals now also
  write `dismissed-inferred` ledger lines (closes the live/retroactive drift);
  `test/packaging.test.mjs` asserts manifest-version and skills-array
  invariants in CI, which cannot hard-gate on the claude CLI.
- 2026-07-19 — **Phase 2 complete**: compile (manifest cap 25, refuses over
  cap; init-with-produces steps emit maintenance lines), managed-block writer
  (sync-hash edit detection, corruption refusal, atomic writes, CRLF-safe —
  verified by direct attack), `start` ritual skill, `list`/`archive`/`explain`
  verb skills, stdio MCP server (8 tools), bare-`/scout` router template
  (D-012), plugin + marketplace packaging (`claude plugin validate --strict`
  green). 153/153 tests. Install: `/plugin marketplace add nickheise/scout`
  → `/plugin install scout@scout` (confirmed against manifests).
  Note for the record: the phase's five parallel builders stalled at the
  harness level; the adversarial-review loop caught the gap and a second
  review round (verdict: accept-after-fixes) restored full scrutiny.
- 2026-07-19 — Naming fully settled: name stays Scout (Recon declined,
  recorded); repo home github.com/nickheise/scout; domain deferred.
  Invocation surface decided (D-012): plugin verbs at `/scout:*` plus an
  optional logic-free personal router giving bare `/scout <verb>`. Phase 2
  scope updated (tasks 2.6 coexistence test, 2.7 router); marketing thread
  synced with provisional install strings.
- 2026-07-19 — **Phase 1 complete** (agent-team build, 9 agents, adversarial
  review loop): entry schema v1 + reserved-names registry + frozen corpus
  fixtures; `bin/scout-store.mjs` (zero-dep tolerant-reader store CLI, 105
  tests green); `skills/add/SKILL.md` ingestion skill (URL→pack, text→step,
  overlap detection, fetched-content-is-data hard rule, draft→confirm→commit);
  the nine seed entries in `fixtures/seed-pack/` (all validate); acceptance
  harness (`test/acceptance.test.mjs` + golden-draft procedure). Review found
  and fixed 1 blocker (path traversal via crafted entry id) and 2 majors
  (schema type-discrimination null hole; SKILL commit-command mismatch).
- 2026-07-19 — Hook spike (`docs/research/hook-spike.md`): go for
  PreToolUse(ExitPlanMode) as the Phase 3 planning-moment hook (full `plan`
  string in tool_input, source-verified), PostToolUse(TodoWrite) fallback.
  Open item: live confirmation that `additionalContext` reaches the model —
  required before task 3.1; test harness left ready in the spike scratch dir.
- 2026-07-18 — Project kickoff. Adopted PRD v0.3 (`docs/prd.md`) as the build
  baseline: local-first plugin, agent-as-brain, ships empty, verb slate
  `add, archive, list, start, explain, review, setup`.
- 2026-07-18 — Decision log scaffolded (`DECISIONS.md`); PRD open questions
  tracked there as pending decisions.
- 2026-07-18 — Platform + ecosystem research commissioned and delivered:
  Claude Code plugin/hook/MCP mechanics; deep-read of emilkowalski/skills and
  mattpocock/skills (the acceptance-fixture repos); ecosystem survey; schema
  evolution + managed-block patterns; naming/namespace availability. Briefs
  persisted under `docs/research/`.
- 2026-07-18 — All PRD §12 open questions resolved with the owner except the
  non-blocking manifest-cap tuning: see DECISIONS.md D-004…D-011 (milestone
  trigger, agent-team threshold, browse-page stack, namespace, dismissal
  mechanics, recurrence threshold, Tier 2 document-only, courier-pattern
  reactivation).
- 2026-07-18 — Build plan written (`docs/plan.md`): five phases, binding
  technical rules from research, agent-team structure with per-task model
  assignments.
