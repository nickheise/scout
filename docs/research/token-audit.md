# Token-cost audit — what Scout costs its users, and where — 2026-07-20

Scout's value exchange is asymmetric by design: the common result of its
most expensive path is *silence* ("nothing surfaced is a good result",
PRD tenet). That is correct product behavior — and exactly the shape that
earns a bad reputation if the silent path is expensive. This audit measures
what every Scout artifact costs the user in context tokens, models when
each cost is paid, and installs CI gates (`test/budgets.test.mjs`, D-017)
so no future edit grows a cost silently.

**Method.** Sizes are byte counts of the real artifacts at audit time
(bytes ≈ chars; everything here is ASCII-dominant). Token estimates use
the standard ~4 chars/token heuristic — treat them as ±20%, good for
ranking and budgeting, not billing. Dynamic artifacts (compiled block,
hook output) are measured against `fixtures/seed-pack` (5 pack entries +
4 steps), the repo's canonical acceptance fixture. Verified on this
machine with the commands in each section; the budget test re-verifies on
every CI run.

## 1. The cost model: three tiers by frequency

Cost to a user is **size × frequency × cache status**. Scout's artifacts
fall into three tiers:

| Tier | When paid | Cache status | Scout artifacts |
|---|---|---|---|
| **T1 — always-on** | every session, every project, whether or not Scout is used | cached prefix after first turn | `surfacing` skill description; compiled managed block (scout-started projects only) |
| **T2 — per planning moment** | every `ExitPlanMode` / `TodoWrite` in a scout-started project, unbidden | **uncached injection, full price every time** | hook `additionalContext` + `surfacing/SKILL.md` loaded on invocation |
| **T3 — per verb use** | only when the user explicitly runs a `/scout:*` verb | uncached, but user-initiated | the seven verb SKILL.mds (+ cross-reads, §4) |

T2 is the reputational risk: recurring, invisible, and its designed-common
outcome is "nothing surfaced." T3 is the least sensitive — the user asked,
so the exchange is legible. T1 is the cheapest kind of cost there is
(cached prefix) but the only tier paid by *every* session on the machine.

## 2. Inventory (measured 2026-07-20)

### T1 — always-on

| Artifact | Chars | ~Tokens | Notes |
|---|---|---|---|
| `surfacing` frontmatter description | 785 | ~195 | The **only** Scout string in model context in every Claude Code session — all seven verbs set `disable-model-invocation: true`, which keeps their descriptions out of the model's skill listing entirely. This flag is now a CI-gated invariant. |
| Compiled managed block (seed pack) | 2,185 | ~545 | In `CLAUDE.md` of scout-started projects only; cached prefix. `node bin/scout-compile.mjs --pack fixtures/seed-pack \| wc -c`. |

Extrapolation at the manifest cap: ambient lines average ~97 chars, so 25
lines ≈ 2.4K chars; the standing-instructions section averages ~350
chars/step and — finding F4 below — **has no cap**. A plausible full pack
(25 lines + 8 steps) ≈ 5.5K chars ≈ ~1,400 tokens, still cached-prefix.

### T2 — per planning moment

| Artifact | Chars | ~Tokens | Notes |
|---|---|---|---|
| Hook `additionalContext` (seed pack) | ~1,760 | ~440 | Instruction line + full matching index (`--index`, 1,553 chars for 9 entries, ~172 chars/entry). Runtime-capped at `MAX_OUTPUT_CHARS = 4000` with truncation note. |
| `surfacing/SKILL.md` on invocation | 15,171 | ~3,790 | Loaded whenever the model follows the pointer — **including when the outcome is "nothing surfaced."** |
| **Planning moment, seed pack, today** | **~16,950** | **~4,240** | |
| **Planning moment, ceiling** (hook at cap) | **~19,200** | **~4,800** | CI-gated at 20,000 chars combined. |

### T3 — per verb invocation

| Verb | Own SKILL.md | Cross-read | Total chars | ~Tokens |
|---|---|---|---|---|
| `/scout:setup` | 13,875 | + `add` 13,810 | 27,685 | ~6,920 |
| `/scout:survey` | 11,482 | + `surfacing` 15,171 | 26,653 | ~6,660 |
| `/scout:add` | 13,810 | — | 13,810 | ~3,450 |
| `/scout:start` | 12,911 | — | 12,911 | ~3,230 |
| `/scout:archive` | 4,516 | — | 4,516 | ~1,130 |
| `/scout:explain` | 4,332 | — | 4,332 | ~1,080 |
| `/scout:list` | 3,139 | — | 3,139 | ~785 |
| bare `/scout` router | 4,392 | + target verb | varies | +~1,100 |

## 3. Findings, ranked

**F1 — The planning-moment path is the cost center, and its cost is
dominated by the surfacing skill, not the hook.** The hook is disciplined
(~440 tokens seed-pack, hard-capped ~1,000); the 15.2K `surfacing/SKILL.md`
behind it is 3.8× larger and is paid on every planning moment the model
follows the pointer — most of which correctly end in silence. A user pays
~4,200 tokens to be told nothing, repeatedly. This is the single highest-
leverage restructuring target, **but restructuring is explicitly deferred**
(§5): whether the gate behaves as well with its doctrine one hop away is a
skill-quality question, not a size question.

**F2 — The pre-registered "fast path" hypothesis survives contact with the
data, with a correction.** The original hypothesis was "avoid loading
surfacing when the pack is empty" — but the hook already fast-exits
silently on empty/missing packs (guard 5), so that case costs zero today.
The real gap is *non-empty pack, plainly irrelevant plan*: the model must
currently load all 15.2K to conclude "no". The index the hook already
injects (~172 chars/entry of `surfaces_when` conditions) is arguably enough
for an obvious-mismatch triage without the full skill. Candidate shape for
the restructuring discussion: instruction text that licenses "if nothing in
the index plausibly relates, stop here — do not open the skill." Cheap,
prompt-only, testable against the scripted scenario runs.

**F3 — Cross-reads double the two heaviest verbs.** `survey` reads
`surfacing/SKILL.md` (correct — one gate, no drift) and `setup` reads
`add/SKILL.md` (same rationale). The *principle* is right; the *cost* is
that the shared doctrine lives inside two of the largest skills. If the
gate spec and ingestion methodology were extracted as artifacts (the
"thin skills, thick artifacts" direction), both cross-reads would shrink
to the shared spec's size instead of the full host skill. Deferred to §5.

**F4 — The standing-instructions section is uncapped.** The manifest has
its 25-line cap with an archive nudge; standing steps (~350 chars each,
3.6× an ambient line) have no equivalent. Today: 4 steps, fine. A
step-enthusiastic user's `CLAUDE.md` block grows without a backstop, in
every session of every scout-started project. Worth a cap-or-nudge
decision when the manifest cap itself is tuned (P-4) — same conversation,
same constant family.

**F5 — T1 hygiene is genuinely good; hold the line.** ~195 always-on
tokens for sessions that never touch Scout is near the floor for a plugin
with a model-invoked skill, and the `disable-model-invocation: true`
discipline on all seven verbs is what keeps it there. Both are now CI
invariants — dropping the flag on one verb would silently add its
description to every session on the machine, which is exactly the kind of
regression a reviewer won't catch by eye.

**F6 — The verbs are priced acceptably for user-initiated actions.**
`setup` at ~7K tokens runs once ever; `survey` at ~6.7K runs at
milestones. No action needed beyond the freeze; if the Pocock pass slims
`add`/`surfacing`, F3's cross-reads compound the savings.

## 4. The gates (`test/budgets.test.mjs`)

Budgets are **freeze-plus-headroom** (~5–10% above measured), not
aspirational targets: every gate passes at introduction, and any growth
requires a deliberate budget bump *in the same diff* — making context cost
a reviewable line item, the same way the golden files make compiled output
reviewable. Aspirational *reductions* belong to the restructuring effort
(§5), not to CI.

Gated: per-skill char budgets (every `skills/*/SKILL.md` found must have
one — a new skill without a budget fails), the surfacing description, the
compiled seed-pack block, the hook's real `additionalContext` against the
seed pack, the combined planning-moment ceiling (surfacing +
`MAX_OUTPUT_CHARS` ≤ 20,000 chars), `MAX_OUTPUT_CHARS ≤ 4000` itself, and
the two F5 invariants.

## 5. What this audit deliberately does not do — the Pocock circle-back

F1–F3 all point at restructuring `surfacing` (and `add`) toward thinner
skills referencing thicker artifacts. **None of that moves until the
skill-quality checklist from the "Building Great Agent Skills" review is
walked first** — size is one axis of skill quality, and cutting tokens by
moving doctrine out of the model's face is a behavior change, not a
refactor. Order of operations, owner-confirmed 2026-07-20:

1. ✅ This audit (numbers + gates) — establishes the baseline any
   restructuring must beat and the regression net it must not trip.
2. Pocock checklist pass over the four heavy skills (`surfacing`, `add`,
   `setup`, `start`) — including the deletion test, which needs live
   usage transcripts, so it wants real dogfooding data first.
3. Only then: restructuring proposals (F1 fast-path instruction, F3
   doctrine-as-artifact extraction), each validated against the scripted
   surfacing scenarios *and* these budgets.

Re-run this audit's numbers after any restructuring lands; the budget test
makes stale numbers here loud (a deliberate budget bump is the reminder to
update this file).
