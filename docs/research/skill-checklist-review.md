# Skill-checklist review — the five heavy skills against the Pocock rubric — 2026-07-20

Walkthrough of Scout's five largest skills (`surfacing` 15.2K, `setup`
13.9K, `add` 13.8K, `start` 12.9K, `survey` 11.5K) against the four-part
checklist from Matt Pocock's "Building Great Agent Skills: The Missing
Manual" (AI Engineer World's Fair 2026 talk; transcript reviewed
2026-07-20). The three small verbs (`archive` 4.5K, `explain` 4.3K, `list`
3.1K) were spot-checked and are already lean — no findings.

This is a **review, not a restructuring**: per D-017's ordering, every
change proposal here is deferred to owner discussion, and anything that
moves doctrine out of a skill must re-pass the scripted surfacing
scenarios and the `test/budgets.test.mjs` gates. Companion cost data:
`docs/research/token-audit.md` (F1–F3).

## The checklist, condensed

1. **Trigger** — user-invoked vs model-invoked is a real trade: every
   model-invoked description adds *context load* (tokens + a thing to
   think about, every request); every user-invoked skill adds *cognitive
   load* (the user must remember it). Model invocation also buys
   unpredictability — a context pointer the model may not follow.
2. **Structure** — a skill is *steps* + *reference*. Keep SKILL.md as
   small as possible; find the skill's *branches*; reference material used
   by only one branch moves behind a context pointer (an "external
   reference" bundled in the skill folder). Reference used on every run
   stays in SKILL.md.
3. **Steering** — *leading words*: consistent, meaning-dense phrases that
   trigger the model's priors and get echoed back in reasoning traces
   (verification = watch for the echo). *Leg work*: if a step gets
   shortchanged because the model eyes the future goal, split the skill so
   it sees one step at a time.
4. **Pruning** — massive skills are a symptom. DRY / single source of
   truth (even across reference material); sediment (accreted, stale,
   misplaced material); no-ops (text that survives the *deletion test* —
   would behavior change if this paragraph vanished?).

## What Scout already does right (checklist-conformant, keep)

- **Trigger discipline is exemplary.** Exactly one model-invoked skill;
  all seven verbs carry `disable-model-invocation: true` (now CI-gated).
  This is the checklist's context-load/cognitive-load trade made
  deliberately, and it is the same call Pocock makes for his own repo.
  Scout goes one better on the unpredictability cost: the planning-moment
  hook *forces* the context pointer into view instead of hoping the model
  notices the description.
- **The external-reference pattern already exists in-repo**:
  `skills/add/skills-repos.md` is exactly Pocock's technique — branch-only
  material (meta-repo ingestion) behind a context pointer.
- **Leading words are strong and consistent**: *the gate*, *the ledger*,
  *nothing surfaced is a good result*, *the draft*, *specimens* (fetched
  content), *markers/roots/tracks* (setup), *explore before you ask*,
  *hand over ownership*, *refresh mode*, and the cross-skill *stay in your
  lane* / *Hard Rule N* / *done when*. These are meaning-dense, repeated
  deliberately, and referenced by number — textbook steering.
- **"Done when" sections are leg-work enforcement** — they hold the model
  on the bookkeeping it would otherwise skip once the user-visible result
  is out. Directly aligned with the checklist's leg-work concern.
- **Single-source-of-truth intent is explicit** where doctrine is shared:
  `survey` Hard Rule 2 ("do not restate… so the live and retroactive paths
  can never quietly drift apart") and `setup` Hard Rule 6 ("Setup adds the
  evidence; the add skill defines the craft"). The *intent* is
  checklist-perfect; the *mechanism* (read the whole other skill) is where
  the cost lives — see S3.

## Findings by skill

### surfacing (15,171 chars — the T2 cost center)

**Trigger.** Sole model-invoked skill: correct. Two caveats. (t1) The
785-char description is the machine's always-on string; it enumerates five
trigger scenarios in prose. Compression candidate — but the description is
also the *only* trigger for the non-hook moments, so slimming it trades
always-on tokens against invocation recall. Test, don't guess. (t2) The
wave-off and wrap moments have no hook behind them — they ride on pure
model invocation, the exact unpredictability the checklist warns about.
Whether dismissal capture actually fires at real wave-offs is unverified;
added to the dogfooding register below.

**Structure — the main finding (S1).** The Moments table declares four
branches: planning, wave-off, wrap, archived-match. The material splits
cleanly: Preflight → Candidates → Gate → Report serve the planning branch
(the hot, hook-driven path); **Dismissal capture + the archive nudge
(~2.7K) serve only the wave-off/wrap branches** — checklist-canonical
external-reference material (`dismissals.md` behind a pointer at the
Moments table). The ledger section serves all branches and stays. Saving:
~2.7K (~675 tokens) off every planning moment — ~16% of the F1 recurring
cost, compounding with the audit's F2 triage idea.

**Steering.** Strongest of the five. One distinction worth adopting
repo-wide: *leading-word repetition* (good — "the gate", "the cap"
recurring by name) vs *fact repetition* (bad — the literal value 2 /
`MAX_REPORTS` is restated ~5 times: description, Hard Rule 2, constants
table, Gate cap paragraph, Done-when). State the value once in the
constants table; elsewhere say "the cap."

**Pruning (deletion-test candidates, not deletions).** Second half of the
persona paragraph ("trains the user to skim… dies with the noise");
rhetorical enforcement sentences ("A candidate that skipped a question was
never gated"); the trigger conditions living in three places (description,
Hard Rule 4, Moments table).

### add (13,810 chars)

**Structure — the textbook case (S2).** Path A (URL→pack, ~5.5K) and
Path B (text→step, ~2.5K) are exclusive branches — routing resolves from
input shape before either is needed. This is literally the checklist's
`domain-modeling` example: move both paths behind context pointers,
leaving SKILL.md as routing + Hard Rules + Preflight + Commit (~6K). Every
invocation then loads ~8.5K or ~11.5K instead of 13.8K; the worked JSON
example and field craft travel with Path A, where they're used every time
(per the checklist, every-run reference stays *with its branch*).

**Steering.** Very good — the `surfaces_when` different-model test ("must
be able to answer yes-or-no without taste or guesswork") and the banned-
words list are precision steering. **Pruning.** The confirmation invariant
(Hard Rule 1) is re-derived in A5, B5, Commit step 4, and Done-when —
fact repetition; "fresh approval" as a leading phrase can carry it.

### setup (13,875 chars — runs once per user, ever)

**Structure.** The scan (Step 4, ~2.5K) is opt-in branch material and
would be an external-reference candidate — but this skill runs *once*;
restructuring ROI is the lowest in the repo. Leave it. The finding that
matters is the cross-read: **Hard Rule 6 loads all 13.8K of `add` when it
needs only the field craft** (A2 rules, B1–B3, id/enum discipline —
~4K) — see S3. **Steering.** Excellent; "the scan proposes; the user
ratifies" is the best leading phrase in the repo. **Pruning.** Minor
rhetorical trims only.

### start (12,911 chars)

**Structure — sound; no split recommended.** Steps 1–5 are sequential and
all run every invocation; refresh mode reuses the same steps with early
exits, so the interweaving is correct by the checklist's own rule
(every-run reference stays). Only the writer-refusal handling (Step 4.5,
~0.6K, rare branch) is a marginal externalization candidate — not worth a
hop. **Pruning.** Hard Rules 5 and 7 are each restated ~3 times across
steps; same fact-vs-leading-word cleanup as surfacing.

### survey (11,482 chars)

**Structure (S3, the design tension).** Hard Rule 2's whole-file read of
`surfacing/SKILL.md` is single-source-of-truth done *by pointer to the
wrong granularity*: survey needs the Gate, ledger line shape, and card
format (~4K of the 15.2K); it also drags in surfacing's persona, moments,
dismissal capture, and nudge. Otherwise well-shaped; Step 4's honesty
clause ("don't manufacture a dismissal you're not actually sure was
shown") is good steering. Note: if S1 externalizes surfacing's dismissal
material, survey's cross-read gets ~2.7K cheaper *for free*.

## Cross-cutting

- **The CLI note is near-duplicated across four skills** (~0.4K each; dev-
  checkout fallback + trust-the-usage-line). A DRY violation by the
  checklist — but cross-*skill* dedup adds a context hop to standalone
  reads, and the note is genuinely load-bearing (live runs hit both
  failure modes). Low priority; revisit only if a shared-reference
  mechanism falls out of S3 anyway.
- **The house template earns its tokens.** Persona → Hard Rules →
  steps → Done-when reads as deliberate architecture, not sediment;
  no true sediment (in the checklist's accreted-contributions sense) was
  found in any of the five files. The repo's weight problem is granularity
  (S1–S3) and fact repetition, not crud.

## Proposals — for discussion, nothing moves yet

Ordered by frequency of the cost they touch (T2 hot path first):

| # | Change | Saves | Risk to test first |
|---|---|---|---|
| **R1** | surfacing: dismissal capture + nudge → `dismissals.md` behind a pointer at the Moments table | ~2.7K per planning moment (~16% of F1); survey cross-read shrinks the same amount | does dismissal bookkeeping still fire reliably across the extra hop? (scripted wave-off/wrap scenarios) |
| **R2** | add: Path A / Path B → external references behind the routing table | ~2.5–5.5K per `/scout:add` | none obvious — routing resolves before either path is needed; re-run ingestion acceptance harness |
| **R3** | extract the shared **entry-craft reference** (A2 field rules + B1–B3 + enums) so `setup` HR6 points at ~4K of craft instead of 13.8K of `add` | ~10K per setup scan run | single-source vs extra-hop granularity: where does the craft live so `add` doesn't pay a new hop? Cleanest shape: it lives *inside* Path A/B files (R2), and setup points there — R3 wants R2 first |
| **R4** | fact-repetition pass: constants stated once, leading words carry the rest; deletion-test candidates from each skill section | ~1–2K per skill | every cut is deletion-tested against live transcripts first — needs dogfooding data |
| **R5** | compress surfacing's 785-char description | always-on tokens, every session | non-hook trigger recall (t2) — same dogfooding data decides |

Recommended sequencing if adopted: R2 → R3 (dependency), R1 in parallel
(scenario-gated), R4/R5 after dogfooding. Every landed R must show up as a
*budget reduction* in `test/budgets.test.mjs` in the same diff — that's
the audit's baseline-you-must-beat working as intended.

## Dogfooding register (what live usage must answer before R4/R5)

1. **Leading-word echo check** (Pocock's verification): do *the gate*,
   *nothing surfaced*, *vertical* trace-phrases appear in reasoning traces
   at planning moments? Absence = steering not landing.
2. **Non-hook trigger reliability**: does surfacing actually fire on
   wave-offs and wrap moments from its description alone? (t2, gates R5.)
3. **Deletion-test transcripts**: run the R4 candidate list against real
   sessions — delete, replay the scenario, diff behavior.
4. **Does the model follow the hook pointer** every time, or skip the
   skill read when the plan is obviously unrelated? (Feeds the audit's F2
   fast-path design either way.)
