# Scout

Scout remembers the tools and practices you meant to use, and reminds your
coding agent about them at the moment they'd actually help.

You save something once — a library, a habit. Scout compiles everything
you've saved into a short list that lives in your project's `CLAUDE.md`, so
your agent always knows those things exist, the way it already knows React
exists. Then, when you're planning a feature, Scout checks your list and
speaks up only if something genuinely fits.

No database, no account, no API key. Scout never reads your chat history.
Your saved entries are plain JSON files in a folder you own.

## Install

```
/plugin marketplace add nickheise/scout
/plugin install scout@scout
/scout:setup
```

`scout@scout` looks like a typo but isn't: the plugin is named `scout`, and
it ships from its own marketplace, also named `scout`.

Scout starts empty on purpose. `/scout:setup` asks where you want your pack
to live, then offers a few optional extras — syncing to a git remote, a scan
of your repos for tools you already reach for. Skipping all of them is a
perfectly good setup.

## How it works

**The manifest — always on.** Each active entry contributes one line to a
block Scout writes into your project's `CLAUDE.md` (or `AGENTS.md`). Your
agent carries it into every conversation. Nothing to trigger, nothing to
remember.

**Reports — at planning time.** When you finish a plan, Scout checks it
against your pack. Every candidate has to clear three questions:

1. Does this genuinely help *this* plan, or does it just share a keyword?
2. Is adopting it now actually cheaper than retrofitting it later?
3. Did you already pass on it in a similar situation?

One "no" and the candidate is dropped, silently. At most two reports ever
appear at once. Most planning moments produce nothing at all — that's the
design, not a failure. A tool that suggests something every time teaches you
to skim past it, and then the one suggestion that mattered dies with the
noise.

## Commands

| Command | What it does |
|---|---|
| `/scout:add` | Save something. Paste a URL and Scout fetches and analyzes it; describe a practice in plain words and Scout drafts it. You approve every draft before it's saved. |
| `/scout:start` | Set Scout up in a project. Short interview, scaffolds any files your practices call for, writes the manifest block. Safe to re-run — that's how a project picks up new entries. |
| `/scout:list` | Show what's in your pack. |
| `/scout:archive` | Retire an entry, optionally pointing at whatever replaced it. |
| `/scout:explain` | Show where an entry came from and why it's there. |
| `/scout:survey` | Check a finished project against your whole pack and report anything that should have come up but didn't. A backstop, not a routine. |
| `/scout:setup` | First-time setup. Run once. |

Plugin commands use a colon, not a space: `/scout:add`, not `/scout add`. If
you'd rather type the space form, Scout ships a tiny personal router that
forwards `/scout add` to the real command — `/scout:setup` offers to install
it, or see [`docs/router.md`](docs/router.md).

## Your pack

One JSON file per entry, in a folder you pick (`~/.scout/pack` by default).
Readable with `cat`, diffable with git.

**Updating Scout never touches your pack.** Scout ships code; your entries
are yours. Nothing Scout releases can rewrite, migrate, or delete a file in
your pack. If Scout vanished tomorrow you'd still have a folder of plain
JSON.

Point that folder at a git remote you own and you get sync across machines,
full history, and a free browse page on GitHub Pages — see
[`docs/pages.md`](docs/pages.md). Entirely optional.

Projects pick up new entries the next time you run `/scout:start` there —
not automatically, and never silently.

## Browse your pack

[`page/index.html`](page/README.md) is one self-contained page — no build, no
framework. Open it from disk and drag your pack folder onto it, or serve it
over HTTP and it reads the pack directly.

It's read-only, because a static page can't safely write to your files.
"Reactivate" on an archived entry copies a plain instruction to your
clipboard for you to paste to your agent, which makes the actual edit.

## Where it works

| | Manifest | Reports |
|---|---|---|
| Claude Code — terminal | yes | yes |
| Claude Code — desktop app, **Code** tab | yes | yes |
| Cursor, Codex, other agents | yes | no |

The manifest is plain text in `CLAUDE.md`/`AGENTS.md`, so any agent picks it
up. Reports need Claude Code's hook system, which other agents don't expose.

**On the desktop app**, install from the plugin manager UI instead of the
`/plugin` command — the Code tab shares its config with the CLI, so hooks and
skills work the same. (The desktop **Chat** tab is a different surface:
plugin skills work there, hooks don't.)

Not currently supported: WSL sessions. For cloud sessions, add Scout to
`enabledPlugins` in your repo's `.claude/settings.json` so it installs at
session start.

## Isn't this just…?

- **A memory plugin?** Those remember what you *said* — transcripts,
  compressed and recalled. Scout remembers what you meant to *use*. No
  database, no daemon.
- **A knowledge base?** Those are pull-based: they work right up until the
  step that always fails, which is remembering to go look. Scout pushes.
  You never search your pack, because the day you need to is the day it
  didn't work.
- **An awesome list?** That's someone else's taste, frozen. Scout starts
  empty and fills with yours. Two people's packs should look nothing alike.
- **Bookmarks?** Saving was never the part that failed. Resurfacing is.

## Good to know

There's an unrelated `scout` plugin (a web-search tool) by a different author
in the community marketplace. Plugin names are scoped to the marketplace they
came from, not global, so you can install both without conflict — they show
up as `scout@scout` and `scout@shidoyu-scout`.

## Docs

- [`docs/prd.md`](docs/prd.md) — what this is meant to be.
- [`docs/plan.md`](docs/plan.md) — build plan and technical rules.
- [`docs/router.md`](docs/router.md) — installing the `/scout add` router.
- [`docs/courier-prompt.md`](docs/courier-prompt.md) — the copyable prompt for
  mining your own chat history, which you run yourself. Scout never reads it.
- [`docs/pages.md`](docs/pages.md) — publishing your pack's browse page.
- [`docs/tier2-design.md`](docs/tier2-design.md) — optional self-hosted
  connector (design only).
- [`DECISIONS.md`](DECISIONS.md) — why things are the way they are.
- [`CHANGELOG.md`](CHANGELOG.md) — what shipped, when.

## Development

Plain Node ≥18. No build step, and no npm dependencies except in the bundled
MCP server, which uses `@modelcontextprotocol/sdk`.

```
npm ci
node --test test/*.test.mjs
node bin/scout-store.mjs validate --all --pack fixtures/seed-pack
```

## License

MIT — see [`LICENSE`](LICENSE).
