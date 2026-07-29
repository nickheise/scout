/**
 * opengraph-image — the social share card, generated at build time.
 *
 * Uses Next's file-based Metadata API (`next/og`'s `ImageResponse`, which is
 * Satori + resvg under the hood — the same rendering pipeline the legacy
 * Astro endpoint used by hand). Because this route has no dynamic params and
 * reads no request-time data, Next statically optimizes it: the PNG is
 * rendered once at build time and lands in `out/opengraph-image.png`, which
 * is required for `output: "export"` (there is no server to render it on
 * demand).
 *
 * Design: the retired card was a warm paper/cream field-guide register
 * (Fraunces on `paper-100`, trail-orange accent). That register is gone
 * site-wide (see docs/BUILD-CONTRACT.md §0.9) — this card now matches the
 * live hero instead: the `tone="tinted"` gray-50 band the hero itself sits
 * on, near-black text, the single forest accent, and the install command
 * rendered inside a panel styled like the real `CopyBlock` component (white
 * surface, hairline border, the shared card shadow) rather than the old
 * chevron-prompt treatment. Someone seeing the card then the page should
 * read them as the same design.
 *
 * Fonts: Satori needs static (non-variable) TTF/OTF data loaded via `fs` —
 * it cannot use the system sans stack the live site relies on (`font-sans`
 * has no webfont at all). Inter Regular + SemiBold (static builds from the
 * official rsms/inter v4.1 release, OFL) stand in for the system stack here;
 * iA Writer Mono (already vendored for the live terminal frames) renders the
 * install command. Neither font reaches the client bundle — this file only
 * runs at build time.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE } from "@/lib/config";

export const alt = `${SITE.siteTitle} — ${SITE.installCommand.replace(/\n/g, " ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Required for `output: "export"`: without this Next treats the route as
// potentially dynamic and refuses to collect its page data at build time.
export const dynamic = "force-static";

// Hero headline (variant A) — verbatim from the live h1 in app/page.tsx.
// NOTE: this is a literal duplicate, not derived from a shared source (the
// legacy og.png.ts endpoint did the same, with the same risk) — it drifts
// silently if the hero copy changes without a matching edit here. Confirmed
// live during this build: the hero headline changed mid-session (see P5
// handoff report) and this string had to be resynced.
const HEADLINE =
  "You keep finding what works. Then every new project starts from scratch.";
const FINE_PRINT = "Free and open source. No server, no account, no API key.";

// sRGB hex equivalents of the live oklch tokens (Satori doesn't parse
// oklch()) — see docs/BUILD-CONTRACT.md §2.1 / §8 for the source values.
const COLORS = {
  canvasTinted: "#f9fafb", // gray-50 — the hero's own band tone
  surface: "#ffffff", // tone-surface (card white)
  hairline: "#e5e7eb", // gray-200
  fg: "#0a0a0a",
  fgMuted: "#4b5563", // gray-600
  forest500: "#2e6540",
} as const;

function compassMark(size: number, color: string) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
    </svg>
  );
}

export default async function Image() {
  const fontDir = path.join(process.cwd(), "src/assets/og-fonts");
  const [interRegular, interSemiBold, mono] = await Promise.all([
    readFile(path.join(fontDir, "Inter-Regular.ttf")),
    readFile(path.join(fontDir, "Inter-SemiBold.ttf")),
    readFile(path.join(fontDir, "iAWriterMonoS-Regular.ttf")),
  ]);

  const commandLines = SITE.installCommand.split("\n");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.canvasTinted,
          padding: "64px 72px",
          fontFamily: "Inter",
        }}
      >
        {/* Wordmark — mirrors GlassNav: Compass mark + "Scout", forest +
            near-black, semibold, tight tracking. */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {compassMark(34, COLORS.forest500)}
          <div
            style={{
              fontSize: "30px",
              fontWeight: 600,
              color: COLORS.fg,
              letterSpacing: "-0.01em",
            }}
          >
            Scout
          </div>
        </div>

        {/* Headline — the live hero h1, verbatim. */}
        <div
          style={{
            display: "flex",
            fontSize: "58px",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: COLORS.fg,
            maxWidth: "980px",
          }}
        >
          {HEADLINE}
        </div>

        {/* Install command + trust line. The panel matches CopyBlock's own
            styling (white surface, hairline border, card-sm shadow) rather
            than inventing a new treatment. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignSelf: "flex-start",
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: "16px",
              padding: "28px 36px",
              boxShadow:
                "0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)",
            }}
          >
            {commandLines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "iA Writer Mono",
                  fontSize: "34px",
                  color: COLORS.fg,
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 400,
              color: COLORS.fgMuted,
            }}
          >
            {FINE_PRINT}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
        { name: "iA Writer Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
