import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/**
 * sitemap.xml — single-page site, so a single entry. URL derives from
 * `SITE.domain` (the D-004 domain swap is a one-file edit).
 *
 * `dynamic = "force-static"` is required for `output: "export"` — without
 * it Next treats the generated route as potentially dynamic and refuses to
 * collect its page data at build time (same requirement as
 * `opengraph-image.tsx`).
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `https://${SITE.domain}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
