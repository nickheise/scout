# The browse page

One self-contained file — `index.html` — that renders a Scout pack in a
browser: Pack and Steps tabs, stale badges, the graveyard with supersession
chains, and courier-style reactivation (the page copies an instruction for
your agent; it never writes to the pack itself).

No build step, no dependencies, no framework (D-006). Everything is inline.

## Opening it locally

**Fastest: just open the file.**

```
open page/index.html        # macOS; or double-click it
```

Browsers block `fetch()` from `file://` pages, so the page can't read a
`pack/` folder by itself in this mode — instead it shows a drop target.
Drag your pack folder (default: `~/.scout/pack`) onto the page, or use
**Choose a folder** / **Choose files**. That's the whole flow; nothing to
install.

**Self-reading mode: serve it over HTTP.**

Put a `pack/` directory next to `index.html` (a copy of, or symlink to, your
pack), generate `pack/index.json` (below), then:

```
python3 -m http.server
```

…and open <http://localhost:8000/>. The page fetches `./pack/index.json`,
then each listed entry file. This is the same layout GitHub Pages serves for
Tier 1 users.

## Generating `pack/index.json`

Static hosts can't list directories, so the page needs a manifest of entry
filenames. Regenerate it whenever entries are added or removed — run this
from the directory that contains `pack/`:

```
node -e "const fs=require('fs');fs.writeFileSync('pack/index.json',JSON.stringify(fs.readdirSync('pack').filter(f=>f.endsWith('.json')&&f!=='index.json').sort(),null,2)+'\n')"
```

The format is deliberately dumb: a JSON array of `*.json` basenames. (An
object with a `files` or `entries` array is also accepted.)

## What the page tolerates

The reader is tolerant, matching `schema/entry.v1.json`'s contract: unknown
fields are ignored, malformed optional fields degrade to blank. A file is
skipped — with a visible per-file note, never silently — only when it isn't
JSON, isn't schema 1, or is missing `id`/`type`/`title`. Entries whose
`verified` date is more than 90 days old get a stale badge.

## Reactivation (why there's no "unarchive" button that works)

The page is read-only by design (D-011) — it can't write when Pages-hosted,
so it never writes anywhere. **Reactivate** on a graveyard card copies a
plain-language instruction (`reactivate <id> in my scout pack`) to your
clipboard; paste it to your agent, and the agent edits the entry file. You
carry the change across the boundary — the courier pattern.
