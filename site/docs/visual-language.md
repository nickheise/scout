# Visual Language Reference — Scout

**Status:** Adopted 2026-07-20 (D-019). Merged from the July 2026 design research (stack + demo-craft agent reports) and the iconography survey. This is the reference for anyone drawing, extending, or reviewing Scout's visual system — site, OG assets, future patches, README art. Voice/copy register lives in `copy-deck.md` ("plain in, brand out" doctrine); this doc covers what things *look* like.

---

## 1. Register

Expedition field guide. Warm, analog, paper-first — deliberately against the dark-terminal default of dev tools (differentiation through warmth, PRD §5). Plainspoken and dry, never twee, never military/tactical. The visual system should feel like a well-used field notebook, not a command center.

## 2. Palette semantics

- **Paper/cream base + ink** — the ground. Warm near-black text on warm paper.
- **Forest** — structural accent: headings, primary glyphs, wordmark.
- **Trail-marker (ochre/orange)** — secondary accent, used sparingly.
- **`--color-report` (reserved)** — exclusively the surfaced-report moment, nowhere else, ever. The conceptual anchor: a **trail blaze** — in the woods, one painted color means "follow this." The visual system teaches "this color = Scout found something" the same way. Token discipline is review-enforced.

## 3. Type (D-012)

shadcn Typeset for rhythm; fonts through its variables: **Fraunces** (display — lexicon nouns, headings), **General Sans** (body/UI), **iA Writer Mono** (inside terminal frames only — deliberately not JetBrains/SF Mono). Optional stamp-accent face parked: National Park Typeface (wordmark/waypoint labels only, never running text). All free/open licenses, self-hosted, subsetted, variable.

## 4. Iconography

Monoline stroke system: 24px grid, 1.75px stroke, `stroke: currentColor`, Lucide-convention geometry, shipped as one inline SVG sprite (`Icon.astro`).

### The four families and what they mean

**Wayfinding & trail signs** — *a mark left by someone who went ahead, for someone who follows.* The richest family for Scout: this is literally what a report is. Glyphs: blaze (paint marks on trees), cairn, waypoint marker, compass, north point, pebble/twig trail signs (Baden-Powell's actual sign language — "turn left," "gone home" — historical depth for the reports concept).

**Cartography** — *terrain that's been surveyed.* Contour lines (already the section texture), dashed routes, folded maps, grid crosshairs, marker pins. Good for structure, dividers, the manifest (a packing list is a map legend). Note the verb alignment: `/scout:survey` is a cartographer's word.

**Kit & camp** — *what you carry.* Pack (the category noun — anchors the family), tent, campfire, lantern, canteen, rope knots. Use sparingly as texture; too much gear tips "field guide" into "REI catalog."

**Field marks & insignia** — *evidence and honors.* Tracks/footprints, pine, ridgeline, compass star, stamp/perforated-badge frame, chevron, woven-patch borders.

### Glyph ↔ product-concept mappings (use these deliberately)

| Glyph | Concept | Why |
|---|---|---|
| Blaze | Reports / the signal color | A blaze is a color that means "follow this" |
| Tracks | Revealed preferences / the setup scan | "Scout reads tracks, not answers" — the glyph does the copy's work |
| Waypoint marker | Markers (voice vocabulary: what the scan proposes) | Same word, same object |
| Pack | The category itself | The one-sentence definition |
| Contours | Surveyed terrain / manifest | Compact map of what's known |
| Stamp frame | Philosophy tenets; future expedition patches | Insignia without merit-badge framing |

### Avoid list (decision-weight, D-019)

- **Fleur-de-lis / trefoil** — trademarked WOSM/BSA/Girl Guides emblems; reads as the organization, not the metaphor. Never.
- **Binoculars, spyglass, magnifying glass** — say *watching/searching*; fight zero-recall (nobody searches) and the courier privacy story (Scout never looks). Same failure as the rejected "heyscout"/"recon" directions.
- **Camo, dog tags, tactical anything** — military scout register, declined with the Recon rename.
- **Merit-badge framing** — expedition patches, never merit badges; curation, not accumulation (PRD §7).
- **Mascot/character** — parked per PRD §5; hard to un-ship.

### Sprite inventory

Current: pack, waypoint, compass, contour, stamp, arrow, blaze, tracks, cairn.
Pack glyph redrawn: the shoulder strap is now two separate curves instead of one arc bridging the body (that bridge plus the rounded rect read as a padlock shackle at small sizes), and the inner detail resolved into a proper front-pocket rect. Applied: tracks sits beside the stated/revealed-preferences blockquote in `Philosophy.astro` (D-019 glyph map: tracks = revealed preferences). The HowItWorks "Pack it" step keeps the pack glyph rather than swapping to blaze — pack maps to "the category itself," which is what that step is; blaze is reserved for reports.

## 5. Reference sites (from the demo-craft research, July 2026)

- **Charm (charm.land)** — the proof a CLI brand can escape the terminal cliché with character and warmth. Closest spiritual reference.
- **Bun / uv (astral.sh)** — the install-command-as-CTA pattern, done straight.
- **Linear** — motion-restraint discipline; screenshots over video.
- **Craft-style editorial/paper sites** — the warm paper register reading as premium.
- **Warp** — the deliberate anti-reference: dark IDE aesthetic, enterprise logo wall (though its screenshots-over-video restraint is instructive).

## 6. Motion rules (Emil Kowalski / Rauno Freiberg school, distilled)

- The Beat 2 demo is the page's entire animation budget. Everything else: static, or an instant fade.
- Animate `transform`/`opacity` only; 150–300 ms, `ease-out`; interruptible.
- `prefers-reduced-motion` honored everywhere — the demo renders final frames statically.
- At most one stroke-draw moment (`stroke-dashoffset`) sitewide, if any; never across a whole icon set.
- Restraint elsewhere is what makes the one animated thing read as intentional.
