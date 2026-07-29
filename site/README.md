# Scout marketing site

The single-page marketing site for Scout. Next.js App Router, fully static
export, Tailwind CSS v4, deployed to Vercel with this directory as the
project's Root Directory.

Built against `landing-page-kit` (a captured design-system kit — see
`docs/BUILD-CONTRACT.md` for the token contract this site implements) and
migrated from an earlier Astro build; see `DECISIONS.md` D-021 for why, and
`docs/visual-language.md` for the current visual register.

## Structure

```
src/
├── app/            # layout, page, metadata, OG image, sitemap/robots
├── components/
│   ├── blocks/      # design-system primitives (SectionShell, Card, ...)
│   ├── islands/     # client components (TerminalDemo, CopyBlock, StarCount)
│   └── sections/    # one file per page beat
└── lib/
    ├── config.ts    # SITE — org/repo/domain/install-command, one edit point
    └── utils.ts
```

`SITE` in `src/lib/config.ts` is the single source of truth for anything
that varies with the real domain/org/repo name — never hardcode those
values elsewhere.

## Commands

Run from `site/`:

| Command | Action |
|---|---|
| `pnpm dev` | Start the dev server (`next dev`, port 3000) |
| `pnpm build` | Production static build to `out/` |
| `pnpm lint` | Type-check (`tsc --noEmit`) |

Start the dev server through this repo's preview tooling rather than
directly — see `AGENTS.md`/`CLAUDE.md` for the exact workflow, including
where the launch config actually lives (the repo root, not `site/`).

## Documentation

- `docs/BUILD-CONTRACT.md` — the design-system token contract: what to use,
  where, and why. Read this before touching tokens or primitives.
- `docs/visual-language.md` — the visual register this system implements.
- `docs/copy-deck.md` — the copy voice doctrine and locked strings.
- `DECISIONS.md` / `CHANGELOG.md` / `PLAN.md` — decision log, changelog, and
  open items. `PLAN.md` §7 tracks what's still outstanding before this ships
  to production.
