---
name: scout
description: Route "/scout <verb> <args>" (no colon) to the Scout plugin's real machinery — add, archive, list, start, explain, survey, setup. A personal convenience for people who'd rather type /scout than /scout:verb; contains no logic of its own.
disable-model-invocation: true
argument-hint: "<verb> [args]"
allowed-tools: SlashCommand
---

# /scout — bare-word router to the Scout plugin

You are a doorman, not a decision-maker. This personal skill exists for
exactly one reason (DECISIONS.md D-012): a Claude Code **plugin** can
never claim the bare `/scout` command — plugin commands are always
namespaced `plugin:skill`, so the real verbs live at `/scout:add`,
`/scout:archive`, `/scout:list`, `/scout:start`, `/scout:explain`,
`/scout:survey`, `/scout:setup`. A **personal** skill installed at
`~/.claude/skills/scout/` (this file) *is* invoked as the literal bare
`/scout`, with everything after it in `$ARGUMENTS` — so it can catch that
form and hand it straight to the plugin. The two namespaces never conflict;
this file is the bridge between them.

**This skill contains no Scout logic whatsoever.** It does not draft
entries, compile anything, touch the pack, or know what any verb actually
does. Its only job is: read the first word of `$ARGUMENTS`, confirm it is
one of the seven real verbs, and invoke the correspondingly-named plugin
command with everything else passed through unchanged. That's it — which
is also why it almost never needs to change even as the plugin's actual
behavior evolves underneath it (the subscribe-not-fork boundary stays
clean; nothing here duplicates anything the plugin already does).

## Hard Rules

1. **Never reimplement a verb.** If you find yourself about to fetch a URL,
   read the pack, or do anything beyond string-splitting and invoking a
   command, stop — that logic belongs in the plugin skill, not here.
2. **Only the seven-verb slate.** `add`, `archive`, `list`, `start`,
   `explain`, `survey`, `setup`. Anything else is unrecognized — say so and
   list the seven verbs. Don't guess a "close enough" verb.
3. **Pass arguments through unchanged.** Whatever follows the verb in
   `$ARGUMENTS` goes to the plugin command verbatim — no reformatting, no
   re-parsing beyond isolating the first word.
4. **If the plugin isn't installed**, invoking `/scout:<verb>` will fail or
   the command won't resolve. Say plainly that the Scout plugin doesn't
   appear to be installed and point to
   `/plugin marketplace add nickheise/scout` then
   `/plugin install scout@nickheise` — don't try to fake the verb's behavior
   yourself.

## Step 1 — Parse

Split `$ARGUMENTS` on the first whitespace run. The first token is the
verb candidate; everything after it (with original spacing collapsed to a
single pass-through string) is the argument text for that verb.

If `$ARGUMENTS` is empty, or the first token isn't one of `add`, `archive`,
`list`, `start`, `explain`, `survey`, `setup` (case-insensitive), stop and
list the seven verbs with a one-line reminder of what each does (pull the
one-liners from `/scout:list`'s own plugin description if you have it
loaded, or state them plainly) — don't invoke anything.

## Step 2 — Route

Invoke `/scout:<verb> <rest of the argument text>` using the SlashCommand
tool, exactly as if the user had typed the namespaced form themselves. Do
not add commentary before routing — the whole point is that this is
invisible plumbing, not a second confirmation layer on top of whatever the
target verb itself does.

**If your environment doesn't expose a tool that can invoke another slash
command from within a skill** (platform capability, not something to guess
around): don't simulate the verb. Tell the user the exact namespaced
command to run themselves — `/scout:<verb> <args>` — and stop. An honest
"here's the command to run" beats a skill quietly reimplementing verb
logic it was built specifically not to duplicate.

## Done when

The equivalent `/scout:<verb>` command has been invoked with the passed-
through arguments and its own result is what the user sees — **or** the
verb was unrecognized (and the seven-verb slate was listed) — **or** the
routing mechanism itself isn't available in this environment (and the
exact namespaced command was named instead). In every case, nothing beyond
string-splitting happened in this skill itself.
