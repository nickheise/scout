import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/**
 * robots.txt — single-page site, everything allowed. Sitemap URL derives
 * from `SITE.domain` (the D-004 domain swap is a one-file edit).
 *
 * `dynamic = "force-static"` is required for `output: "export"` — see
 * opengraph-image.tsx for the same requirement and why.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `https://${SITE.domain}/sitemap.xml`,
  };
}
