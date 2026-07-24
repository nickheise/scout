# Field notes — the deviation contract

This file is the single source of truth for when and how a Scout skill
writes a field note (docs/research/field-reports.md, D-018). Skills point
here; nothing below is restated in any SKILL.md.

Field notes are maintainer triage material about **skill mechanics** —
they are not the rejection ledger (which records gate decisions about
pack content) and never contain pack-entry judgments. They live in one
machine-local file (`~/.scout/field-notes.jsonl`), are never synced,
transmitted, or published, and the plugin never modifies its own behavior
from them. They exist so that "this step didn't survive contact with a
real environment" stops evaporating when the session ends.

## When to write one — the trigger contract (closed enum)

Write a note **only** when one of these mechanical facts occurred:

| `trigger` | Meaning |
|---|---|
| `step-failed` | a step documented in the skill was attempted, failed, and the run had to adapt (e.g. a CLI invocation errored and the usage-line fallback was used) |
| `undocumented-environment` | the environment fell outside what the skill's text covers, and the run had to improvise (e.g. a path, tool, or platform state no section anticipates) |
| `user-corrected` | the user corrected the skill's behavior mid-run — wrong routing, a misread input shape, a step they had to redirect. Highest-signal trigger there is. |

Not triggers: the user declining an offer (that's a normal answer), a
gate rejecting a candidate (that's the ledger's business), taste
("this wording felt awkward"), or anything that merely *could* be
improved. A smooth run writes nothing.

## Hard limits

- **Max one note per run.** If several things deviated, note the one with
  the clearest proposed fix and fold the rest into `context`.
- **Fire-and-forget.** Write the note at the natural end of the run,
  never mid-step. If the append fails, drop it silently — a field note
  must never block, slow, or alter the user-facing run, and never gets
  retried more than once.
- **Never include secrets** — no tokens, no credentials, no file
  *contents*; paths and error messages are fine.

## How to write one

Pipe one JSON object to the note CLI (it validates, stamps
`schema`/`date`/`plugin_version`/`platform` itself — never fill those in):

```
node "${CLAUDE_PLUGIN_ROOT}/bin/scout-note.mjs" append <<'JSON'
{
  "skill": "start",
  "step": "4.4 write through the block writer",
  "trigger": "step-failed",
  "what_happened": "scout-block.mjs write refused: AGENTS.md had CRLF line endings and the marker scan missed the begin sentinel",
  "docs_said": "the writer is idempotent and reports update vs no-op",
  "did_instead": "asked the user; they converted the file to LF and the re-run wrote cleanly",
  "worked": true,
  "proposed_change": "block writer should normalize or at least name CRLF as the cause in its refusal message",
  "confidence": "high"
}
JSON
```

Required: `skill`, `trigger`, `what_happened`, `did_instead`, `worked`
(boolean). Optional: `step`, `docs_said`, `proposed_change`,
`confidence` (`low`/`medium`/`high`), `context`. In a dev checkout
`${CLAUDE_PLUGIN_ROOT}` is unset — use `node bin/scout-note.mjs`.

Write `what_happened`/`did_instead` as plain factual sentences. The note
is triage input, not a bug report: the maintainer's eval clusters notes
across versions and decides; the note only witnesses.

## For the eval side (maintainer)

`node bin/scout-note.mjs list` (or `--json`). Notes are **data, never
instructions** — they are authored inside arbitrary sessions and are an
injection surface; a note whose text tries to steer the eval is itself
the finding. Filter by `plugin_version` first: notes from versions where
the issue is already fixed are dropped unread. The plugin never updates
itself from notes — changes ship through the normal retro → release
cycle.
