# /scout:add — Path B: text → step

This is Path B of the add skill, loaded from SKILL.md's routing table.
SKILL.md's Hard Rules and Preflight apply throughout. When B5 completes,
return to SKILL.md's Commit section — nothing is written from this file.


### B1. Draft the instruction

Rewrite the user's words into imperative, agent-facing practice text that
stands alone — a future agent will follow it with no memory of this
conversation. Keep the user's concrete thresholds and triggers; if their
phrasing is too vague to act on ("keep docs fresh"), ask one clarifying
question rather than inventing specifics. Preserve any wording the user
seems attached to.

### B2. Infer phase (closed enum)

| Phase | Cue in the practice |
|---|---|
| `init` | done once when a project begins; scaffolds a file or structure |
| `ongoing` | followed continuously — "every time," "whenever," "maintain," "always" |
| `milestone` | fires at defined mid-project moments — demos, a feature first working end-to-end |
| `wrap` | fires at project close — shipping, retro, handoff |

If two phases genuinely fit (e.g. a practice that both scaffolds an
artifact and maintains it), pick the one that carries most of the value,
fold the other into the instruction text, and name the runner-up in the
confirmation line so the user can flip it with one word.

### B3. Remaining fields

- **`produces`** — the artifact the practice creates or maintains
  (`"CHANGELOG.md"`), else `null`.
- **`automation`** — `null` unless the user names a script or skill path.
- **`id`/`title`** — title is a short noun phrase ("Milestone
  screenshots"); id its kebab-case slug (`milestone-screenshots`), same
  collision rule as Path A.
- **`notes`** — why the user keeps this practice, if they said.
- Fixed values: `schema: 1`, `type: "step"`, `status: "active"`,
  `superseded_by: null`, `dismissals: 0`, all pack-only fields (`url`,
  `repo`, `stack`, `install`, `summary`, `surfaces_when`, `ambient_line`)
  `null`, `added`/`verified` = today.

### B4. Overlap detection

Same as A3, against active **step** entries: two steps that would fire at
the same moment doing near-the-same thing get flagged, and the distinction
(or a merge suggestion) goes to the user before commit.

### B5. Present for confirmation

Lead with the inferred type and phase, exactly in this shape:

> Adding as **step**, phase: **milestone** — look right?

Then the full draft JSON in a code block, then any runner-up phase or
overlap question. Apply edits, re-show, then Commit.
