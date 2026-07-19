# Ingestion acceptance harness — golden-draft procedure

This is the documented half of task 1.6 (plan §4). Its automatable
counterpart is `test/acceptance.test.mjs`, which checks the *shape* of
`fixtures/seed-pack/` (schema validity, id hygiene, non-empty
`surfaces_when`, `ambient_line` length, valid `phase` values, the
meta-repo skills-collection framing). Code cannot judge whether a fresh
`/scout:add` draft is *good* — that requires a live model run and a human
(or reviewing agent) comparing output to intent. This document is that
procedure: re-runnable, terse, checkable.

## Scope

The nine seeds in `fixtures/seed-pack/` are simultaneously:

1. the published example pack (task 1.5), and
2. the acceptance fixtures for the ingestion prompt (`skills/add/SKILL.md`,
   tasks 1.3–1.4).

Every time `skills/add/SKILL.md` changes, re-run this procedure against
all nine before merging. It is also the regression check when the entry
schema (`schema/entry.v1.json`) changes in an accretive way.

## Prerequisites

- A scratch pack, not the real one: `export SCOUT_PACK=$(mktemp -d)`
  before starting, so committed drafts never collide with the committed
  seed ids or pollute a real pack.
- Run inside an actual Claude Code session with `/scout:add` available
  (the plugin installed, or the skill loaded directly) — `WebFetch` and
  the store CLI must be reachable. This is a live-model procedure, not a
  unit test.
- A copy of the committed fixture for the seed under test, open for
  comparison (`fixtures/seed-pack/<id>.json`).

## The nine seeds and their re-ingestion source

Five seeds were drafted from a URL (Path A); four from plain text (Path
B). To re-run a URL seed, feed `/scout:add` the same `url`. To re-run a
text seed, do **not** paste the fixture's `instruction` field verbatim —
that would trivially "pass" by echoing the answer. Instead paste a
colloquial paraphrase of the practice, as a user describing it from
memory would, and check that independent phrasing converges on the same
`phase`/`produces`.

| id | type | re-ingestion input |
|---|---|---|
| `shadcn-ui` | pack | `https://ui.shadcn.com` |
| `paper-shaders` | pack | `https://github.com/paper-design/shaders` |
| `dialkit` | pack | `https://joshpuckett.me/dialkit` |
| `emilkowalski-skills` | pack (meta-repo) | `https://github.com/emilkowalski/skills` |
| `mattpocock-skills` | pack (meta-repo) | `https://github.com/mattpocock/skills` |
| `changelog` | step | "Every project should keep a CHANGELOG.md from day one — whenever something meaningful and user-visible ships, add a dated one- or two-line entry, newest on top, as part of landing the change." |
| `decision-log` | step | "Let's maintain a DECISIONS.md that's append-only: one entry per decision, numbered D-001 etc., with a date, a status, and the reasoning. Never delete an overturned decision — mark it superseded instead." |
| `milestone-screenshots` | step | "After a stakeholder demo, or whenever a big feature first works end to end, prompt to grab screenshots and save them with a date and short label so we keep a visual history. Always ask first, never screenshot silently." |
| `agent-team-builds` | step | "For big multi-file, multi-day, or architecturally novel features, plan first, then build with an agent team — a dedicated orchestrator, a reviewer, and build subagents — assigning models per task to keep cost and tokens reasonable." |

## Procedure (per seed)

1. `export SCOUT_PACK=$(mktemp -d)` (fresh scratch pack; repeat per seed
   or reuse for the whole batch — ids won't collide with the real pack
   either way).
2. Invoke `/scout:add <re-ingestion input>` from the table above.
3. Let the skill run to the draft-presentation step (A5/B-equivalent in
   `skills/add/SKILL.md`). **Do not confirm the commit yet.**
4. Set the fresh draft's `id` field aside if it differs from the fixture's
   slug (naming drift is expected on a from-scratch title→slug pass —
   note it, don't fail on it alone, unless it's non-kebab-case).
5. Compare the draft field-by-field against the committed fixture using
   the rubric below.
6. Record PASS/FAIL per seed with a one-line reason. On FAIL, do **not**
   commit the draft — file it as a prompt-quality issue against
   `skills/add/SKILL.md`.
7. Either way, abandon the draft (never commit over `fixtures/seed-pack/`
   from this procedure — the committed fixtures are the reference, not
   the thing under test).

## Comparison rubric

### Must match exactly (fail the seed if not identical)

- **`type`** — `pack` vs `step`. A meta-repo (skills collection) must
  still draft as `pack` (it is an analyzed link), never `step`.
- **`phase`** (step seeds only) — one of `init` / `ongoing` / `milestone`
  / `wrap`, and the *same* value as the fixture. Phase is a closed-enum,
  behavior-determining field (§3, PRD §5.3) — drift here changes whether
  the step scaffolds once, renders into standing instructions, or fires
  at wrap. No tolerance.
- **`produces`** (step seeds only) — same value (including both being
  `null`, e.g. `agent-team-builds`, `milestone-screenshots`). This is the
  artifact contract; a drafting run that invents or drops an artifact is
  a real defect, not wording noise.

### Must match in substance, wording may drift

- **`surfaces_when`** (pack seeds) — same concrete triggers in gist (same
  component/task nouns), not the same sentences. Apply the SKILL.md A2
  test independently to the fresh draft: does each condition name
  concrete work and pass yes/no without taste? Fail the seed if the fresh
  conditions are vaguer or more keyword-shaped than the fixture's, even
  if the fixture's exact sentences aren't reproduced.
- **`install`** (pack seeds) — same command modulo cosmetic differences
  (e.g. `npm i` vs `npm install`). Fail if it names a different package,
  a different primary distribution channel (e.g. drops the plugin route
  for `mattpocock-skills`), or invents a command the source doesn't
  document.
- **`stack`** — same ecosystem tags as a set (order doesn't matter); `[]`
  vs `null` is a real distinction (recorded-as-N/A vs not-determined) and
  must match.
- **`instruction`** (step seeds) — same practice enacted, imperative
  register, doesn't need matching sentences. Fail if the fresh draft
  changes what the practice actually asks for (e.g. drops "prompt, never
  screenshot silently" from `milestone-screenshots`).

### May drift freely

- **`summary`** wording (pack seeds) — different phrasing, same facts, is
  a pass. Fail only if it introduces an unsupported superlative or gets a
  fact wrong.
- **`notes`** wording — expected to differ every run (overlap questions,
  if any, get fresh answers); only check that an injection flag (Hard
  Rule 2 in SKILL.md) appears if the source page/repo contains steering
  content.
- **`ambient_line`** exact phrasing — free to differ as long as it names
  the title, fits the cap, and carries a when-clue. The automated suite
  already enforces the ≤120-char hard ceiling (`acceptance.test.mjs`);
  this procedure additionally checks the SKILL.md style aim of ~100
  chars is a near-hit, not a hard fail.
- **`id`** exact string — a fresh title→slug pass may reasonably differ
  from the committed slug (e.g. abbreviation choices); only fail if the
  fresh id isn't kebab-case or is materially less legible.

### Meta-repo-specific checks (`emilkowalski-skills`, `mattpocock-skills`)

These are the deliberately hard fixtures (plan §7 risk 2). In addition to
the rubric above:

- Confirm the draft reads `skills-repos.md` and treats the repo as a
  **skills-collection meta-entry**, not an npm package: `install` must
  describe the actual distribution (`skills.sh`/plugin-marketplace
  command), never a fabricated `npm install <repo-name>`.
- Confirm `summary` or `notes` names the "collection of skills/practices"
  framing (this is what `acceptance.test.mjs` checks structurally against
  the committed fixture — re-check it holds on the fresh draft too).
- Confirm only the promoted surface is captured (README + manifest), not
  every file in the repo tree.

## Pass/fail rubric — per-seed verdict

A seed **PASSES** when:

- every "must match exactly" field is identical, and
- every "must match in substance" field covers the same real-world facts
  even if reworded, and
- no "may drift freely" field introduces a factual error or drops a Hard
  Rule (injection flagging, confirmation gate never skipped).

A seed **FAILS** when any exact-match field differs, or a substance-match
field is vaguer/wrong/incomplete versus the fixture. Log every FAIL with:
the field, the fixture's value, the fresh draft's value, and a one-line
verdict. A failed seed blocks merging the prompt change that caused it;
re-run after the fix.

## Relationship to PRD §10 (ingestion quality bar)

PRD §10's success criteria that this procedure operationalizes for
ingestion specifically:

- *"Capturing a link or practice takes < 15 seconds from any connected
  surface"* — timebox step 2–3 above; a draft that requires more than a
  couple of clarifying round-trips before reaching the confirmation step
  is a soft fail worth noting even if the fields eventually match.
- *Precision over recall, applied to `surfaces_when`* — §5.6's gate
  standard ("does this feature genuinely benefit, or is it a
  surface-level keyword match?") is exactly the bar the "must match in
  substance" `surfaces_when` check above enforces on fresh drafts: vague
  or keyword-shaped conditions are a fail even when non-empty.
- *"A Scout code update never modifies a user's pack data"* — this
  procedure never writes into the committed `fixtures/seed-pack/`; drafts
  live only in the scratch `$SCOUT_PACK` and are discarded after review
  (step 7).

## Cross-reference

| Concern | Checked by |
|---|---|
| Schema validity, id hygiene, closed-enum values, non-empty `surfaces_when`, `ambient_line` length, meta-repo framing present in the *committed* fixtures | `test/acceptance.test.mjs` (automated, CI) |
| Whether a *fresh* `/scout:add` run reproduces the committed fixtures' decision-relevant fields and quality bar | this document (live, human/reviewing-agent run) |
