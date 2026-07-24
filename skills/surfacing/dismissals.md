# Surfacing — dismissal capture & the archive nudge

Loaded from SKILL.md at wave-off and wrap/milestone moments. SKILL.md's
Hard Rules, named constants (`NUDGE_THRESHOLD`), and ledger line shape
apply throughout — this file adds the capture procedure, nothing else.

## Dismissal capture (D-008 semantics)

Two cases, two timings — never conflate them:

**Explicit — immediate.** The user waves off a surfaced report in-flow
("no thanks", "not for this", "stop suggesting that"). Right then:

1. `read <id> --json` for the current count, then increment:
   ```
   node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" update <id> --set dismissals=<n+1>
   ```
2. Append a `dismissed-explicit` ledger line, `context` = the need the
   report surfaced for, `reason` = the user's words, near-verbatim.
3. Check the nudge (below). Otherwise say nothing — a wave-off needs no
   acknowledgment beyond respecting it.

**Inferred — judged only at wrap / milestone / `/scout:survey` moments,
never mid-project.** For each report this project's ledger (and this
session) shows as `surfaced`: was that need subsequently **built with a
different approach** in this project? Only then is it an ignore — increment
`dismissals` and append a `dismissed-inferred` line whose `reason` names
the approach actually taken. **A feature abandoned or deferred is no
signal** — no increment, no line. When in doubt, it is no signal.

## The archive nudge

When an increment you just performed brings an entry's `dismissals` to
`NUDGE_THRESHOLD` or above, check the entry's `notes` first: if they
already contain a `nudged` marker, the question was asked once and answered
— never ask again. Otherwise ask exactly once, one line:

> `<id>` has been dismissed <n> times now — archive it?

- **Keep** — append the marker to `notes`, preserving what's there:
  ```
  node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" update <id> <<'JSON'
  {"notes": "<existing notes; >nudged 2026-07-19: kept"}
  JSON
  ```
- **Archive** — the user's yes is the confirmation Hard Rule 5 requires:
  `archive <id>` (add `--superseded-by <id2>` only if the user names a
  successor). Archived entries leave the match pool; no marker needed.
- **No answer** — the moment moves on: no marker, no archive; the nudge
  fires again at the next increment. Never re-ask within the same moment.
