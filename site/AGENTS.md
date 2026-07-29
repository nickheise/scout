## Stack

Next.js (App Router, static rendering) + Tailwind CSS v4 + shadcn/ui. Package
manager is **pnpm**. Deployed to Vercel with Root Directory `site/`.

Migrated from Astro on branch `site/next-migration`. The migration is
complete; the previous Astro build (`_astro-legacy/`, once preserved verbatim
as the source of truth for existing page copy and section content) has been
deleted now that every section has been ported. See `docs/BUILD-CONTRACT.md`
for the design system that replaced it.

## Development

Start the dev server through the preview tools (`preview_start`), never via
Bash. Configurations live in the **repo-root** `.claude/launch.json` — note
that `site/.claude/launch.json` is not read by that tooling.

```
pnpm dev      # next dev, port 3000
pnpm build    # next build
pnpm lint     # tsc --noEmit
```

## Documentation

Full documentation: https://nextjs.org/docs

Consult these before working on related tasks:

- [App Router: pages and layouts](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Metadata and OG images](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- [Styling with Tailwind](https://nextjs.org/docs/app/guides/tailwind-css)
