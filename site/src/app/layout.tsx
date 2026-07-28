import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { SITE } from "@/lib/config";

/**
 * Metadata — ports everything the legacy `_astro-legacy/src/layouts/Layout.astro`
 * head carried (title, description, canonical, OG/Twitter, theme-color,
 * color-scheme, favicon), sourced entirely from `SITE` so the D-004 domain/
 * name swap stays a one-file edit.
 *
 * OG/Twitter *images* are deliberately NOT set here — `src/app/opengraph-image.tsx`
 * is the file-based convention Next uses to generate `og:image` /
 * `twitter:image` (+ width/height/alt) automatically, and it already covers
 * the twitter fallback (verified in the built output). Setting `images` here
 * too would fight that, not add to it.
 *
 * `theme-color` is `#ffffff` — the new palette's default page background
 * (`--color-canvas`), not the retired cream `#f6f1e6`.
 */
const canonicalUrl = `https://${SITE.domain}/`;

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE.domain}`),
  title: SITE.siteTitle,
  description: SITE.siteDescription,
  alternates: {
    canonical: canonicalUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
  openGraph: {
    type: "website",
    url: canonicalUrl,
    title: SITE.siteTitle,
    description: SITE.siteDescription,
    siteName: "Scout",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// `theme-color` / `color-scheme` moved out of `metadata` per Next's Viewport
// API split. `#ffffff` is the new palette's default page background
// (`--color-canvas`), not the retired cream `#f6f1e6`.
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* iA Writer Mono is the site's only webfont and is scoped to
         * terminal frames — which now sit above the fold in the hero, making
         * it LCP-critical. Preloaded so it is not discovered late via CSS.
         * See globals.css for the metric-matched Courier New fallback. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/ia-writer-mono/iAWriterMonoV-latin.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* GoatCounter — injected ONLY when SITE.goatcounter is set (gated
         * exactly like the legacy Layout.astro script and the footer's
         * analytics-disclosure line, which reads the same flag). It is
         * currently null, so this renders nothing and no script ships.
         * When enabled, the CSP in vercel.json must additionally allow
         * `https://gc.zgo.at` in script-src and `https://*.goatcounter.com`
         * in img-src (the beacon itself is an <img> GET, not fetch/XHR) —
         * see the vercel.json header for the current, analytics-off CSP. */}
        {SITE.goatcounter && (
          <Script
            src="https://gc.zgo.at/count.js"
            strategy="afterInteractive"
            async
            data-goatcounter={`https://${SITE.goatcounter}.goatcounter.com/count`}
          />
        )}
        {children}
      </body>
    </html>
  );
}
