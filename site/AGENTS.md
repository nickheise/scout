## Stack

Next.js (App Router, static rendering) + Tailwind CSS v4 + shadcn/ui. Package
manager is **pnpm**. Deployed to Vercel with Root Directory `site/`.

Migrated from Astro on branch `site/next-migration`. The previous Astro build
is preserved verbatim under `_astro-legacy/` — it is the source of truth for
existing page copy and section content until the migration completes, and is
excluded from TypeScript and from Next's route detection. Do not import from
it, and do not run it.

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
