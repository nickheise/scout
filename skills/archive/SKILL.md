---
name: archive
description: Retire an entry from your Scout pack — optionally pointing at what superseded it ("archive dialkit in favor of react-spring"). Archived entries leave the manifest and match pool immediately but keep full history and can always be reactivated later; this is never deletion. Confirmed before anything is written.
disable-model-invocation: true
argument-hint: "<id> [in favor of <id>]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" *)
---

# /scout:archive — retire an entry, never delete one

You are helping the user retire something from active use without losing a
shred of its history. Archiving is a status flip plus, optionally, a
provenance pointer to what replaced it — every other field on the entry
(added, verified, dismissals, notes) is untouched, and the entry can be
reactivated in full at any time. Treat this as a meaningful, one-way-feeling
decision even though it isn't irreversible: confirm before you act.

## Hard Rules

1. **Confirm before writing.** Show what will change — the entry's title,
   its current status, and (if given) the successor's title — and get an
   explicit go-ahead before calling `archive`. Never infer consent from the
   user having typed the command; "archive dialkit" is a request to review
   and confirm, not a standing order to execute blind if anything about the
   target is ambiguous (see Step 2).
2. **This verb never deletes, migrates, or rewrites history.** It sets
   `status: archived` and optionally `superseded_by`. Nothing else about the
   entry changes. Say so if the user seems to expect the entry to vanish.
3. **Never invent a successor id.** If the user says "in favor of X" and X
   doesn't match any existing entry (active or archived) by id or a close
   title match, say so and ask — don't guess a slug.
4. **Reactivation isn't this skill's job.** If the user wants to undo a
   previous archive, that's a store `reactivate` call via natural language
   or the MCP tool (D-011's courier pattern) — outside this verb's scope.
   Point them there rather than trying to handle it here.
5. **Stay in your lane.** Archive, and only archive. Never chain into
   `/scout:list` or `/scout:explain` yourself to look things up — you may
   run read-only store lookups directly (Step 1) to resolve ids, but never
   invoke another `/scout:` verb.

## Step 1 — Resolve the target(s)

Parse `$ARGUMENTS`. The expected shapes are `<id>` and `<id> in favor of
<id2>` (also accept "superseded by" as a synonym for "in favor of" — same
meaning, different phrasing).

Look up every id mentioned with
`node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" read <id>`. (If any
invocation here errors on its flags, run the script bare or with `--help`
and follow its printed usage.)

- If the target id doesn't exist: say so, and if the text loosely matches
  another id or title, offer that as "did you mean `<id>`?" — don't act on
  a guess.
- If the target is already `status: archived`: say so plainly (name its
  current `superseded_by` if set) and stop — nothing to do. If the user
  wants to *change* its successor, that's still an `archive` call (the
  store allows re-archiving with a new `--superseded-by`), but say
  explicitly that's what's about to happen.
- If a successor id is given and doesn't resolve: stop per Hard Rule 3.

## Step 2 — Confirm

Show, compactly:
- what's being archived: id, title, type.
- the successor, if any: id, title — and its own status (if the successor
  is itself archived, flag that oddity before proceeding; a chain pointing
  at an archived entry is probably a mistake).
- a one-line reminder that this doesn't delete anything and can be undone.

Wait for an explicit go-ahead. A bare re-run of the command is not
re-confirmation if anything about the resolved target changed since Step 1.

## Step 3 — Archive

Run:
```
node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" archive <id> [--superseded-by <id2>]
```
Report the result verbatim-in-spirit: what changed, and that it's
reversible ("archived `dialkit`, superseded by `react-spring`; reactivate
any time by asking your agent to reactivate it").

## Done when

The entry's status is `archived` (with `superseded_by` set if requested),
the user confirmed the exact change before it was written, and the report
named what changed and that it's undoable — **or** the run stopped honestly
at an unresolved id, an already-archived target, or a missing confirmation,
and said so plainly.
