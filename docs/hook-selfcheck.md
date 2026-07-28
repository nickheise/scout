# Hook delivery self-check

Two-minute manual procedure to confirm, **on this machine**, whether
`bin/scout-hook-plan.mjs`'s `context` delivery (the shipped default) actually
reaches the model — and how to flip to the verified `block` fallback if not.

## Why this exists

`docs/research/hook-spike.md` (Q2) could not confirm live whether a hook's
`hookSpecificOutput.additionalContext` demonstrably re-enters the model's
context, because the build sandbox had no authenticated `claude` session
(`OAuth session expired`). The mechanism is real and wired up generically
(confirmed in decompiled merge code), but "wired up" is not the same claim as
"the model reads it" — only a live run settles that. DECISIONS.md D-013 ships
both delivery paths behind a named constant precisely so this gap doesn't
block Phase 3; this doc is the fifteen-minutes-becomes-two-minutes version of
the check the spike recommended before trusting `context` in production.

Run this once per machine/CLI-version you care about (a laptop, a CI runner,
a teammate's setup) — the answer can legitimately differ if Anthropic changes
hook plumbing between CLI releases.

## Method (adapted from the spike's codeword harness)

The spike's `--inject` + "ask the model to repeat the codeword" method
worked because it's unambiguous: if the model says a nonsense string it
could only have seen via the injected hook output, delivery worked. We reuse
that shape here, but with Scout's own real hook and a real (if disposable)
pack entry instead of a synthetic logger.

### 1. Set up a scratch pack with a codeword entry (~30s)

```bash
export SCOUT_PACK=$(mktemp -d)
node bin/scout-store.mjs create --pack "$SCOUT_PACK" \
  --set id=selfcheck-codeword \
  --set type=pack \
  --set title="Selfcheck Codeword" \
  --set url=https://example.com/selfcheck \
  --set install="n/a" \
  --set summary="Selfcheck fixture only." \
  --set 'surfaces_when=["the plan mentions the codeword ZEBRA-QUARTZ-4471"]' \
  --set ambient_line="Selfcheck Codeword — fixture entry, contains ZEBRA-QUARTZ-4471."
```

(`ZEBRA-QUARTZ-4471` is an arbitrary nonce — pick your own if you like, it
just needs to be something the model can't plausibly produce by chance.)

### 2. Wire the hook into a scratch project (~30s)

In a throwaway project directory, add `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [{ "type": "command", "command": "node /absolute/path/to/scout/bin/scout-hook-plan.mjs", "timeout": 10 }]
      }
    ]
  }
}
```

Export `SCOUT_PACK` (from step 1) in the shell you launch `claude` from, so
the hook sees the codeword pack.

### 3. Trigger a plan and ask the model what it saw (~1 min)

```bash
claude
```

Then, in the session: ask for a plan substantial enough to clear
`MIN_TEXT_CHARS` (40 chars — anything more than a one-liner), e.g. "make a
plan to add a contact form to this project" — let it enter plan mode and
call `ExitPlanMode`. Once it exits plan mode, ask directly: **"Did you see
any codeword in context just now? If so, what was it, verbatim?"**

- **Model names `ZEBRA-QUARTZ-4471`** → `context` delivery is confirmed
  working on this machine/CLI version. Nothing to change — `DELIVERY =
  'context'` (the shipped default in `bin/scout-hook-plan.mjs`) stays as-is.
- **Model reports nothing, or denies seeing anything** → `context` delivery
  is not reaching the model here. Flip to `block` (see below) and re-run
  step 3 to confirm the fallback: this time the tool call itself should be
  visibly denied/interrupted, and the transcript should show the model
  reacting to the pointer text (e.g. acknowledging it was blocked, or
  restating the instruction) — that reaction is the fallback's own
  confirmation, since `exit 2` + stderr is the platform's universally
  documented "always surfaced to the model" contract (no Q2-style
  uncertainty applies to it).

### 4. Clean up

```bash
rm -rf "$SCOUT_PACK"
```

Remove the scratch project and its `.claude/settings.json` too.

## How to flip `DELIVERY`

Edit the constant near the top of `bin/scout-hook-plan.mjs`:

```js
export const DELIVERY = 'context'; // change to 'block' if step 3 above fails
```

`'block'` only takes effect on `PreToolUse` (i.e. `ExitPlanMode`) — the
script structurally cannot "block" a `PostToolUse(TodoWrite)` call after the
fact (the tool already ran), so it always falls back to `context` delivery
for that trigger regardless of the constant. This is intentional, not a bug:
see the module header comment in `scout-hook-plan.mjs`.

For automated testing (not day-to-day use), `SCOUT_HOOK_DELIVERY=context` or
`SCOUT_HOOK_DELIVERY=block` overrides the constant for a single invocation —
`test/hook.test.mjs` uses this to exercise both code paths without needing
two copies of the file. Don't rely on this env var for a real deployment;
nobody sets it by accident, which is the point, but it also means it's easy
to forget it's set. Edit the constant for anything that ships.

## Recording the result

If you run this check, consider adding a line to
`docs/research/hook-spike.md`'s Q2 section noting the CLI version tested and
the outcome — turning this from a one-off local check into part of the
project's evidence trail. This doc intentionally doesn't hardcode "as of
version X, context works" — that claim decays the moment Anthropic changes
hook plumbing, and a stale confident claim here is worse than an honest "run
the check yourself."

### Log

**2026-07-26 — CLOSED, CLI 2.1.220, sandboxed CCR environment
(`claude auth status` → `loggedIn: true`).** `additionalContext` delivery
confirmed live via `PreToolUse` (matcher `Bash`) and independently via
`UserPromptSubmit` — both times the model quoted the injected codeword
verbatim and correctly attributed it to a hook system-reminder. Full
result recorded in `docs/research/hook-spike.md` Q2 and DECISIONS.md D-021.

**Method deviation worth knowing about:** this environment's headless
`claude -p` does not expose `ExitPlanMode` as a callable tool at all — with
`--permission-mode plan`, the model's own `ExitPlanMode` call errored
`"exists but is not enabled in this context"`; without that flag, the tool
was simply absent from its tool list. If you hit the same wall on your own
machine, don't conclude delivery is broken — substitute a `PreToolUse` hook
matched on a tool that *is* available in `-p` mode (e.g. `matcher: "Bash"`)
and ask the model to report what it saw right after that tool call. The
delivery contract runs after the matcher filter, so it's the same code path
Scout's real hook uses; only the triggering tool differs. A genuine
interactive-terminal run with real `ExitPlanMode` (the method above) is
still the more literal test if you have one available.
