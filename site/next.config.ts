import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Fully static export (no SSR, no dynamic APIs) — decision locked for the
 * Next.js migration. `images.unoptimized` is required alongside `output:
 * "export"` because Next's on-demand Image Optimization needs a server,
 * which a static export doesn't have.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Pin the project root so Turbopack doesn't try to infer it from the
  // repo-root pnpm-lock.yaml (that lockfile belongs to the unrelated
  // top-level plugin package, not this site — see site/docs for the
  // lockfile separation rationale).
  turbopack: {
    root: dirname,
  },
};

export default nextConfig;
