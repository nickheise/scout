# Scout — build plan

Baseline: `docs/prd.md` (v0.3). Decisions: `DECISIONS.md` (D-001…D-011; all
PRD §12 open questions resolved except the non-blocking manifest-cap tuning).
Research inputs: `docs/research/*.md`. Plan owner: staff-engineer session
acting as orchestrator; execution by agent team (§6).

## 1. Shape of the deliverable

One repo, four products in it:

1. **The plugin** — `.claude-plugin/plugin.json` + skills for the seven verbs
   (`/scout:add|archive|list|start|explain|review|setup`), hooks, and a
   bundled stdio MCP server. The repo is its own single-plugin marketplace
   (`.claude-plugin/marketplace.json`, source `./`) — mattpocock pattern,
   subscribe-not-fork, versioned releases, `claude plugin validate --strict`
   in CI.
2. **The core scripts** — plain Node ≥18, **zero npm dependencies** for
   store/compile/managed-block (the MCP server may use
   `@modelcontextprotocol/sdk` as the only dependency). No build step, no
   daemon, no database — grep-able JSON in a folder the user owns.
3. **The browse page** — one zero-build static HTML/CSS/JS page (D-006),
   read-only (D-011), hand-polished to shadcn-grade.
4. **The docs** — README, per-verb docs, the courier prompt, Tier 2 design
   doc (document-only, D-010), graceful-degradation notes for non-Claude
   agents.

Intelligence lives in *prompts* (skills), not code. Code is choreography:
file I/O, compilation, sentinel management, hook plumbing. This split is the
PRD's agent-as-brain tenet and it's also what makes the system testable —
deterministic code gets unit tests; prompts get fixture-based acceptance runs.

## 2. Target repo layout

```
scout/
├── .claude-plugin/{plugin.json, marketplace.json}
├── skills/
│   ├── add/SKILL.md           # user-invoked; URL→pack / text→step routing
│   ├── archive/SKILL.md       # user-invoked; supersession pointers
│   ├── list/SKILL.md          # user-invoked
│   ├── explain/SKILL.md       # user-invoked; provenance
│   ├── start/SKILL.md         # user-invoked; interview + init + injection
│   ├── review/SKILL.md        # user-invoked; retroactive gate
│   ├── setup/SKILL.md         # user-invoked; onboarding + history scan
│   └── surfacing/SKILL.md     # THE one model-invoked skill (gate, ledger,
│                              #   dismissals, supersession redirect,
│                              #   lazy verification, recurrence nudge)
├── hooks/hooks.json           # PreToolUse(ExitPlanMode) + SessionStart
├── bin/                       # node scripts, no deps
│   ├── scout-store.mjs        # read/write/validate entries (tolerant reader)
│   ├── scout-compile.mjs      # manifest + standing-instructions artifacts
│   ├── scout-block.mjs        # managed-section writer (sentinels, hash)
│   ├── scout-hook-plan.mjs    # planning-moment hook (cheap, no LLM)
│   └── scout-mcp.mjs          # stdio MCP server
├── schema/
│   ├── entry.v1.json          # JSON Schema + reserved-field-names registry
│   └── corpus/v1/*.json       # frozen per-version fixtures (rule A10)
├── fixtures/seed-pack/        # the nine seed entries (acceptance targets)
├── page/index.html            # browse page (self-contained)
├── docs/                      # prd, plan, research, verbs, courier prompt,
│   └── tier2-design.md        #   Tier 2 contract (document-only)
├── test/                      # node:test suites + golden files
├── CHANGELOG.md · DECISIONS.md · README.md · LICENSE (MIT)
└── .github/workflows/ci.yml
```

## 3. Binding technical rules (from research; non-negotiable in review)

- **Store:** accretion-only schema evolution; tolerant reader preserving
  unknown fields; migrate-on-read-in-memory only; corpus tests per schema
  version. Full rules: `docs/research/file-format-patterns.md` §A.
- **Managed block:** hash-verified sentinels, warn-don't-clobber on user
  edits, refuse on marker corruption, byte-identical no-op runs, clean
  removal. Full spec: `file-format-patterns.md` §B.
- **Hooks:** cheap (<100ms, no LLM, no network), lean output, recursion
  guard, scrupulous disable-state respect. The hook *points*; the host agent
  *judges*.
- **Surfacing prompts:** Emil's pipeline verbatim-in-spirit — gate with
  closed enums, mandatory rejection ledger, hard cap 2, "nothing surfaced is
  a good result", fetched-content-is-data as a numbered Hard Rule.
- **Skills:** verbs user-invoked (`disable-model-invocation: true`,
  human-facing descriptions); `surfacing` is the only model-invoked skill and
  its context budget is the manifest. Verbs never chain into verbs.
- **Namespace reality:** commands are `/scout:add` (colon). Docs use the real
  form everywhere.

## 4. Phases, tasks, acceptance criteria

### Phase 1 — Store + ingestion (the keystone)
| Task | Acceptance |
|---|---|
| 1.1 `schema/entry.v1.json` + reserved-names registry + corpus fixtures | schema validates all nine seeds; corpus test green |
| 1.2 `scout-store.mjs` (create/read/update/list/validate; tolerant reader) | unit tests incl. unknown-field round-trip, bad-JSON refusal |
| 1.3 `skills/add` — URL→pack ingestion prompt (fetch → summary, surfaces_when, ambient_line, install, stack; overlap detection; injection flagging; draft→confirm→commit) | live run produces committable drafts for all 5 pack seeds, incl. both meta-repos (skills collections, not npm packages) |
| 1.4 `skills/add` — text→step drafting (instruction, phase, produces) | live run drafts the 4 step seeds; inferred phase shown for confirmation |
| 1.5 Nine seed entries committed to `fixtures/seed-pack/` as the published example pack | each entry reviewed against PRD §6 schema; agent-team step encodes D-005 wording |
| 1.6 Ingestion acceptance harness (golden drafts, re-runnable) | documented pass/fail per seed |

### Phase 2 — Compile + start + packaging (~80% of daily value)
| Task | Acceptance |
|---|---|
| 2.1 `scout-compile.mjs` — manifest (≤25 `ambient_line`s, hard stop with archive prompt when exceeded) + standing-instructions block (D-004 milestone wording, D-005 agent-team wording) | golden-file tests; cap-exceeded path tested |
| 2.2 `scout-block.mjs` — managed-section writer per §3 rules | idempotency suite: fresh insert, update, no-op, user-edited body, four corruption cases, removal |
| 2.3 `skills/start` — interview (Pocock pattern: explore first, recommended defaults, skip settled sections), init-step execution, CLAUDE.md-else-AGENTS.md-else-ask injection, project overlay file, idempotent re-run | live run on a scratch project yields CHANGELOG.md/DECISIONS.md + injected block; re-run is a no-op |
| 2.4 `skills/list`, `skills/archive` (supersession pointer), `skills/explain` (provenance) | live runs against the seed pack |
| 2.5 `scout-mcp.mjs` stdio server (pack CRUD + query; natural-language surface for verbs incl. reactivation per D-011) | MCP inspector smoke test; reactivate round-trip |
| 2.6 Plugin + marketplace packaging, versioning, CI (`claude plugin validate --strict`, node:test, corpus); empirically test coexistence with the community-marketplace `scout` plugin (two same-named plugins, one machine) | clean install via `/plugin marketplace add` on a second machine/profile; coexistence behavior documented (or marked unverified with evidence) |
| 2.7 Bare `/scout` router (D-012): `templates/scout-router/SKILL.md` — logic-free personal skill routing `/scout <verb> <args>` to the plugin's machinery, + install doc; interactive offer wired into `setup` in Phase 4 | router installed to a scratch `~/.claude/skills/scout` routes all seven verbs correctly; contains no duplicated logic |

### Phase 3 — Reports (zero-recall long tail)
| Task | Acceptance |
|---|---|
| 3.0 **Spike first**: log ExitPlanMode/TodoWrite hook payloads; verify additionalContext re-enters context; CLI vs IDE behavior; disable-state respect | findings written to `docs/research/hook-spike.md`; go/no-go on hook shape |
| 3.1 `scout-hook-plan.mjs` + hooks.json — inject pointer + gate instruction at planning moments | <100ms; ≤10k chars; recursion-guarded; silent when pack empty/absent |
| 3.2 `skills/surfacing` — the gate (3 questions), rejection ledger with reasons, cap 2, supersession redirect, lazy verification, dismissal capture per D-008, archive nudge at 3 | scripted scenario runs: apt match, keyword-only match rejected, archived-entry redirect, dismissal→nudge→respect answer |
| 3.3 `skills/review` — retroactive backstop, same gate + caps | live run on a scratch project |

### Phase 4 — setup + history scan (cold start)
| Task | Acceptance |
|---|---|
| 4.1 `skills/setup` — pack location, Tier 1 git-remote offer | fresh-profile run completes <60s to first `add` |
| 4.2 History scan — recurring deps across package.json files, recurring practice files, per-project CLAUDE.md patterns; evidence attached ("4 of 6 repos", paths); top 5–7; batch-reviewable; nothing auto-committed; scan roots confirmed with user before reading | run against Nick's real ~/Documents/GitHub corpus; proposals ratified by owner ("that *is* what I do" test) |
| 4.3 Courier prompt (docs + copy) | reviewed copy; scoped to revealed tooling, never personality |
| 4.4 Wrap-phase recurrence nudge (threshold 3, D-009) in `surfacing` | scenario test |
| (out) Session-transcript scan | v1.5 per PRD — not in this effort |

### Phase 5 — Browse page + Tier 2 docs
| Task | Acceptance |
|---|---|
| 5.1 `page/index.html` — Pack/Steps tabs, graveyard with supersession chains, stale-age badges, courier-style reactivate copy button; reads pack JSON locally (file picker/drag-drop) and on Pages (fetch from repo) | works from `file://`, `python -m http.server`, and Pages; design pass with emil-design-eng standards |
| 5.2 Pages workflow for Tier 1 users | documented; sample deploy from the seed pack |
| 5.3 `docs/tier2-design.md` — Worker MCP endpoint contract, bearer auth, deploy skeleton (document-only, D-010) | reviewed for buildability without this conversation |
| 5.4 README + docs sweep — degradation notes (manifest works everywhere; reports are Claude Code-only), three-plane update model, install in 60s | outsider read-through test |

## 5. Testing strategy

- **Deterministic core:** node:test unit suites (store, compile, block,
  hook script) + golden files + per-version corpus. CI on every push.
- **Prompt quality:** the nine seeds are the ingestion acceptance fixtures
  (PRD §6); scripted scenario transcripts for surfacing/gate behavior;
  live smoke of Phases 1–2 inside a real Claude Code session before
  packaging (PRD §9 note).
- **Packaging:** `claude plugin validate --strict`; clean-profile install
  rehearsal before any release tag.

## 6. Agent team & model assignment

Orchestration runs from this session (Fable) via Workflow; review is
adversarial and separate from build; builders get well-specified, file-scoped
tasks. Cost posture: capable models only where judgment concentrates.

| Role | Model / effort | Assignments |
|---|---|---|
| Orchestrator | Fable (this session) | task decomposition, integration, final merges, decision log upkeep |
| Reviewer | Opus 4.8, high effort | adversarial review of every work package against §3 rules + PRD tenets; two-pass on Phase 1 prompts and 2.2 block writer |
| Prompt engineer | Fable/Opus | crown jewels: ingestion prompts (1.3/1.4), surfacing gate (3.2), start interview (2.3) — highest-judgment artifacts |
| Builders ×3–4 | Sonnet 5, default effort | store lib, compile, MCP server, hook script, skills scaffolding, browse page, CI |
| Mechanical | Haiku 4.5 | fixture formatting, doc link sweeps, CI YAML boilerplate |
| Spike agent | Sonnet 5 | task 3.0 hook-payload spike (early, parallel with Phase 1) |

Sequencing: Phase 1 → Phase 2 are serial (keystone first). The 3.0 spike and
5.1 page skeleton can run parallel to Phase 1 (no shared files). Phases 3–5
follow 2. Worktree isolation for parallel builders touching the same areas.

## 7. Risks & mitigations

1. **Hook unknowns** (payload shape, additionalContext semantics, IDE bugs,
   disable-state leaks) — spike 3.0 runs first; manifest layer alone still
   delivers ~80% of value if hooks disappoint (PRD's own claim, now
   corroborated by ecosystem research).
2. **Ingestion quality on meta-repos** — the two skills repos are
   deliberately hard fixtures; prior-art brief gives the parsing contract
   (buckets, promotion state, description-as-signal). Iterate hardest here.
3. **`/scout:` vs `/scout ` expectation gap** — docs show real syntax
   everywhere; MCP natural-language surface covers the space-separated habit.
4. **Community-marketplace `scout` confusion** — positioning line in README
   ("Scout for Claude Code"); official-directory submission is the endgame.
5. **History-scan privacy** — scan roots explicitly confirmed with the user
   before any read; evidence always attached; nothing auto-committed.
