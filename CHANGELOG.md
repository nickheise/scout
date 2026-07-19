# Changelog

All notable changes to Scout are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions will track
the plugin's release tags once Phase 2 (plugin packaging) lands.

## [Unreleased]

### Added
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
