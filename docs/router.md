# The bare `/scout` router — manual install

Scout's plugin verbs are always namespaced with a colon —
`/scout:add`, `/scout:archive`, `/scout:list`, `/scout:start`,
`/scout:explain`, `/scout:survey`, `/scout:setup` — because Claude Code
plugins can never claim a bare top-level command (D-012 in `DECISIONS.md`).
If you'd rather type `/scout add <url>` without the colon, install this
tiny personal-skill router once. It contains no Scout logic of its own —
it just splits your first word off and forwards the rest straight to the
matching `/scout:<verb>` command — so it almost never needs to change even
as the plugin updates underneath it.

`/scout:setup` offers to install this for you interactively (Phase 4). This
doc is the manual path, for anyone who wants it before then or who prefers
to see exactly what's being copied where.

## Why this is a separate, personal install

Personal skills (`~/.claude/skills/<name>/SKILL.md`) and plugin skills
(`<plugin>/skills/<name>/SKILL.md`, invoked as `/<plugin>:<name>`) are two
different namespaces that never collide. The plugin remains the
auto-updating brain — installed once via the marketplace, subscribe-not-
fork, every fix live on your next update check. The router is the opposite
kind of artifact on purpose: a **copy**, not a subscription. You own it,
Scout never touches it again after this install, and that's fine — because
it does nothing but forward, there is essentially nothing in it to go
stale.

## Install

1. Make sure the Scout plugin itself is installed first (the router has
   nothing to forward to otherwise):
   ```
   /plugin marketplace add nickheise/scout
   /plugin install scout@scout
   ```
2. Copy the template directory from this repo into your personal skills
   folder:
   ```
   mkdir -p ~/.claude/skills/scout
   cp <scout-repo>/templates/scout-router/SKILL.md ~/.claude/skills/scout/SKILL.md
   ```
   (If you installed Scout via the plugin marketplace rather than a local
   clone, the plugin's cached copy lives under
   `~/.claude/plugins/cache/scout/scout/<version>/templates/scout-router/SKILL.md`
   — use that path instead of a repo checkout.)
3. Start a new Claude Code session (personal skills are picked up at
   session start).
4. Verify: run `/scout list`. It should behave exactly like
   `/scout:list` — same output, because that's the command it just routed
   you to.

## Uninstall

Delete the directory: `rm -rf ~/.claude/skills/scout`. The plugin and your
pack are completely unaffected — this was always just a forwarding shim.

## What "contains no duplicated logic" means in practice

If you open `templates/scout-router/SKILL.md`, you'll find no fetching, no
pack reads, no drafting — just: read the first word of what you typed,
check it against the seven-verb slate, and invoke the namespaced command
with everything else passed through unchanged. Every verb's actual
behavior — the ingestion prompt, the archive confirmation, the compile-and-
inject ritual — lives exactly once, in the plugin. The router never
forks that logic, so there is nothing in it to drift out of sync.

## Known limitation

Routing depends on this Claude Code build exposing a way for a skill's
instructions to invoke another slash command programmatically. If a future
platform change removes that capability, the router degrades to naming the
exact `/scout:<verb>` command for you to run yourself rather than silently
failing or reimplementing verb behavior — see the skill's own "Step 2" for
the honest-stop wording. This has not been exercised against a live
Claude Code session as part of this build; treat the routing mechanism
itself as unverified until it's been run interactively (see
`docs/plan.md` §4 task 2.7's acceptance line).
