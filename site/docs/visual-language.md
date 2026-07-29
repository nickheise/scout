# Visual Language Reference — Scout

**Status:** Rewritten 2026-07-29 (D-021) after the Astro → Next.js migration
and the adoption of `landing-page-kit`, a design system distilled from a
Playwright capture of three reference product pages. This supersedes the
2026-07-20 version of this document in full — that version described the
"expedition field guide" register (paper/cream, topo texture, a bespoke
icon sprite with historical glyph mappings), which D-021 retired. Voice/copy
register is unaffected and still lives in `copy-deck.md` ("plain in, brand
out" doctrine); this doc covers what things *look* like.

**Division of labor with `BUILD-CONTRACT.md`:** that file is the technical
contract — exact token names, component APIs, the old→new migration map.
This file is the register — what the system is *for* and why, at a level
a copywriter or a reviewer needs without reading component source.

---

## 1. Register

Plain, modern, neutral — a kit designed to carry any product's brand
expression on a shared structural system (spacing, radius, shadow recipe,
section anatomy, motion technique), with color as the one theming axis.
Scout's expression of it: forest green as the single accent on a
white/grey/near-black ground. Confident and understated, not warm and
analog — the field-guide identity (paper, ink, topo lines, a bespoke
trail-sign icon language) was a deliberate choice in its time (D-019) and
is not what this site is now; don't reach for it by habit.

## 2. Palette semantics

- **Neutral base** — white, `gray-50`/`gray-100` for tinted and sunken
  section bands, `rgb(10,10,10)`-class near-black (never pure `#000`) for
  the one dark chapter (Philosophy). No cream, no warm ink.
- **Forest** — the single accent. Headings emphasis, primary actions,
  links, the wordmark glyph. The ramp is tuned for contrast against this
  palette specifically — `forest-400` was darkened from the pre-migration
  value after it failed AA on both the white and near-black backgrounds;
  `forest-200`/`forest-300` exist only for use on the dark band. There is
  no second accent color (the old ochre "trail-marker" is retired).
- **`--color-report` (reserved)** — exclusively the demo's surfaced-report
  moment, nowhere else, ever. One high-contrast signal color teaches "this
  = Scout found something." Token discipline is review-enforced and
  predates this rewrite — it is the one piece of the old system that
  carried forward unchanged in purpose. It has a same-hue-family
  companion, `--color-report-on-dark`, for use inside the dark band, where
  the base value alone fails AA for body-sized text.

## 3. Type (D-021, supersedes D-012)

System font stack for everything — `ui-sans-serif, system-ui, sans-serif`
— zero webfonts for body, UI, or headings. One deliberate exception: **iA
Writer Mono**, scoped to terminal frames only. It survives specifically
*because* it isn't SF Mono or JetBrains — the demo is the page's most
visible element (hoisted into the hero), and a generic system monospace
there would read as default-dev-tool in exactly the way this typeface
choice was originally meant to avoid. It's preloaded, since the demo is
now LCP-adjacent. Fraunces and General Sans are deleted — do not
reintroduce a display or body webfont without a new decision entry.

## 4. Iconography

Lucide (`lucide-react`), used directly as components — no more bespoke
SVG sprite, no shared stroke-grid file to maintain. Follow Lucide's own
conventions (its default stroke width, `currentColor`) rather than
re-deriving a custom one. Every icon-only control needs an `aria-label`;
every decorative icon needs `aria-hidden="true"` — this rule is unchanged
from before and is enforced in `BUILD-CONTRACT.md`.

The old sprite's glyph↔concept mapping table (blaze = reports, tracks =
revealed preferences, waypoint = markers, pack = the category, stamp =
philosophy tenets) is **retired along with the sprite**, not preserved as
guidance — Lucide's library doesn't carry equivalents for most of it, and
re-deriving a parallel mapping onto a different icon set would be design
debt, not continuity. If a future decision wants that kind of deliberate
glyph vocabulary back, it should be a fresh exercise against Lucide's
actual catalog, not a retrofit of the old table.

The old avoid-list items were about the *field-guide* metaphor
specifically (fleur-de-lis, tactical/camo, merit-badge framing) and don't
transfer as written — the current system has no metaphor-driven icon
family to police in the same way. The one item worth restating because
it's about the *product*, not the old aesthetic: **no
binoculars/spyglass/magnifying-glass iconography anywhere**, ever — it
says "watching/searching," which fights zero-recall (nobody searches) and
the privacy story (Scout never looks).

## 5. Reference sites

- **Bun / uv (astral.sh)** — the install-command-as-CTA pattern. More
  load-bearing now than before: the hero's primary CTA is literally the
  install one-liner in a copy-to-clipboard block, not a generic button.
- **Linear** — motion-restraint discipline; screenshots over video.
- **The three `landing-page-kit` reference captures** — composition,
  density, and section rhythm (bento grids, alternating rows, the
  eyebrow→h2 pattern). Reference for structure, never for brand
  expression — see `BUILD-CONTRACT.md`'s divergence notes for what was
  deliberately not reproduced (their indigo accent, their dark-mode
  toggle, their mockup-centered hero anatomy).

## 6. Motion rules (unchanged in substance)

- The demo is still the page's entire animation budget — everything else
  is static or an instant fade. It moved into the hero, it did not grow a
  peer.
- Animate `transform`/`opacity` only; 150–300 ms, `ease-out`;
  interruptible.
- `prefers-reduced-motion` is honored everywhere. Note for anyone editing
  the demo island: in the outgoing Astro build this was enforced by never
  *hydrating* the demo's JS for reduced-motion visitors (a separate static
  fallback rendered instead); Next has no equivalent split, so the island
  now detects the preference itself at runtime and renders the script's
  finished state directly. Don't assume hydration-time gating still does
  this work — it doesn't, on this stack.
- Tailwind v4 compiles every `hover:` utility inside `@media (hover: hover)`
  automatically — don't hand-roll a `(hover: hover) and (pointer: fine)`
  guard the way the pre-migration components did. Only transform-based
  hover lift needs an explicit guard (the `hover-lift` utility in
  `globals.css`), because a bare `:hover` transform can leave a visibly
  "stuck" lifted state on a touch tap.
- Restraint elsewhere is what makes the one animated thing read as
  intentional.
