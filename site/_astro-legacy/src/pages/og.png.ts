/**
 * og.png — the social share card, generated at build time (PLAN.md §1).
 *
 * Satori (JSX-free element objects) renders an SVG, resvg rasterizes it to a
 * 1200x630 PNG. Runs only at build (`prerender = true`, static output), so
 * neither satori nor the TTFs in src/assets/og-fonts/ ever reach the client
 * bundle.
 *
 * Design per brand (PRD §5/§6): paper/cream field-guide card, NOT a dark
 * terminal. Ink headline (hero variant A, verbatim from docs/copy-deck.md),
 * and the install command rendered large and legible in the mono style —
 * PRD §6: screenshots of this card get shared as install instructions.
 *
 * Fonts: Satori needs static TTF/OTF (no woff2, no variable fonts), so this
 * endpoint uses build-only static builds kept in src/assets/og-fonts/:
 *   - Fraunces-SemiBold.ttf — instanced from Google Fonts' variable TTF via
 *     fontTools.varLib.instancer (wght=600 opsz=72 SOFT=0 WONK=0). OFL.
 *   - iAWriterMonoS-Regular.ttf — static build from iaolo/iA-Fonts. OFL-ish
 *     iA license (same family as public/fonts/ia-writer-mono/LICENSE.md).
 * Read via fs from the project root (build runs with cwd = project root).
 *
 * Colors are the src/styles/global.css oklch tokens converted to sRGB hex
 * (satori doesn't parse oklch()):
 *   paper-100 #f9f6ee · paper-50 #fdfbf7 · ink #261a12 · ink-muted #584a41
 *   forest-600 #184829 · trail-500 #d67523
 */
import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { SITE } from "../config";

export const prerender = true;

// Hero headline variant A — verbatim from docs/copy-deck.md Beat 1 (the
// same string Hero.astro renders as the default headline).
const HEADLINE = "You keep finding great libraries. Then you forget they exist.";
const UNDER_LINE = "Free and open source. No server, no account, no API key.";

const COLORS = {
  paper100: "#f9f6ee",
  paper50: "#fdfbf7",
  ink: "#261a12",
  inkMuted: "#584a41",
  forest600: "#184829",
  trail500: "#d67523",
} as const;

/** Terse element helper for satori's React-element object format. */
function h(
  type: string,
  props: Record<string, unknown> | null,
  ...children: unknown[]
) {
  return {
    type,
    props: { ...(props ?? {}), children: children.length === 1 ? children[0] : children },
  };
}

/** The waypoint mark (icon sprite's trail-blaze-on-a-stake), scaled up. */
function waypointMark(size: number, color: string) {
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      "stroke-width": 1.75,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    h("path", { d: "M12 21V11" }),
    h("path", { d: "M12 3.5 16 8l-4 4-4-4Z" }),
  );
}

/** Prompt chevron (neither OG font carries U+276F, so it's drawn). */
function promptChevron(size: number, color: string) {
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      "stroke-width": 2.5,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    h("path", { d: "M8 4.5 15.5 12 8 19.5" }),
  );
}

export const GET: APIRoute = async () => {
  const fontDir = path.join(process.cwd(), "src/assets/og-fonts");
  const [fraunces, mono] = await Promise.all([
    readFile(path.join(fontDir, "Fraunces-SemiBold.ttf")),
    readFile(path.join(fontDir, "iAWriterMonoS-Regular.ttf")),
  ]);

  const card = h(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: COLORS.paper100,
        padding: "64px 72px",
        borderBottom: `14px solid ${COLORS.forest600}`,
      },
    },
    // Top: waypoint mark + wordmark
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "14px" } },
      waypointMark(44, COLORS.trail500),
      h(
        "div",
        {
          style: {
            fontFamily: "Fraunces",
            fontSize: "40px",
            color: COLORS.forest600,
          },
        },
        "Scout",
      ),
    ),
    // Middle: the headline (hero variant A), ink on paper
    h(
      "div",
      {
        style: {
          fontFamily: "Fraunces",
          fontSize: "64px",
          lineHeight: 1.15,
          color: COLORS.ink,
          letterSpacing: "-0.02em",
          maxWidth: "1000px",
        },
      },
      HEADLINE,
    ),
    // Bottom: the install command, large and legible (PRD §6 — screenshots
    // of this card get shared as install instructions), + the trust line.
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "20px" } },
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "20px",
            backgroundColor: COLORS.paper50,
            border: `2px solid rgba(38, 26, 18, 0.15)`,
            borderRadius: "16px",
            padding: "28px 36px",
            alignSelf: "flex-start",
          },
        },
        promptChevron(34, COLORS.forest600),
        h(
          "div",
          {
            style: {
              fontFamily: "iA Writer Mono",
              fontSize: "38px",
              color: COLORS.ink,
            },
          },
          SITE.installCommand,
        ),
      ),
      h(
        "div",
        {
          style: {
            fontFamily: "iA Writer Mono",
            fontSize: "22px",
            color: COLORS.inkMuted,
          },
        },
        UNDER_LINE,
      ),
    ),
  );

  const svg = await satori(card as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
      { name: "iA Writer Mono", data: mono, weight: 400, style: "normal" },
    ],
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
