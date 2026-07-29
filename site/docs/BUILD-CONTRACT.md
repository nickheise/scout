# Scout site — build contract

**Read this instead of the landing-page-kit, the old design system, or
`_astro-legacy/`.** Everything you need to build a section is here. If
something is genuinely missing, add it here rather than deriving it locally.

Owner of this file: P1. Everything below is already implemented in
`src/app/globals.css` and `src/components/blocks/`.

---

## 0. Hard rules

1. **`--color-report` is reserved.** It is the one high-contrast signal
   meaning "Scout surfaced a report", used *exclusively* by the TerminalDemo's
   report card. Never an ambient accent, never on a button, link, badge,
   border, or icon. Review-enforced. Use `var(--tone-report)` at the call
   site so it adapts to the band; both it and `--color-report-on-dark` are
   covered by the same reservation.
2. **iA Writer Mono is terminal frames only** — `font-terminal`. Never body,
   never headings, never UI, never inline `<code>` in prose. `font-mono` is a
   *system* mono stack on purpose so incidental mono usage can never pull the
   webfont. It is the site's only webfont, and it is preloaded in
   `app/layout.tsx`.
3. **No dark mode.** There is no `.dark` token set, no toggle, no
   `prefers-color-scheme`. The near-black is a *section band* only
   (`<SectionShell tone="dark">`) — a compositional device for chapter
   rhythm.
4. **Every section is a named landmark.** `SectionShell` requires either
   `labelledBy` (point at the h2's `id` — preferred) or `label`. A
   `<section>` without an accessible name is not a landmark.
5. **Every icon-only control needs an `aria-label`.**
6. **Reduced motion and hover gating are required**, not polish. See §7.
7. **No indigo, no second accent family.** One accent: forest.
8. **Do not write per-component shadows.** Use the shared recipe (§2.4).
9. Fraunces, General Sans, `paper-*`, `ink-muted`, `trail-*`, `topo-wash`,
   `container-field`, `lexicon-chip`, `code-inline`, `#icon-*` and the whole
   D-019 expedition/field-guide visual language are **retired**. See §5.

---

## 1. The tone system (read this first)

`SectionShell` writes `data-tone` on the `<section>`. That re-points a set of
CSS variables for everything inside it. **Inside a section, always use the
`tone-*` colours — never the raw ones.** They resolve correctly on any band
with no prop threading.

| Utility | Role |
| --- | --- |
| `text-tone-fg` | headings, primary body |
| `text-tone-fg-muted` | secondary body, subheads |
| `text-tone-fg-subtle` | fine print |
| `text-tone-accent` | eyebrows, links, accent glyphs |
| `text-tone-accent-strong` | stronger accent emphasis |
| `bg-tone-surface` | card / panel fill |
| `bg-tone-surface-sunken` | nested panel, terminal titlebar, code block |
| `border-tone-border` | hairlines |
| `shadow-tone-card`, `shadow-tone-card-sm` | elevation (§2.4) |
| `var(--tone-report)` | the reserved report signal |

Tones: `default` (white) · `tinted` (gray-50) · `sunken` (gray-100) ·
`dark` (near-black band).

Raw tokens (`text-fg`, `bg-canvas`, `text-forest-500`, `border-hairline`) are
for things that live *outside* a band — `GlassNav` is the only current case.
Using a raw token inside a section is the single most likely bug: it will
look right on white and be invisible on the dark band.

**Known gap:** shadcn's `<Button variant="outline">` uses `bg-background`
(white) and is *not* tone-aware. Inside `tone="dark"`, use
`variant="secondary"` or add
`className="border-tone-border bg-transparent text-tone-fg hover:bg-white/10"`.

---

## 2. Token vocabulary

### 2.1 Colour

Base neutrals are Tailwind's default `gray-*` ramp — the kit's measured
neutrals (`rgb(249,250,251)`, `rgb(229,231,235)`, `rgb(156,163,175)`) are
literally `gray-50 / gray-200 / gray-400`. Use `gray-*` directly when you
need a step that has no semantic alias.

Semantic aliases:

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#fff` | default band |
| `canvas-tinted` | gray-50 | tinted band |
| `canvas-sunken` | gray-100 | deeper tint |
| `ink` | `rgb(10 10 10)` | dark band (never `#000`) |
| `ink-raised` | `rgb(24 24 27)` | surface on a dark band |
| `fg` | `rgb(10 10 10)` | headings/body on light |
| `fg-muted` | gray-600 | secondary body on light |
| `fg-subtle` | `rgb(94 103 117)` | fine print on light |
| `fg-on-dark` | `#fff` | text on the dark band |
| `fg-muted-on-dark` | gray-400 | secondary text on the dark band |
| `hairline` | gray-200 | borders on light |
| `hairline-on-dark` | `white/12%` | borders on dark |

**Forest accent** (the only accent):

| Token | Hex | Use |
| --- | --- | --- |
| `forest-200` | `#c0e2c8` | on-dark tint, border |
| `forest-300` | `#66aa79` | **on-dark accent text** |
| `forest-400` | `#3d784f` | large text / icons on light |
| `forest-500` | `#2e6540` | links, eyebrows, primary button fill |
| `forest-600` | `#184829` | hover/pressed, strong emphasis |
| `forest-700` | `#0d3119` | deepest emphasis |

`gray-400` is the kit's stated "muted text" but measures **2.54:1 on white**
and fails AA. It is decorative / on-dark only. Never use it for text on a
light band.

**Reserved:** `--color-report` `#d81327` (light bands) and
`--color-report-on-dark` `#f05653` (dark bands). Hue 25 vs. the accent's hue
152 — 127° apart, so it can never read as part of the accent palette. See §0.1.

### 2.2 Spacing

**Not redefined.** Tailwind v4's native scale (`--spacing: 0.25rem`) already
produces every value in the kit's 4px-based scale. The kit's Tailwind v3
theme file names spacing keys by *pixel value* — ignore that, it does not
translate. Use:

`p-1`=4 `p-2`=8 `p-3`=12 `p-4`=16 `p-5`=20 `p-6`=24 `p-7`=28 `p-8`=32
`p-10`=40 `p-11`=44 `p-12`=48 `p-16`=64 `p-20`=80 `p-24`=96 `p-32`=128
`p-40`=160 px.

Same scale for padding, margin and `gap` — there is no separate gap scale.
Default card padding 24 (`p-6`), default grid gap 24 (`gap-6`), section
rhythm handled by `SectionShell`'s `size` prop.

### 2.3 Radius

Rule of thumb: **large surface 24px, pill full, small control ≤ 10px.**

`rounded-card` 24 · `rounded-panel` 16 · `rounded-pill` full ·
`rounded-control` 10 · plus `rounded-xs` 4 / `-sm` 6 / `-md` 8 / `-lg` 12 /
`-xl` 16 / `-2xl` 20 / `-3xl` 24 / `-4xl` 32. shadcn's `--radius` base is
12px.

### 2.4 Elevation — ONE recipe

Hairline inset border + two ambient layers, defined once. **Never write a
per-component `shadow-[...]`.**

- `shadow-tone-card` — the default card (band-aware; this is what you want)
- `shadow-tone-card-sm` — chips, small controls (band-aware)
- `shadow-card-lg` — hover/raised state
- `shadow-glow` — accent-tinted 4th layer for a themed CTA surface; tint
  comes from `--glow-color`, which the tone system already points at the
  right accent step

### 2.5 Type

Family: `font-sans` is the system stack (SF Pro on Apple, Segoe on Windows) —
no webfont, no `font-heading`. `font-terminal` is iA Writer Mono, terminal
frames only. `font-mono` is a system mono stack.

Size scale is Tailwind's default, which already matches the kit's measured
12/14/16/18/20/24/48/96 scale *and* its 1.33–1.5 line-height ratios:
`text-xs` 12/16 · `text-sm` 14/20 · `text-base` 16/24 · `text-lg` 18/28 ·
`text-xl` 20/28 · `text-2xl` 24/32 · `text-3xl` 30/36 · `text-5xl` 48 ·
`text-8xl` 96.

Display sizes add the kit's tracking rule (tight only at large sizes):

| Utility | Size | Leading | Tracking |
| --- | --- | --- | --- |
| `text-display-sm` | 36 | 1.1 | -0.02em |
| `text-display` | 48 | 1.05 | -0.025em |
| `text-display-lg` | 64 | 1.03 | -0.03em |
| `text-display-xl` | 96 | 1 | -0.035em |

Weights: 400/500 do the work, 600 for headings, 700 rare (standout display
only). Letter-spacing is near-zero everywhere except display sizes.

Headline ladder in use: h1 `text-4xl sm:text-display-sm lg:text-display`,
h2 `text-3xl sm:text-display-sm` (via `SectionHeading`).

### 2.6 Layout

- `container-page` — the content column: `max-w-[1200px]`, gutters
  24 → 40 (≥640) → 64 (≥1024). `SectionShell` applies it; `Container` is the
  standalone version. Do not nest them.
- `--page-header` — 72 → 88 (≥640) → 112 (≥1024). Use
  `min-h-[calc(100vh-var(--page-header))]` for a viewport-filling hero.
- Breakpoints are stock Tailwind: `sm` 640 · `md` 768 · `lg` 1024 ·
  `xl` 1280 · `2xl` 1536. Nothing custom.

### 2.7 Glass & motion

- `backdrop-blur-glass` = 24px (the sticky-nav standard),
  `backdrop-blur-glass-sm` = 16px.
- Transitions default to 150ms; use 300–500ms only for larger reveals.
  Tailwind's stock `ease` curves only — no custom béziers.
- `animate-marquee-left` / `animate-marquee-right` (30s linear infinite —
  duplicate the content once and it loops seamlessly) and `animate-shimmer`
  (2s ease infinite).
- z-index: stock `z-10 … z-50`. `GlassNav` sits at `z-40`.

---

## 3. Primitive components

All in `src/components/blocks/`, all server components, all exported from
`@/components/blocks`.

### `SectionShell`

Full-bleed band + constrained column + named landmark + tone context.

```tsx
type SectionShellProps = ({ labelledBy: string } | { label: string }) & {
  id?: string;
  tone?: "default" | "tinted" | "sunken" | "dark";   // default "default"
  size?: "compact" | "default" | "tall";             // default "default"
  as?: "section" | "header" | "footer";              // default "section"
  className?: string;          // classes for the band
  containerClassName?: string; // classes for the content column
  children: ReactNode;
};
```

`size` maps to vertical rhythm: `compact` `py-12 sm:py-16` · `default`
`py-16 sm:py-24 lg:py-32` · `tall` `py-24 sm:py-32 lg:py-40`.

```tsx
<SectionShell id="how" tone="tinted" labelledBy="how-title">
  <SectionHeading id="how-title" eyebrow="How it works" title="…" />
</SectionShell>
```

Use `label` (not `labelledBy`) only for the text-free visual-demo band.

### `SectionHeading`

The eyebrow → h2 → subhead rhythm as one unit. `id` is required; pass the
same string to `SectionShell`'s `labelledBy`.

```tsx
<SectionHeading
  id="features-title"
  eyebrow="Features"          // 1–2 words, no verbs
  title="Recall without recall"
  subhead="One optional line."  // optional
  align="start"                 // | "center"
/>
```

### `Eyebrow`

The caps accent label on its own, when you are not using `SectionHeading`.
Colour is `text-tone-accent`, so it flips on a dark band.

```tsx
<Eyebrow>Install</Eyebrow>
```

### `Card`

The 24px surface with the shared shadow recipe.

```tsx
<Card elevation="default" padding="default" radius="card" interactive>
  …
</Card>
```

- `as`: `"div" | "article" | "li" | "figure"` (default `div`)
- `elevation`: `"flat" | "sm" | "default" | "glow"` (default `default`)
- `padding`: `"none" | "sm" | "default" | "lg"` → ``/`p-4`/`p-6`/`p-8`
- `radius`: `"card"` (24) | `"panel"` (16, for nested cards)
- `interactive`: adds `hover-lift` (gated to fine pointers)

### `Grid`

```tsx
<Grid cols={3} gap="default" as="ul">…</Grid>
```

`cols` 2 | 3 | 4 (always 1 column at base). For bento tiles, put
`sm:col-span-2` on the child — the grid does not manage tile sizes.

### `CtaRow` + `CTA_LG`

```tsx
<CtaRow align="start" fine="Free and open source.">
  <Button size="lg" className={CTA_LG} asChild>
    <a href="#install">Install Scout <ArrowRight aria-hidden="true" /></a>
  </Button>
</CtaRow>
```

`CTA_LG` (`"h-11 gap-2 rounded-lg px-5 text-base"`) is required on every
page CTA: shadcn's `size="lg"` is 36px, right for app density and too small
for a marketing page. It is a plain class string, not an `@utility`, so
`cn`'s tailwind-merge reliably overrides the variant's own sizing.

### `Container`

`container-page` on its own, for a band that must paint edge-to-edge while
keeping its text constrained. `SectionShell` already wraps children in it.

### `GlassNav`

Sticky frosted header, `z-40`, `backdrop-blur-glass`, wordmark left / links
right. Zero JS: below `sm` the text links drop and GitHub survives as an
icon-only control with an `aria-label`. Carries `data-tone="default"` so it
stays a light panel while scrolled over a dark band. Nav labels are single
words, no verbs.

---

## 4. Icons

**Lucide only** (`lucide-react`). The bespoke `#icon-*` SVG sprite is retired
and `_astro-legacy/src/components/IconSprite.astro` is reference only.

Convention, applied everywhere:

- `strokeWidth={1.75}` (matches the retired sprite's house style)
- Size on a 4px grid via Tailwind: `size-4` (16) · `size-[18px]` ·
  `size-5` (20) · `size-6` (24). Never set `width`/`height` props.
- Colour by `currentColor` — set it on the element with `text-tone-accent`
  etc., never a `color` prop.
- `aria-hidden="true"` when decorative (almost always). An icon-only
  interactive control gets `aria-label` on the control, not the icon.

Sprite → Lucide map:

| Old | Lucide | Notes |
| --- | --- | --- |
| `#icon-copy` | `Copy` | CopyBlock default state |
| `#icon-check` | `Check` | CopyBlock copied state |
| `#icon-waypoint` | `MapPin` | use `Terminal` for the terminal-frame titlebar specifically |
| `#icon-pack` | `Backpack` | |
| `#icon-compass` | `Compass` | the wordmark mark in `GlassNav` |
| `#icon-stamp` | `Stamp` | |
| `#icon-arrow` | `ArrowRight` | |
| `#icon-contour` | `Waves` | |
| `#icon-blaze` | `Bookmark` | |
| `#icon-tracks` | `Footprints` | |
| `#icon-cairn` | `Layers` | |

Lucide ships no GitHub brand mark by design; `GitBranch` next to a "GitHub"
text label is the established substitute (already used by `StarCount`).

---

## 5. Old → new token map

For P2 migrating the three islands and P3 porting the sections. **Inside a
section always prefer the `tone-*` form.**

| Old (Astro/D-019) | New |
| --- | --- |
| `bg-paper-50` | `bg-tone-surface` (card) / `bg-canvas` (page) |
| `bg-paper-100` | `bg-canvas` or `bg-tone-surface` |
| `bg-paper-200` | `bg-tone-surface-sunken` |
| `bg-paper-300` / `-400` | `bg-canvas-sunken`, or `gray-200`/`gray-300` |
| `text-ink` | `text-tone-fg` |
| `text-ink-muted` | `text-tone-fg-muted` |
| `text-ink-faint` | `text-tone-fg-subtle` |
| `border-ink/15`, `border-ink/10` | `border-tone-border` |
| `text-forest-600` (accent text) | `text-tone-accent` |
| `text-trail`, `text-trail-500`, `trail-*` | **deleted** — no second accent. Use `text-tone-accent`. |
| `--color-report` | `var(--tone-report)` (still reserved, still demo-only) |
| `--font-heading` (Fraunces) | **deleted** — headings use `font-sans` |
| `--font-body` (General Sans) | **deleted** — `font-sans` |
| `--font-mono` (iA Writer Mono) | `font-terminal` |
| `.container-field` | `container-page` (or just use `SectionShell`) |
| `.topo-wash*`, `--texture-topo` | **deleted** — no texture |
| `.lexicon-chip` | **deleted** — render the word as plain text |
| `.code-inline` | `rounded-sm bg-tone-surface-sunken px-1.5 py-0.5 font-mono text-[0.875em] text-tone-accent` |
| `section[data-beat]` padding | `SectionShell` `size` prop |
| `rounded-xl` on cards | `rounded-card` (24) via `<Card>` |
| ad-hoc `shadow-[0_1px_2px…]` | `shadow-tone-card` / `shadow-tone-card-sm` |
| `[@media(hover:hover)_and_(pointer:fine)]:hover:*` | plain `hover:*` (see §7) |
| `focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-ring` utility |
| `.dark` variant / `@custom-variant dark` | **deleted** — no dark mode |

shadcn variables (`--background`, `--foreground`, `--primary`, `--muted`,
`--border`, `--ring`, …) are wired to the new tokens in `globals.css`, so
`ui/button.tsx` and any future shadcn component work unchanged. `--primary`
is `forest-500` with white foreground (6.84:1).

---

## 6. Copy voice

Condensed from the kit's `SECTIONS.md`. **P4 owns the actual sentences** —
these are the mechanics everyone follows.

- **Eyebrow before every h2.** One or two words, all caps, accent colour, no
  verbs. Then: eyebrow → h2 → optional one-line subhead → content.
- **No superlatives, no hype words.** "revolutionary", "game-changing",
  "seamless", "powerful" never appear. Confidence comes from precision, not
  adjectives.
- **Short, literal sentences about mechanism.** State what it does, not how
  it feels.
- **Feature titles are verb-first and capability-stated**, not noun phrases.
- **Descriptions** are ~25–35 words, plain-spoken, feature-literal: platform
  + core mechanism + outcome in one sentence.
- **Nav labels are single words, no verbs.**
- The one moment of personality/humanity goes *late* on the page, not in the
  hero — trust-building is saved for a reader who is already sold.
- Visual-demo sections may have **no text at all**. Don't force copy into
  them.

---

## 7. Accessibility & interaction rules

- **Landmarks.** `<main>` wraps the page body (already in `page.tsx`). Every
  section is a named `<section>` via `SectionShell`. No content outside a
  landmark.
- **Named controls.** Every icon-only button/link has an `aria-label`.
- **Focus.** Use the `focus-ring` utility (2px forest outline, 2px offset;
  auto-swaps to `forest-300` on a dark band) on custom interactive elements.
  shadcn buttons already carry their own ring.
- **Hover gating.** Tailwind v4 compiles *every* `hover:` utility inside
  `@media (hover: hover)`, so plain `hover:` is already safe on touch —
  **use it**, don't hand-roll the media query. The explicit
  `(hover:hover) and (pointer:fine)` form is only needed for transform-based
  lift, which is what the `hover-lift` utility provides (it also gives touch
  devices a `(pointer:coarse)` press state instead).
- **Reduced motion.** `globals.css` neutralises animation and transition
  globally under `prefers-reduced-motion: reduce`, so components do not each
  have to opt out. Anything that changes *content* under motion (the
  TerminalDemo timeline) must still gate itself in JS.
- **Contrast.** Every text/background pair must clear 4.5:1 (3:1 for large
  or UI). The audited pairs are in §8; anything outside that table needs
  re-measuring.

---

## 8. Contrast audit (measured, WCAG 2.1)

Backgrounds: **W** = white · **T** = gray-50 tinted band · **S** = gray-100
sunken · **D** = `rgb(10,10,10)` dark band.

| Foreground | W | T | S | D |
| --- | --- | --- | --- | --- |
| `fg` `#0a0a0a` | 19.80 | 18.95 | 17.99 | — |
| `fg-muted` gray-600 | 7.56 | 7.23 | 6.87 | — |
| `fg-subtle` `#5e6775` | 5.72 | 5.47 | 5.20 | — |
| `fg-on-dark` white | — | — | — | 19.80 |
| `fg-muted-on-dark` gray-400 | 2.54 ✗ | 2.43 ✗ | 2.31 ✗ | 7.80 |
| `forest-300` `#66aa79` | 2.76 ✗ | 2.64 ✗ | 2.51 ✗ | **7.17** |
| `forest-400` `#3d784f` | 5.28 | 5.05 | 4.79 | 3.75 (large/UI) |
| `forest-500` `#2e6540` | 6.84 | 6.54 | 6.21 | 2.90 ✗ |
| `forest-600` `#184829` | 10.50 | 10.05 | 9.54 | ✗ |
| `forest-700` `#0d3119` | 14.27 | 13.66 | 12.97 | ✗ |
| `--color-report` `#d81327` | **5.21** | 4.99 | 4.74 | 3.80 ✗ |
| `--color-report-on-dark` `#f05653` | 3.40 ✗ | 3.25 ✗ | 3.09 ✗ | **5.82** |
| white on `forest-500` (primary button) | 6.84 | | | |
| white on `forest-600` | 10.50 | | | |

Values changed from the starting ramp:

- **`forest-400`: `oklch(56% 0.09 152)` → `oklch(52% 0.09 152)`.** At 56% it
  measured 4.46:1 on white and 4.44:1 on the dark band — it failed AA body on
  *both* sides of the light/dark crossover and was unusable for text. Its
  on-dark role moved to the new `forest-300` step.
- **`forest-300` and `forest-200` are new steps**, added because the ramp had
  nothing that cleared AA body on the dark band (the band is new — the old
  ramp was tuned against warm cream only).
- **`--color-report` is unchanged** at `oklch(56% 0.22 25)`; it passes on
  every light background. `--color-report-on-dark` `oklch(66% 0.19 25)` was
  added because the base measures 3.80:1 on `rgb(10,10,10)` — large/UI only,
  not enough for the report card's body-size mono text if a dark terminal
  frame is used. Same hue family (25), same reservation.
- `forest-500 / 600 / 700` are unchanged from the outgoing system.

---

## 9. Deliberate divergences from the kit

Flagged so nobody "fixes" them back.

1. **Mobile gutter is 24px, not 40px.** The kit's 40px was measured at the
   laptop viewport; 40px each side of a 390px screen leaves 310px, too little
   for the terminal frame's mono text. 40px returns at ≥640, 64px at ≥1024.
2. **Spacing, font-size and the 150ms transition default are not
   redefined.** The kit's Tailwind v3 theme file lists them as px-keyed
   `theme.extend` entries; in v4 every one of those values is already native.
   Redefining them would have created a second, conflicting scale.
3. **The hero is a two-column split at `lg`, not the kit's centered
   mockup-above-copy.** The kit's hero mockups are static screenshots; ours
   is a live terminal demo that must be above the fold without pushing the
   h1 (the LCP element) down.
4. **Kit indigo (`rgb(61,84,202)`) is not used at all.** Locked decision:
   single forest accent.
5. **`prefers-reduced-motion` is handled globally**, not per component. The
   kit's stylesheet has both branches; the `no-preference` branch is the
   default state here, so only `reduce` is written out.

---

## 10. Where things are

```
site/src/app/globals.css              tokens, tone system, utilities, base
site/src/app/layout.tsx               font preload  (metadata is P5's)
site/src/app/page.tsx                 P1 hero shell — P2 swaps the mockup
                                      placeholder, P3 adds sections below
site/src/components/blocks/           the primitives (+ index.ts barrel)
site/src/components/ui/button.tsx     shadcn, wired to the new tokens
site/src/components/islands/          P2's; unchanged by P1
site/public/fonts/ia-writer-mono/     the one webfont
site/docs/reference-shots-after/      p1-hero-{390,834,1440}.png
```
