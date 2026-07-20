# Publishing a pack with the browse page (GitHub Pages)

This is the Tier 1 payoff (PRD §5.0): once your pack folder is a git repo
pointed at a remote you own, hosting it on GitHub Pages gets you a free,
read-only browse page at a stable URL — Pack and Steps tabs, the graveyard
with supersession chains, stale-age badges, reactivate-copy buttons (D-011)
— with no server, no build step, and no framework. This doc covers the repo
layout, the two ways to wire up Pages, and a walkthrough using Scout's own
seed pack as the worked example.

Prerequisite: your pack is already a git repo with a remote (Tier 1, PRD
§5.0). If it's still just a local folder, point `SCOUT_PACK` at a fresh git
repo and push it before starting here — this doc doesn't cover that step.

## 1. Repo layout

```
my-scout-pack/                  ← the git repo = Tier 1 remote
├── page/
│   ├── index.html              ← the browse page, copied in verbatim
│   └── pack/
│       ├── dialkit.json        ← one file per entry, hand-editable JSON
│       ├── shadcn-ui.json      ← this is the pack's actual source of truth
│       ├── changelog.json      ← (same one-file-per-id layout as any pack dir)
│       ├── ...
│       └── index.json          ← GENERATED — never hand-edit, see §2
├── .github/
│   └── workflows/
│       └── pages.yml           ← only if you take the Actions path, §3
└── README.md                   ← optional, e.g. "Nick's Scout pack"
```

Note that `pack/` lives *inside* `page/`, not beside it at the repo root —
`page/index.html` fetches its data relatively from wherever it's served, so
whatever directory the page's URL resolves to must have `pack/` right next
to it (this is also how `page/README.md` describes opening the page
locally: "put a `pack/` directory next to `index.html`").

Two things to notice:

- **`pack/*.json` is unchanged from your local pack dir.** Point
  `SCOUT_PACK` at `my-scout-pack/page/pack` and every Scout verb
  (`/scout:add`, `/scout:archive`, …) works against this repo exactly as it
  would against `~/.scout/pack` — publishing changes nothing about how you
  use Scout day to day (three-plane model, PRD §8: the pack plane is
  untouched by anything to do with hosting it).
- **`pack/index.json` is a build artifact, not an entry.** GitHub Pages is a
  static file server — it can't return a directory listing, so the browse
  page has no way to discover *which* filenames exist under `pack/` from a
  bare `fetch()`. `index.json` solves that with one file: a JSON array of
  entry **filenames** (basenames, not the entries' contents), regenerated
  from `pack/*.json` each time something changes. It's exactly the same
  relationship the manifest has to the pack itself (PRD §5.3) — a compiled
  convenience artifact, disposable and regeneratable, never the record.
  Delete it and regenerate it any time; never edit it by hand.

`page/index.html` is the same self-contained file whether you're opening it
from `file://`, serving it with `python -m http.server`, or publishing it
here (plan.md §4 task 5.1) — no per-deployment configuration. It fetches
`./pack/index.json` when it detects it's being served rather than opened
from disk.

## 2. Regenerating `pack/index.json`

There's no separate generator script — `page/index.html` and
`page/README.md` both ship the same dependency-free Node one-liner. Run it
from the directory that contains `pack/` (i.e. from inside `page/`, since
`pack/` lives under it — §1):

```
node -e "const fs=require('fs');fs.writeFileSync('pack/index.json',JSON.stringify(fs.readdirSync('pack').filter(f=>f.endsWith('.json')&&f!=='index.json').sort(),null,2)+'\n')"
```

It reads every `*.json` file in `pack/` except `index.json` itself and
writes their basenames out as one sorted array, `pack/index.json`. It
performs no analysis and no validation beyond what `scout-store.mjs`
already guarantees on write — it's concatenation, not compilation.

Run it (or let CI run it, §3) any time `pack/` changes: after `/scout:add`,
`/scout:archive`, or a reactivate edit. Forgetting to regenerate isn't
dangerous — the published page just shows a stale snapshot until the next
regen — but it does mean "I archived X" and "the published page stops
showing X" aren't the same moment unless something automates the gap.
That's exactly what the Actions path below buys you.

## 3. Actions-or-branch: two ways to wire up Pages

### Option A — GitHub Actions (recommended: zero-touch)

A workflow regenerates `pack/index.json` and redeploys on every push to
your default branch, so publishing is just "push to your pack repo" —
nothing to remember.

1. In the repo, add `.github/workflows/pages.yml`:

   ```yaml
   name: Publish Scout pack
   on:
     push:
       branches: [main]
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment: github-pages
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '20' }
         - name: Regenerate pack/index.json
           run: node -e "const fs=require('fs');fs.writeFileSync('page/pack/index.json',JSON.stringify(fs.readdirSync('page/pack').filter(f=>f.endsWith('.json')&&f!=='index.json').sort(),null,2)+'\n')"
         - uses: actions/upload-pages-artifact@v3
           with: { path: '.' }
         - uses: actions/deploy-pages@v4
   ```

2. Repo Settings → Pages → **Source: GitHub Actions** (not "Deploy from a
   branch").
3. Push. The Actions tab shows the run; on success, Settings → Pages shows
   your live URL: `https://<you>.github.io/<repo>/page/`.

Every subsequent push (a new `/scout:add` commit, an archive, a reactivate
edit) redeploys automatically — no local regen step, no "did I remember to
run the generator" question.

### Option B — Deploy from a branch (simpler, manual regen)

No YAML, no Actions minutes, but you own the regenerate-before-push step.

1. Run the §2 one-liner locally (from inside `page/`) and commit the
   result whenever `pack/` changes.
2. Repo Settings → Pages → **Source: Deploy from a branch** → branch
   `main`, folder `/ (root)`.
3. Push. The same URL shape applies: `https://<you>.github.io/<repo>/page/`.

Choose A if you'd rather never think about it again; choose B if you'd
rather not grant Actions any role in a repo that's just files. Both produce
byte-identical output — the only difference is who runs the generator and
when.

## 4. Sample deploy, walked through on the seed pack

Using this repo's own `fixtures/seed-pack/` (the nine seed entries, PRD §6)
as the worked example — five pack entries (shadcn/ui, Paper Shaders,
DialKit, emilkowalski/skills, mattpocock/skills) and four steps (changelog,
decision log, milestone screenshots, agent-team builds):

```
mkdir my-scout-pack && cd my-scout-pack
git init
mkdir -p page/pack
cp <scout-repo>/fixtures/seed-pack/*.json page/pack/
cp <scout-repo>/page/index.html page/
cd page
node -e "const fs=require('fs');fs.writeFileSync('pack/index.json',JSON.stringify(fs.readdirSync('pack').filter(f=>f.endsWith('.json')&&f!=='index.json').sort(),null,2)+'\n')"   # writes pack/index.json
cd ..
git add page
git commit -m "Publish pack"
git remote add origin git@github.com:<you>/my-scout-pack.git
git push -u origin main
```

Then wire up Pages (Option A or B above). The result at
`https://<you>.github.io/my-scout-pack/page/`:

- **Pack tab:** five cards — DialKit, Paper Shaders, shadcn/ui, and the two
  skills-repo meta-entries — each showing its `ambient_line`, `summary`,
  `stack`, and install string.
- **Steps tab:** four cards — changelog, decision log, milestone
  screenshots, agent-team builds — each showing its `instruction` and
  `phase`.
- **Graveyard:** empty, because nothing in the seed pack is archived yet.
  Archive an entry locally (with or without `superseded_by`), regenerate,
  and push — the graveyard tab picks it up with its supersession chain and
  a reactivate-copy button that yields the courier-pattern instruction
  ("reactivate `<id>` in my scout pack," D-011) rather than writing
  anything itself, since a Pages-hosted page has no write path back to your
  repo.

## 5. Before you publish: say it plainly

**A published pack repo is public — the graveyard included.** Turning on
Pages (or just making the repo public, which Pages requires on a free
GitHub plan) means anyone with the URL can read every entry you've ever
archived, why (`notes`), what replaced it (`superseded_by`), and how many
times a report for it got ignored (`dismissals`). PRD §5.7/§5.8 call this a
feature — the archive is taste data, and browsing someone's supersession
chain reveals more than their shipped portfolio does — but "the archive is
taste data" is a design thesis, not your consent. Before you push:

- Skim your `notes` fields for anything you wrote for your own eyes only —
  candid asides about a client's stack, a coworker's opinion, a company
  name — and edit or clear them first. Nothing here is a secrets scanner;
  it's you rereading your own file.
- If any of that doesn't belong in public, either keep this repo private
  (Pages requires public on free GitHub plans, so that means skipping Pages
  entirely and staying at plain Tier 1 sync) or keep a separate, sanitized
  pack for publishing.
- This applies at every future push, not just the first one — the workflow
  in §3 has no review gate, by design (that's what makes it zero-touch).
  If you want a checkpoint before things go live, use Option B and treat
  "run the generator" as your moment to also skim the diff.

None of this is reversible after the fact in the way you might expect: git
history keeps old commits reachable even if you edit and re-push, so a
truly private note that was ever pushed needs history rewritten
(`git filter-repo` or similar) or the repo recreated, not just a follow-up
edit.

## 6. What this doesn't give you

The published page is read-only by construction (D-006, D-011) — no add,
archive, or reactivate happens on the page itself; every write still goes
through your agent against your local pack, followed by a push. If you want
write access to your pack from **another** machine or account without a
local clone — claude.ai connectors, a phone, a work account that can't see
your personal dotfiles — that's Tier 2, a different and optional piece:
see `docs/tier2-design.md`.
