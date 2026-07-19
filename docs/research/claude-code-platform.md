# Claude Code platform brief (plugins, hooks, skills, MCP) — researched 2026-07-18

Engineering facts for building Scout as a Claude Code plugin. Items marked
**UNVERIFIED** must be spiked before we depend on them.

## Plugin anatomy

```
scout/
├── .claude-plugin/
│   ├── plugin.json          # manifest (required)
│   └── marketplace.json     # the repo is its own single-plugin marketplace
├── skills/<name>/SKILL.md   # each becomes /scout:<name> when user-invocable
├── hooks/hooks.json         # plugin-scoped hooks
├── agents/                  # optional custom agents
├── .mcp.json                # bundled stdio MCP server declaration
└── bin/                     # executables (hook scripts, MCP server)
```

plugin.json fields: `name, description, version, author{name}, homepage,
repository, license, skills[], commands[], agents[], hooks (path to
hooks.json), mcpServers{}`.

marketplace.json: `{ "name": ..., "owner": {...}, "plugins": [{ "name":
"scout", "source": "./", "version": ... }] }`. Users install with
`/plugin marketplace add <gh-user>/<repo>` then `/plugin install
scout@<marketplace-name>`.

**Updates:** if `version` is set, users update only when we bump it; if
omitted on a git-hosted plugin, every commit is a new version. We version
explicitly (mattpocock pattern: plugin.json version tracks package.json; bump
together; `claude plugin validate . --strict` in CI). Plugins cache at
`~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.

**Path substitutions** available in .mcp.json / hooks / skills:
`${CLAUDE_PLUGIN_ROOT}` (install dir), `${CLAUDE_PLUGIN_DATA}`
(`~/.claude/plugins/data/<plugin>/`, survives updates), `${CLAUDE_PROJECT_DIR}`.

## Hooks (the Phase 3 surface)

| Event | Fires | Inject context? |
|---|---|---|
| PreToolUse (matcher `ExitPlanMode`) | right when a plan is about to be presented | `additionalContext` ✓ — **primary candidate for planning-moment reports** |
| UserPromptSubmit | every prompt, before processing (30s timeout) | `additionalContext` ✓ |
| PostToolUse (matcher `TodoWrite`) | after todo list written | no direct injection documented |
| SessionStart | session begins | stdout ✓ — candidate for manifest-freshness checks |
| Stop | response finished | block-only; too late |

Hook output contract (exit 0 + JSON on stdout):
`{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision":
"defer", "additionalContext": "..."}}`. Output cap 10,000 chars. Exit 2 =
block with stderr as feedback.

**Agent-as-brain fit:** the hook itself must stay cheap (no LLM call, no
network). Pattern from the field (see ecosystem survey §5): hook does
sub-100ms local work and injects a short instruction + pointer; the *host
agent* then performs the gate judgment. `claude -p` inside a hook exists as a
pattern but violates our zero-marginal-inference tenet — do not use.

**UNVERIFIED — spike before Phase 3:**
1. Exact `tool_input` schema of ExitPlanMode (what plan text is available).
2. Whether `additionalContext` fully re-enters the model context.
3. Plugin hooks auto-load semantics + user disable behavior. Known bugs:
   disabled plugins still firing SessionStart/UserPromptSubmit injection
   (anthropic/claude-code#35713); additionalContext not injected in VS Code
   extension (#49063). Test CLI *and* IDE surfaces; respect disable state.

## Skills

SKILL.md frontmatter (fields we care about): `name`, `description` (the
trigger surface — invest heavily), `disable-model-invocation: true` for
user-only verbs, `argument-hint`, `allowed-tools`, `context: fork` (run
isolated), `model`/`effort` overrides.

**Namespacing reality:** a plugin named `scout` exposes `/scout:add`,
`/scout:list`, etc. — colon, not space. (PRD writes `/scout add`; docs must
show the real form.)

`$ARGUMENTS` / `$0, $1` substitution available. Multi-step confirm-before-
commit flows: `disable-model-invocation: true` + explicit draft-then-confirm
steps in the skill body + `allowed-tools` pre-approval for the pack folder.

## Bundled MCP

`.mcp.json` at plugin root, `type: stdio`, `command:
${CLAUDE_PLUGIN_ROOT}/bin/...`. Plugin-bundled servers auto-load when the
plugin is enabled; tools still get per-use permission unless a skill
pre-approves. Division of labor: skills = orchestration/choreography; MCP =
durable pack CRUD + query for natural-language access.

## CLAUDE.md / AGENTS.md

- Claude Code reads CLAUDE.md; **AGENTS.md is NOT auto-read** (July 2026).
  Convention for cross-agent support: content lives in one file, the other
  imports it via `@AGENTS.md` — or `start` writes the same managed block to
  whichever file the project uses (ask, never create both).
- Managed section: HTML-comment sentinels, idempotent rewrite-in-place. Full
  sentinel/corruption spec in `file-format-patterns.md`.
- SessionStart hooks are an alternative injection channel; CLAUDE.md block is
  the portable one (works in Cursor/Codex etc.) and is our primary.

## Doc URLs

plugins-reference, plugin-marketplaces, hooks, hooks-guide, skills,
mcp, memory — all under https://code.claude.com/docs/en/.
