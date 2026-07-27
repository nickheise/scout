import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Placeholder only — P5 owns metadata/OG/CSP.
export const metadata: Metadata = {
  title: "Scout",
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
      <body>{children}</body>
    </html>
  );
}
