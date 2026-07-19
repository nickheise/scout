---
name: explain
description: Show one pack entry's full detail with provenance — summary, surfaces_when, notes, supersession chain (what it replaced and/or what replaced it), dismissal history, and why it's in the pack. Read-only.
disable-model-invocation: true
argument-hint: "<id>"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" *)
---

# /scout:explain — full provenance for one entry

The name promises reasoning, so the output has to deliver it: not just what
an entry is, but where it came from, whether anything has replaced or been
replaced by it, and how it's actually fared (dismissals) since it was
added. Pure read — nothing is written, nothing is asked for confirmation.

## Hard Rules

1. **Read-only.** Never call `create`, `update`, `archive`, or `reactivate`
   from this skill, even if the user's phrasing sounds like a request to
   change something. Name the right verb and stop.
2. **Show the whole entry, not a summary of a summary.** Every field that
   has a value gets surfaced somewhere in the output; don't silently drop
   `notes` or `dismissals` because they seem minor — that's exactly the
   provenance this verb exists to promise.
3. **Supersession is bidirectional.** Report both directions: what this
   entry itself points at (`superseded_by`, if archived in favor of
   something) *and* what points at this entry (any other entry whose
   `superseded_by` names this id) — the full chain matters, not just one
   link of it.
4. **No pack configured, or unknown id, is not an error to paper over.**
   Say plainly what went wrong (no pack yet → `/scout:setup`; unknown id →
   offer a close match from a quick `list`, don't guess).
5. **Stay in your lane.** Explain, and only explain. Never chain into
   another `/scout:` verb — name it and let the user run it.

## Step 1 — Fetch

1. Read the target: `node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" read
   <id>`. (If any invocation here errors on its flags, run the script bare
   or with `--help` and follow its printed usage.)
2. If that fails because the id doesn't exist, run
   `node "${CLAUDE_PLUGIN_ROOT}/bin/scout-store.mjs" list --json`, look for
   a close id/title match, and offer it — don't guess silently.
3. Pull the full listing (`list --json`) regardless of the fetch's
   outcome, once you have a valid entry, to resolve the supersession chain
   (Hard Rule 3): scan for any entry whose `superseded_by` equals this
   entry's id (predecessors), and if this entry itself carries a
   `superseded_by`, note the successor's title too.

## Step 2 — Present

Structure the output around what the entry actually is (`type`), never a
generic template:

- **Header:** title, id, type, status (with `superseded_by` inline if
  archived).
- **What it is:** for a pack entry, `summary`, `url`/`repo`, `install`,
  `stack` if recorded. For a step entry, `instruction`, `phase`, `produces`
  and `automation` if set.
- **Why it surfaces (pack entries only):** the full `surfaces_when` list —
  this is the field the surfacing gate matches against, and the user is
  entitled to see exactly what triggers it.
- **The user's own words:** `notes`, verbatim, if set. If null, say there
  are none rather than omitting the section silently.
- **Timeline:** `added`, `verified` (flag if `verified` looks stale — more
  than a few months old — and mention that Scout offers a lazy re-verify
  when an entry is about to surface or be adopted, not on a schedule).
- **Supersession chain:** predecessors (entries this one superseded, if
  any) and successor (if this entry is archived in favor of something),
  each with a one-line note in the courier-style provenance voice ("you
  archived `shadcn-legacy` in favor of this").
- **Dismissal history:** the `dismissals` count, plainly stated. Note
  honestly that the richer per-context rejection ledger (reasons, not just
  a count) is a later-phase capability not yet built, so this is the
  count alone for now — don't imply detail that isn't there.

## Done when

Every non-null field on the entry has appeared somewhere in the output, the
supersession chain is reported in both directions, and nothing was written
— **or** the run stopped honestly because the id didn't resolve or no pack
is configured, with a plain statement of which.
