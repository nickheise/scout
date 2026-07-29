# Sync audit — 2026-07-28

Written at the end of the lexicon/positioning thread (commits `f8f1b3d`,
`1a67991`, `03dd56f`, `33325b2`), as a handoff so nothing from that
discussion is lost. Everything below was verified against the repo, not
recalled. Delete this file once the items are closed.

Ordered by consequence, not by topic.

---

## 1. BLOCKING — field notes cannot carry the taste loop as specified

This is the one real contradiction, and the site now states it publicly.

Three sources disagree:

| Source | Says |
|---|---|
| `references/field-notes.md:7` (shipped contract, D-018) | "Field notes are maintainer triage material about **skill mechanics**" |
| `references/field-notes.md:27-29` (shipped contract) | "**Not triggers:** … **taste** ('this wording felt awkward'), or anything that merely *could* be improved" |
| `DECISIONS.md` D-023 | "one shipped `wrap`-phase step reviews the session's corrections ('field notes,' D-018 Phase A capture) and **proposes rubric updates**" |
| `site/src/components/sections/TasteLoop.tsx` (live copy) | "Scout reads the corrections back and proposes updates to your standards" |

D-018's trigger enum is closed and mechanical — `step-failed`,
`undocumented-environment`, `user-corrected` — and `user-corrected` means
"wrong routing, a misread input shape, a step they had to redirect,"
explicitly *not* taste. So the artifact D-023 wants to read at wrap does
not currently contain what D-023 wants to read.

**D-023 made this leap, not the site copy** — the site faithfully
implements D-023. But the site is what makes it a public claim.

Three ways out, needs a decision before the reference layer is built:

1. **Widen field notes** — add a taste/standards trigger to the enum.
   Cheapest, but it breaks D-018's clean "mechanics, not judgment" line
   and mixes maintainer triage with user content in one file. Note the
   privacy consequence: field notes are deliberately outside the pack dir
   so Tier 1 sync can't carry them; user taste corrections arguably
   *should* live in the pack.
2. **Separate capture for taste corrections** — a second, pack-side
   artifact the wrap step reads. Keeps D-018 intact; costs a new file and
   a new contract.
3. **Narrow the taste loop** — wrap step re-reads the session directly
   rather than a persisted artifact. No new storage; loses the
   across-sessions accumulation that is the whole point.

Until this is resolved, `TasteLoop.tsx` describes a mechanism that
doesn't exist in the shape described.

---

## 2. Terminology collision — "field guide" means two things

- `site/docs/BUILD-CONTRACT.md:38` — "the whole D-019 expedition/**field-guide**
  visual language are **retired**"
- `DECISIONS.md` D-021 — "**the field guide** is what Scout hands a project" —
  a ratified product noun, now a live site section (`FieldGuide.tsx`)

One retires the phrase, the other promotes it. Both are current. Anyone
reading BUILD-CONTRACT cold will think the term is banned.

Fix is one line in BUILD-CONTRACT §0.9: scope the retirement to the
*visual register* and point at D-021 for the product noun.

---

## 3. Site is ahead of the plugin — production gate is open

Per Nick's call, the site describes the intended feature set in present
tense. Not yet in the plugin:

- `reference` entry type / exemplar / rubric / gotcha (D-022 — schema
  sketch at `docs/research/reference-entry-schema-sketch.json`, **not**
  applied to `schema/entry.v1.json`)
- `work_phase` (D-023) — and per D-023 only `planning` has a verified
  trigger; `build`/`review`/`ship` do not
- the compiled field-guide section and its cap (D-022, cap value open)
- the wrap-phase taste loop (D-023, and see item 1)

Live site sections asserting these: `FieldGuide.tsx`, `TasteLoop.tsx`,
plus `HowItWorks.tsx` step 2 (renamed "The field guide") and step 3
(work-phase surfacing).

**Do not deploy to production until core catches up.** Recorded in
`site/DECISIONS.md` D-020; repeated here because it's the highest-cost
mistake available right now.

---

## 4. Stale docs still referencing the retired "tracks prompt"

The artifact has one name now — **the courier prompt**
(`docs/courier-prompt.md`). Verified: `site/src/lib/config.ts`'s
`courierPrompt` is byte-identical to core's file. These still say
otherwise:

| File | What's stale |
|---|---|
| `site/docs/copy-deck.md:64,70,74` | "Tracks copy", "Beat 4.5 — The tracks prompt", `{{TRACKS_PROMPT}}` placeholder + the retired placeholder string |
| `site/docs/copy-deck.md:5,9` | lists "tracks" as a brand-register concept noun |
| `site/PLAN.md:11,16` | "tracks prompt"; analytics event named `tracks-copy` (renamed to `courier-copy` in code) |
| `site/DECISIONS.md:45` (D-009) | instruments "tracks-prompt copy" |
| `site/docs/prd-scout-marketing-site-v0.3.md:68,70,103,121,128,139` | Beat 4.5 titled "The tracks prompt"; "Scout reads tracks, not answers" as anchor copy |
| `site/docs/launch-post.md:49,60` | "the tracks prompt", "Scout reads tracks, not answers" |
| `site/docs/scout-positioning.md:54,88` | "the tracks prompt" as the proof mechanism |
| `docs/prd.md:283` (core) | lexicon still lists **tracks** as one of four user-facing nouns |

`docs/prd.md:217` and `docs/courier-prompt.md:8` use "tracks" as
*narration voice*, which the register doctrine sanctions — those are
fine, leave them.

Also stale, flagged earlier and never fixed: `site/docs/visual-language.md`
still headed "**Status:** Adopted 2026-07-20 (D-019)" while
BUILD-CONTRACT retires the system it documents.

---

## 5. Content gaps identified but never acted on

From the original review of what the plugin does vs what the site sells.
Item 2 below is the one worth arguing about.

1. **The `/scout:setup` history scan** — the strongest differentiator and
   the answer to "so I start with nothing?". Still only present as the
   Philosophy blockquote plus the courier prompt, which is a *teaser for*
   the feature rather than the feature. `bin/scout-scan.mjs` +
   evidence-attached proposals are not shown anywhere.
2. **Archive / supersession chains** — nothing on the site. The README
   already leans on this ("kept honest by archives and supersession") and
   the PRD calls it the richest taste signal. `/scout:archive`,
   `superseded_by`, the graveyard.
3. **The rejection ledger** — Philosophy *asserts* "rejections are
   logged"; `.scout/ledger.jsonl` with closed-enum reasons is never
   shown. Restraint is the page's hardest claim to believe and the
   easiest to prove.
4. **The manifest as a shown artifact** — "capped at 25 lines" is stated,
   never demonstrated. Same for managed-block mechanics (sync-hash edit
   detection, corruption refusal, idempotent re-runs).
5. **The browse page** (`page/index.html`) — zero-build, drag-drop,
   offline, courier reactivate. Mentioned only as a Tier 1 line item.

---

## 6. Smaller drift

- **`heroVariant` is dead config.** `site/src/lib/config.ts:11,29,70`
  defines and sets it; nothing consumes it. The A/B/C variants it refers
  to predate the rewritten hero, as does `site/DECISIONS.md` D-018's
  "run A vs C, retire B" guidance. Either wire it up against new
  variants or delete the field and the guidance together.
- **`SITE.domain` is still `scout-placeholder.dev`** (D-004 deferred).
  Now load-bearing in more places than before: `robots.ts`, `sitemap.ts`,
  `metadataBase`, canonical URL, OG. They emit placeholder URLs today.
- **README and `docs/prd.md` don't mention** field guide, references,
  exemplar/rubric/gotcha, or `work_phase` at all. Correct while unbuilt,
  but they'll need a pass the moment core lands D-022/D-023 — and they're
  currently the only surfaces that still describe Scout accurately.
- **`.tmp-*` scratch files** in `site/` from the parallel session
  (`.tmp-axe-scan.mjs`, `.tmp-axe-detail.mjs`, `.tmp-contrast-scan.mjs`,
  `.tmp-report-scan.mjs`, `.tmp-lh-desktop.json`) — untracked. Worth a
  `.gitignore` rule if they're disposable.

---

## 7. Still-open questions carried forward (already recorded)

Listed so they don't get re-derived: `DECISIONS.md` P-4 (manifest cap
value), P-9 (PRD prose space-form vs colon-form commands), D-022's
reference-section cap value, D-023's two opens (does `work_phase` apply
to pack entries; review surface for proposed rubric updates).

---

## 8. Deliberately dropped — do not re-add without a decision

- **Expedition patches** and **supersession-chains-as-shared-pack-centerpiece**
  (core PRD §11 Parked) were on a rejected "Designed, not shipped"
  section and were cut on the integration pass. Reasoning in
  `site/DECISIONS.md` D-020.
- **"Tracks" as a user-facing label.** The concept survives as the
  *sentence* it earns ("reads your history, not your answers"); it is not
  coming back as an eyebrow, section name, or artifact name.

---

## Closed in this thread (no action needed)

Marketplace `scout` → `nickheise` and MCP server `scout` → `store`
(D-024); courier-prompt naming unified and placeholder replaced with the
real prompt; "tracks" removed from all live site copy; positioning
widened to workflows; field guide and field notes integrated as
first-class sections; a pre-existing `<code>` whitespace bug fixed
(`/scout:adda URL`); root `pnpm-lock.yaml` gitignored as a second
lockfile for an npm-managed package.
