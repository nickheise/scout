---
name: list
description: List your Scout pack — active entries by type (pack/step) and phase, or filtered by a word you give it (a type, a status, or an id/title fragment). Read-only; never changes anything.
disable-model-invocation: true
argument-hint: "[filter]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" *)
---

# /scout:list — a readable listing of the pack

You are showing the user what their pack carries, clearly organized.
This is a pure read: nothing is written, nothing is asked for confirmation,
because nothing changes.

## Hard Rules

1. **Read-only.** Never call `create`, `update`, `archive`, or `reactivate`
   from this skill. If the user's filter text looks like a request to change
   something ("archive dialkit"), say so and name the right verb
   (`/scout:archive`) instead of acting on it yourself.
2. **No pack configured is not an error to paper over.** If the store
   command fails because no pack directory exists yet, say that plainly and
   point to `/scout:setup`. Don't invent an empty listing.
3. **Stay in your lane.** List, and only list. Never chain into another
   `/scout:` verb — name it and let the user run it.

## Step 1 — Fetch

Run `node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" list --json` to get
every entry, active and archived, of both types. (If any invocation here
errors on its flags, run the script bare or with `--help` and follow its
printed usage — the script's own usage line is the source of truth.)

If `$ARGUMENTS` is non-empty, treat it as a filter. It may name:
- a **type**: `pack` or `step`
- a **status**: `active` or `archived`
- neither cleanly — in that case, treat it as a free-text match against
  `id` and `title` (case-insensitive substring). If nothing matches, say so
  and show the full active listing instead of returning silence.

Default (no arguments): show **active** entries of both types. Archived
entries are omitted by default — they're not gone, just not underfoot; a
user who wants the graveyard can ask (`/scout:list archived`) or use the
browse page.

## Step 2 — Present

Group the result for scanability, not as a raw JSON dump:

- **Pack** (if any), each line: `id` — `ambient_line` (or `title` if the
  entry has no `ambient_line` yet), with stack tags in parens when present.
- **Steps** (if any), grouped by `phase` in this order: `init`, `ongoing`,
  `milestone`, `wrap`. Each line: `id` — the `instruction`, truncated to one
  clause if it's long, with `produces` noted in parens when set.
- If a status filter surfaced archived entries, show each with its
  `superseded_by` inline when set ("archived → superseded by `<id>`").
- End with a one-line count: "N active (P pack, S steps), M archived."

If the pack is empty (no entries at all — Scout ships empty), say that
plainly and point to `/scout:add` rather than showing an empty table.

## Done when

The user has seen every entry the filter selected, grouped and labeled
clearly enough to act on (`/scout:explain <id>` for detail, `/scout:archive
<id>` to retire one) — and nothing was written, because this verb never
writes.
