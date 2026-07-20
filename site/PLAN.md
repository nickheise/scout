# Build Plan — Scout Marketing Site

**Status:** Draft v1 — 2026-07-18. Locked decisions in `DECISIONS.md`; blocked items listed in §7. Do not start build phases until §7 is resolved.

## 1. Architecture

- **Astro 7.x**, static output (`output: 'static'`), one page + future `/patch` route. Node 22+.
- **Tailwind v4** — brand tokens defined in CSS `@theme` (palette, type scale, spacing, the reserved report signal color). shadcn/ui only inside React islands.
- **Islands (the only JS on the page):**
  1. `TerminalDemo` — hand-built beat-script player (Beat 2), `client:visible`, reduced-motion → final frames.
  2. `CopyBlock` — install one-liner + tracks prompt (native `<button>`, `navigator.clipboard`, `aria-live` "Copied" confirmation). `client:idle`. Used twice; the two blocks are a deliberate pair per PRD Beat 4.5.
  3. `StarCount` — hand-rolled fetch of `api.github.com/repos/{org}/{repo}`, localStorage TTL cache (~6h), build-time static fallback baked into HTML. `client:idle`.
- **Site config constant** (`src/config.ts`): org, repo, domain, install command, star fallback — the D-004 name swap is one edit.
- **Fonts:** Astro Fonts API, self-hosted, subsetted variable fonts, metric-matched fallbacks (zero CLS). Pairing per D-012.
- **OG image:** Satori + resvg at build time (static endpoint, `prerender: true`). Install one-liner legible in the card per PRD §6.
- **Analytics:** GoatCounter script + two custom events (install-copy, tracks-copy). Footer disclosure line.
- **CSP:** Astro's stable CSP meta-tag support, on from day one.
- **Deploy:** Vercel from GitHub on push. Structured to lift into the Scout monorepo `/site` later (D-013).

## 2. Page structure (PRD §3, one file per beat)

`sections/Hero.astro` (Beat 1) · `sections/Demo.astro` (Beat 2) · `sections/HowItWorks.astro` (Beat 3) · `sections/Philosophy.astro` (Beat 4) · `sections/TracksPrompt.astro` (Beat 4.5) · `sections/Install.astro` + `sections/Footer.astro` (Beat 5). Hero headline variants behind a config switch (D-006).

## 3. Design system (field guide, PRD §5)

- Tokens: paper/cream base, forest + trail-marker accents, **one high-contrast signal color used exclusively for reports** — enforced by naming (`--color-report`) and review.
- Iconography: bespoke line-drawn SVG glyph set (pack, waypoint, contour, compass, stamp) on a Lucide-style stroke grid (24px, consistent stroke), shipped as one inline sprite, `stroke: currentColor`.
- Motion budget: the demo is the delight budget (PRD §4). Elsewhere: at most one stroke-draw moment; everything else static or instant-fade; global `prefers-reduced-motion` compliance.

## 4. Build execution — agent team

Orchestrated multi-agent build (explicitly requested). Main session (Fable) = **orchestrator**: sequencing, integration, conflict resolution, decision-log upkeep.

| Workstream | Agent | Model | Why |
|---|---|---|---|
| P0 Scaffold: Astro + Tailwind v4 + shadcn init, config constant, fonts, CI/Vercel, token system | build agent | Sonnet | Well-specified but multi-tool setup |
| P1 Design system: tokens, type, SVG sprite, terminal frame, CopyBlock + StarCount islands | build agent | Sonnet | Craft-sensitive components |
| P2a Beats 1, 3, 5 (v0 subset) — one agent per beat, parallel, shared tokens | 3 build agents | Haiku/Sonnet | Well-specified static sections from approved copy |
| P2b Beat 4 + 4.5 sections | build agent | Haiku/Sonnet | Static + reuses CopyBlock |
| P3 TerminalDemo island: beat-script engine + the approved demo script | build agent | Sonnet (high effort) | The long-pole craft item |
| P4 OG generation, GoatCounter events, meta/SEO, CSP | build agent | Haiku | Mechanical, well-documented patterns |
| Copy pass | orchestrator + copywriting skill | Fable | Voice is the brand; not delegated to light models |
| Review: code review, a11y, visual QA against PRD, token-discipline check (report color!) | reviewer agent | Opus | Independent capable reviewer, adversarial |
| Perf verification: Lighthouse ≥95, weight <1.5 MB, LCP on hero | reviewer agent | Sonnet + real tooling | Measured, not asserted |

Parallel build agents run in isolated worktrees where they touch shared files. **v0 gate:** after P2a review passes, the v0 subset is deployable. P2b/P3 continue toward v1.

## 5. Verification (before any "done")

1. Lighthouse ≥95 all four categories (mobile + desktop, real runs).
2. Total weight <1.5 MB including demo poster frames; zero JS shipped outside the three islands.
3. Reduced-motion pass, keyboard pass, screen-reader pass on copy buttons + demo.
4. OG card renders with legible install command (validator + real Slack/X unfurl check).
5. Star count: fallback renders with API blocked; no layout shift on hydrate.
6. The §8 barbecue test (5 people, mixed technical levels) — Nick runs; site ships v0 without it, v1 launch shouldn't.

## 6. Later phase (parked, per PRD)

`/patch` route: client-side decode + render, one generic OG image (per-code OG cards require an edge function — deferred decision, documented in D-008). No community-pack directory hosting, ever — link only if one emerges.

## 7. Open items (updated 2026-07-19 — build complete through v0 gate)

1. **Domain** (D-004/D-015, deferred by Nick): `scoutpack.dev` recommendation stands; swap is one config edit + OG re-render.
2. **Content owed:** tracks prompt (Scout core, D-010) · Nick's nine-entry example pack (footer gallery) · GoatCounter site code (Nick, one config field).
3. **Launch gates:** scout repo must be public (all links/commands 404 until then) · `/scout:setup` ships with Scout Phase 4 while Beat 4.5 references it.
4. **Pre-launch validation:** barbecue test (hero A vs C per positioning canvas; retire B) · OG unfurl check in real clients post-deploy · demo reconciliation against real CLI captures (requested from engineering).
5. **v1 copywriting polish pass:** demo narration in the "plain in, brand out" voice · router callout copy shipped, review in pass · launch post draft exists (`docs/launch-post.md`).
6. **Ship:** Vercel deploy + monorepo `/site` lift (coordinate with engineering; remind Nick — standing request).
