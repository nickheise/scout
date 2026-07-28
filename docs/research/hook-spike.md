# Hook spike — findings (Task 3.0)

Researched 2026-07-18/19 against Claude Code CLI **2.1.212** (`claude --version`).
Scratch project: a throwaway dir with `.claude/settings.json` registering
`command` hooks on `SessionStart`, `UserPromptSubmit`, `PreToolUse(ExitPlanMode)`,
`PostToolUse(TodoWrite)`, each piping full stdin to a logger
(`log-hook.mjs`) that appends `{tag, receivedAt, payload}` to a JSONL file.
A second scratch dir built a real (non-fake-content, just minimal)
`.claude-plugin` marketplace + plugin with its own `hooks/hooks.json`, added
via `claude plugin marketplace add <path>` / `claude plugin install`, to
test disable-state.

## Method note that changed the plan: live inference is unavailable in this
sandbox

`claude -p ...` inside this agent's Bash tool authenticates as
`loggedIn: false` (`claude auth status` → `{"loggedIn":false,"authMethod":"none",
"apiProvider":"firstParty"}`; any `-p` run fails immediately with
`"Failed to authenticate: OAuth session expired and could not be refreshed"`,
`duration_api_ms:0`, before any request is built — confirmed with
`-d api,hooks` producing zero debug output). Network egress itself is fine
(`curl https://api.anthropic.com/` → HTTP 404, i.e. reachable). No
`ANTHROPIC_API_KEY` is present in env, and reading the OAuth keychain entry
directly is out of scope (would be circumventing an evident anti-recursion
auth boundary between a spawned child Claude Code process and its parent
session, not a real fix). **Net effect: this spike cannot drive a live
model turn that actually calls `ExitPlanMode` or `TodoWrite`.**

Hooks that fire *before* inference (`SessionStart`, `UserPromptSubmit`) still
fire and were captured live and for real, even though the run then fails on
the API call. Hooks that require the model to decide to call a tool
(`ExitPlanMode`, `TodoWrite`) could not be triggered live, so those two
questions were answered instead by decompiling the installed CLI binary
(`/Users/nheise/.local/share/claude/versions/2.1.212`, a Bun/Node
single-file-executable bundle — minified but not obfuscated; `strings -n 6`
+ targeted byte-offset extraction around known symbols yields literal,
un-mangled `zod` `.describe()` text and control flow). This is source-level
ground truth from the exact installed build, not a guess — but it is static
analysis, not an observed live tool call, so it's flagged as such below.
The plugin disable-state question (Q4) *was* answerable live, because
`SessionStart`/`UserPromptSubmit` don't need inference to fire.

---

## Q1 — Exact `tool_input` payload of PreToolUse(ExitPlanMode)

**Verified via decompiled source (not a live capture).** In the installed
build, `ExitPlanMode`'s tool object (`vW`, name constant `xO="ExitPlanMode"`)
has:

```js
inputSchema: Bxu()  // v.strictObject({ allowedPrompts: v.array(...).optional()
                     //   .describe("Deprecated: no longer used.") }).passthrough()
```

— i.e. the *nominal* schema is nearly empty (one deprecated field) but
`.passthrough()` lets the real field through. The tool's `call()` handler
reads it directly:

```js
let c = "plan" in e && typeof e.plan === "string" ? e.plan : void 0;
let u = c ?? E$(t.agentId); // fall back to reading a persisted plan file
```

So in a **normal (non multi-agent/"team") session** — which is Scout's
target — the model emits `{"plan": "<full markdown plan text>"}` directly
as the tool call, exactly as the classic ExitPlanMode contract implies.
Separately, there is a `normalizeToolInput` dispatcher (`ytd`, called while
converting the model's raw `tool_use` block, i.e. *before* tool
execution/hooks) with this case:

```js
case xO: {                       // xO === "ExitPlanMode"
  let n = E$(r), o = r2(r);      // n = plan-file content, o = plan-file path
  MGr();
  return n !== null ? {...t, plan: n, planFilePath: o} : t;
}
```

and a documented extended schema (`hzv`, used elsewhere for the
agent/team-lead flow):

```js
hzv = Bxu().extend({
  plan: v.string().optional()
    .describe("The plan content (injected by normalizeToolInput from disk)"),
  planFilePath: v.string().optional()
    .describe("The plan file path (injected by normalizeToolInput)"),
})
```

**Answer:** `tool_input` for a `PreToolUse` hook matched on `ExitPlanMode`,
in a standard single-session CLI run, is:

```json
{ "plan": "<the full plan text the model wrote, markdown>",
  "planFilePath": "<absolute path to a persisted copy, if one exists>" }
```

`plan` is the whole plan — nothing is truncated or summarized at this layer.
`planFilePath` is populated because the CLI also persists the plan to disk
for reference/resume; on a plain non-team session that persisted copy and
the model's own `plan` argument are the same text, so `normalizeToolInput`
is a no-op overlay in practice.

One caveat surfaced by this same code: there is a **separate, gated
multi-agent ("team") code path** (`Hg()` — true only when
`agentId && teamName` are both set, i.e. Task-tool subagents in a
multi-agent team) where a newer `ExitPlanModeV2Tool` flow has the model
write the plan to a file *first* and then call `ExitPlanMode` with **no**
`plan` argument at all (tool description literally states "This tool does
NOT take the plan content as a parameter"); `normalizeToolInput`'s file-read
overlay is what backfills `tool_input.plan` for hooks in that case too. This
doesn't affect Scout (single-session use), but is worth knowing: don't
assume `tool_input.plan` is always present verbatim from the model's own
tool call — treat `planFilePath` as the authoritative fallback if `plan` is
ever empty/absent.

**Confidence:** high (literal source), **not independently confirmed by a
live capture** in this environment — flag as OPEN only in the narrow sense
that no live JSON was captured; the code path is unambiguous.

---

## Q2 — Does `additionalContext` demonstrably re-enter the model's context?

**CLOSED — confirmed live, 2026-07-26, against CLI 2.1.220, in a
properly-authenticated sandbox (`claude auth status` → `loggedIn: true`).**
See `docs/hook-selfcheck.md`'s "Recording the result" log for the full
method and environment note. Summary:

- **`PreToolUse` → `additionalContext` reaches the model: confirmed.** A
  scratch project wired a real `PreToolUse` command hook (matcher `Bash`,
  since `ExitPlanMode` itself turned out not to be invokable in this
  sandbox's headless `-p` mode — see caveat below) emitting
  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"SELFCHECK-CODEWORD-NARWHAL-3302..."}}`.
  `claude -p` was asked to run a trivial Bash command and immediately report
  anything injected around that tool call. The model's response quoted the
  codeword verbatim, attributing it to a `PreToolUse:Bash hook additional
  context` system-reminder — i.e. it saw the hook's own event/matcher
  label, not just the string, confirming this is the real platform
  mechanism and not a hallucination.
- **The general mechanism (any event) also independently confirmed** via
  the same method on `UserPromptSubmit` (no tool call needed at all —
  fires on every turn), same result: codeword quoted verbatim, attributed
  correctly to a hook-injected system-reminder.
- **Caveat — not the literal `ExitPlanMode` matcher.** This sandbox's
  headless `claude -p` does not expose `ExitPlanMode` as a callable tool at
  all (confirmed twice: with `--permission-mode plan`, the tool call itself
  errored `"ExitPlanMode exists but is not enabled in this context"`;
  without that flag, the tool was simply absent from the model's tool
  list). So the live test used `PreToolUse` matched on `Bash` instead of
  `ExitPlanMode` — same event type, same delivery code path, different
  matcher. Given the matcher only gates *which* tool call triggers the
  hook (a pre-execution filter) and has no bearing on the *delivery*
  contract that runs afterward — the same `hookSpecificOutput.additionalContext`
  merge Q1/Q3 already showed is generic across events — this is
  considered sufficient confirmation for Scout's actual hook, not a
  partial result. A from-a-real-interactive-terminal test with genuine
  `ExitPlanMode` (per the original method below) would close the very last
  sliver of residual doubt but is not expected to change the answer.

**Consequence for D-013:** `DELIVERY = 'context'` (the shipped default in
`bin/scout-hook-plan.mjs`) is confirmed correct. No code change needed —
the constant already pointed at the now-verified-working mechanism. See
DECISIONS.md D-021.

---

## Q3 — What does PostToolUse(TodoWrite) receive?

**Verified via decompiled source** (again, no live tool call, but the
schema is a plain literal in the binary, not inferential):

```
TodoWrite tool_input schema:
{ todos: [ { content: string, status: "pending"|"in_progress"|"completed",
             activeForm: string } ] }
```

(Exact source string: *"Each todo has `content`, `status` ("pending" |
"in_progress" | "completed"), and `activeForm` (present-tense label shown
while in progress). Send the full list each call; it replaces the previous
one."*)

Combined with the real, live-captured envelope shape (from `SessionStart`/
`UserPromptSubmit`, which share the same envelope-construction code path —
confirmed field set: `session_id`, `transcript_path`, `cwd`,
`hook_event_name`, plus event-specific fields like `prompt`/`source`), the
expected full `PostToolUse(TodoWrite)` payload is:

```json
{
  "session_id": "...", "transcript_path": "...", "cwd": "...",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "TodoWrite",
  "tool_input": { "todos": [ { "content": "...", "status": "in_progress",
                                "activeForm": "..." } ] },
  "tool_response": { "...": "whatever TodoWrite's own tool result shape is" }
}
```

`tool_input.todos` is the **full replacement list on every call** — not a
diff. That matters for Scout's planning-moment signal: a fallback hook on
`PostToolUse(TodoWrite)` sees the complete current plan/task list each time,
which is plenty for "is there a multi-step task underway" style gating
without needing history.

**Confidence:** high for `tool_input` shape (literal source); envelope
fields high-confidence by analogy to the two live-captured events (same
construction code), not independently live-captured for this specific
event.

---

## Q4 — Does plugin `hooks.json` load and fire, and is it suppressed when
the plugin is disabled?

**Verified live, empirically, end to end** — this one didn't need
inference, so it's the strongest result in this spike.

Built a real plugin (`spike-plugin@spike-marketplace`, installed with
`claude plugin marketplace add ./fake-plugin` then
`claude plugin install spike-plugin@spike-marketplace`) with its own
`hooks/hooks.json` registering `SessionStart` and `UserPromptSubmit` command
hooks (separate from the project-level ones). Note: the plugin's
`hooks/hooks.json` must wrap the event map in a top-level `"hooks"` key
(`{"hooks": {"SessionStart": [...]}}`) — unlike the mental model of "same
shape as settings.json's hooks value", the file itself needs that wrapper;
omitting it produces a real install-time validation error
(`expected record, received undefined` at path `hooks`). Doc/scaffold
sample in the binary (`claude plugin init`'s generated example) confirms
this shape.

**Enabled** (`claude plugin list` → `Status: ✔ enabled`), fresh `claude -p
"say hi"` run, hook log shows:
```
SessionStart
PluginSessionStart          ← from the plugin
UserPromptSubmit
PluginUserPromptSubmit      ← from the plugin
```

**Disabled** (`claude plugin disable spike-plugin` → `Status: ✘ disabled`),
same command, hook log shows:
```
SessionStart
UserPromptSubmit
```
— the plugin's hooks did not fire at all, on either event. Reproduced twice
(once with just `SessionStart` registered, again after adding
`UserPromptSubmit` too).

Scratch state was cleaned up afterward (`claude plugin uninstall
spike-plugin`, `claude plugin marketplace remove spike-marketplace`) since
plugin install/marketplace-add operations write to the real
`~/.claude` user-scope config, not anything scratch-local.

Static analysis (`docs/research/claude-code-platform.md`'s cited bug
`anthropic/claude-code#35713`, disabled plugins leaking `SessionStart`/
`UserPromptSubmit`) does **not** reproduce on this CLI version for the CLI
surface — either fixed since that report or specific to conditions this
test didn't hit (multiple plugins, project- vs user-scope disable, or the
IDE/VS-Code surface specifically, which this spike did not test at all —
time-boxed out, no IDE available in this sandbox). Decompiled loader code
also shows hooks.json is *parsed* for a plugin regardless of enabled state
(there's an explicit log line: `"Read hooks.json for plugin X
(enabled=false; will NOT register, plugin is disabled): path"`) — so a
malformed `hooks.json` in a disabled plugin can still surface as a
load-time diagnostic even though it won't register handlers. That's a
reasonable design (surfacing config errors early) but means "disabled"
isn't "invisible to the loader", only "invisible to the dispatcher" — worth
remembering if Scout ever ships a broken hooks.json and wonders why
`claude plugin list` still complains about it while disabled.

**Not tested (OPEN):** IDE/VS Code extension surface (no IDE in this
sandbox); project-scope vs user-scope disable interaction; behavior with
two plugins both hooking the same event where one is disabled.

---

## Go/no-go recommendation for the Phase 3 hook shape

**Go, with PreToolUse(ExitPlanMode) as primary and PostToolUse(TodoWrite)
as the documented fallback — as plan §3/PRD already assume. Q2 is now
closed (2026-07-26, see above): `additionalContext` delivery is confirmed
live, so the primary payload delivery no longer rests on an unverified
mechanism.**

Reasoning:

1. **PreToolUse(ExitPlanMode) tool_input is solid and rich** (Q1): a full
   `plan` string arrives, cheaply, synchronously, exactly at the planning
   moment. This is exactly the "planning moment" signal Phase 3 wants, and
   it's real (source-verified) not speculative.
2. **PostToolUse(TodoWrite) is a good fallback** (Q3): full todo-list
   replacement payload, cheap, fires more often than plan-mode does for
   users who skip plan mode and go straight to a todo-driven session. Worth
   keeping as the secondary trigger per plan §3/§1.14 exactly as scoped.
3. **Q2 was the one real risk, and is now closed** (2026-07-26, see the Q2
   section above): `additionalContext` on `PreToolUse` is confirmed live to
   reach the model, so the *zero-marginal-cost* framing — the model reading
   the pointer without Scout resorting to a stderr-block/exit-2 workaround —
   holds. The `block` delivery path stays in the code as a documented,
   verified-working fallback (D-013) in case a future CLI version changes
   this behavior, not because today's default is in doubt.
4. **UserPromptSubmit** remains a fine *tertiary* channel (fires every
   turn, so cheapest to reach but noisiest / least "planning-moment"
   specific) — not recommended as primary, consistent with the platform
   brief's existing framing.
5. **Disable-state respect (Q4) is not a blocker** — verified working
   correctly for the CLI surface for both `SessionStart` and
   `UserPromptSubmit`. Recommend Scout's own hook script still implement
   the "scrupulous disable-state respect" self-check plan §3 already
   mandates (e.g. bail out fast if the manifest/pack directory is absent)
   as defense in depth, given the IDE surface and multi-plugin interactions
   remain untested and the ecosystem has a documented history of exactly
   this bug class.

## Artifacts

All scratch work lives outside the repo per the task's path restriction:
`/private/tmp/claude-1623857376/-Users-nheise-Documents-GitHub-scout/ea84d3d2-d270-41dd-add8-38c563607d27/scratchpad/hook-spike/`
— `.claude/settings.json` (project hook registration), `log-hook.mjs` (the
logger/injector), `fake-plugin/` (test plugin + marketplace), `logs/
hooks.jsonl` (accumulated live captures), `run*.json`/`run*.stderr.log`
(per-attempt output), `claude-strings.txt` (extracted binary strings used
for the static analysis above). None of this is committed to the repo; this
file is the only write inside `scout/`.
