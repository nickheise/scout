# Decision Log — Scout Marketing Site

One entry per decision. Status: **Pending** (blocks or shapes work), **Decided** (with date + rationale), **Proposed** (recommendation awaiting sign-off), **Superseded**.

---

## D-001 · Site framework — **Decided** (2026-07-18)
**Decision:** Astro 7.x, static output, zero client JS by default; interactivity ships only as islands (`client:idle`/`client:visible`).
**Rationale:** Nick OK'd Astro; research confirms it's still the right default in mid-2026 (Cloudflare acquired Astro Jan 2026 — long-term stewardship de-risked; v6+ Fonts API and CSP-via-meta are directly useful here). Honors PRD §6's "no client framework unless the demo demands it" while accommodating D-002.
**Consequences:** Node 22+; islands are the only JS on the page.

## D-002 · Styling — **Decided** (2026-07-18)
**Decision:** Tailwind CSS v4 (CSS-first `@theme` — brand tokens live as CSS custom properties) + shadcn/ui conventions, with shadcn React components used *only* inside interactive islands that earn their weight. Static beats are pure Astro/Tailwind markup — no React runtime for non-interactive content.
**Rationale:** Nick's stated stack preference (Tailwind + shadcn); v4's CSS-first config keeps the bespoke field-guide token system first-class. Research note: vanilla CSS was the marginal craft pick, but the gap is small in v4 and team-velocity wins.
**Consequences:** React lands on the page only via islands (copy buttons, star count, demo player if needed); page-weight budget still governs.

## D-003 · Beat 2 demo format — **Decided** (2026-07-18)
**Decision:** Hand-built "beat script" terminal animation — a small custom timeline player (termynal-inspired pattern, vendored/owned, not a dependency) driving real DOM text in a brand-styled terminal frame. `prefers-reduced-motion` renders the final states instantly. The v0 "static screenshot sequence" fallback is the same component with animation off — no rework.
**Rationale:** Nick chose it; research strongly agrees (only option with full art direction over the two-act narrative, near-zero weight, real accessible text; top-craft sites ship restraint — this is the page's single motion spend, per PRD §4).

## D-004 · Domain + GitHub org name — **Deferred** (2026-07-18: revisit before Scout Phase 2)
**Findings (RDAP + GitHub API, 2026-07-18):**
- Domains unregistered: `scout-pack.dev`, `packscout.dev`, `getscout.dev`, `scoutpack.dev`. Taken: `scout.dev`, `usescout.dev`.
- GitHub orgs free: `scout-pack`, `packscout`, `usescout`, `scoutpack`. Taken: `scout`, `getscout`.
- **Matched pairs (domain + org both free): `scout-pack` · `packscout` · `scoutpack`.**
**Recommendation:** `scout-pack` — first PRD candidate, and "pack" is the product's core noun. Register promptly once chosen (unregistered ≠ reserved; availability decays).
**Decision (Nick, 2026-07-18):** revisit before Scout Phase 2. Everything builds behind a single site-config constant (org, repo, domain, install one-liner); swap is one line + an OG re-render.
**Update (2026-07-18, sync from Scout engineering D-007):** engineering namespace is now locked independent of the domain — GitHub repo stays `scout` under Nick's account, plugin named `scout` (repo acts as its own marketplace; endgame is Anthropic's official plugin directory where the `scout` slug is free). Engineering's collision research (their `docs/research/naming.md`): scout.dev is a live monitoring product, npm `claude-scout` is an active package in our exact niche, Docker Scout owns `scout-cli` mindshare — the PRD §9 Q2 "Scout for Claude Code / for agents" disambiguation phrasing is confirmed necessary. Domain candidates verified available: scoutcc.dev, scoutpack.dev, heyscout.dev, getscout.dev. **Marketing evaluation → this thread recommends `scoutpack.dev`** (see D-015); Nick's prior lean was getscout.dev; final call is Nick's, recorded in engineering's DECISIONS.md.

## D-005 · License — **Decided** (2026-07-18)
**Decision:** MIT. Philosophy-section copy states it plainly per PRD Beat 4.

## D-006 · Hero headline — **Decided** (2026-07-18)
**Decision:** Problem-led default — "You keep finding great libraries. Then you forget they exist." All three PRD directions built as swappable variants for the §9 Q4 real-people test before launch.

## D-007 · Launch scope — **Decided** (2026-07-18)
**Decision:** Build the full v1 six-beat architecture, sequenced so the v0 subset (Beats 1/3/5 + static demo frames + three-line philosophy) is shippable first.

## D-008 · Hosting — **Decided** (2026-07-18)
**Decision:** Vercel (Nick's platform preference), static output, deployed from GitHub on push.
**Notes:** Research marginally favored Cloudflare Pages (response headers, `_redirects`); Vercel is equivalent for this site's needs and its edge functions are the natural home for per-code OG images if the Later-phase `/patch` route ever wants them (research confirmed: OG scrapers don't run JS, so per-code OG cards are impossible purely client-side — ship `/patch` with one generic OG image, static and honest, per PRD's zero-server constraint).
**Neon:** not used — PRD mandates zero backend and nothing here needs a database.

## D-009 · Analytics — **Decided** (2026-07-18)
**Decision:** GoatCounter — free for OSS, <1KB, cookieless, itself open source; the most philosophically defensible nonzero option. Instrument exactly the two §8 events (install-command copy, tracks-prompt copy) + pageviews. Disclose it plainly (footer line), keeping the no-telemetry story honest.

## D-010 · Tracks prompt authorship — **Decided** (2026-07-18)
**Decision:** Scout core owns the prompt (PRD §9 Q6). The site ships the Beat 4.5 block fully built (copy button, instruction lines, handoff line) with clearly-marked placeholder prompt text; swapping in the real prompt is a content-only change.

## D-011 · Demo content source — **Decided** (2026-07-18) · **Reconciled** (2026-07-20)
**Decision:** Art-directed recreation — Nick confirmed it need not be perfectly faithful to the real CLI experience. Demo script drafted from PRD v0.2's Beat 2 description (`docs/demo-script.md`), reviewed by Nick before launch; reconcile against real Scout output before v1 ships if it materially diverges.
**Reconciliation (2026-07-20):** engineering delivered live plugin v0.4.0 captures (`docs/real-output-captures.md` — all five Scout build phases complete, 223/223 tests). Nick's calls on the deltas: (1) Act 2 report renders as the **real compressed card** (title+repo, ambient line, Matched clause; signal color on title + card border) — demo-script v2; (2) **no no-op scene** — the loop stays two acts (~30s), the philosophy copy carries restraint; (3) Beat 3 copy softened "one-line reports" → "compact reports" (PRD next-revision suggestion noted). Also from the wrap: browse-page screenshots (passed live review) available from engineering — earmarked for the launch post, not the landing page.

## D-012 · Typography system — **Decided** (2026-07-18)
**Decision:** shadcn **Typeset** (per Nick — ui.shadcn.com/typeset) as the typography rhythm system: plain CSS (`--typeset-size` / `--typeset-leading` / `--typeset-flow`, container classes), imported after Tailwind — Astro-compatible. Fonts feed in through its theme variables (`--typeset-font-body/-heading/-mono`): General Sans (body), Fraunces (display/lexicon nouns), iA Writer Mono (terminal frames) — the research-backed field-guide pairing replaces typeset's Geist defaults, which would read default-dev-tool against PRD §5. Self-hosted, subsetted, variable.

## D-017 · PRD v0.3 sync: survey rename, register doctrine, retrieval guardrail — **Decided** (2026-07-19)
**Context:** Scout PRD v0.4 / site PRD v0.3 (`docs/prd-scout-marketing-site-v0.3.md`) landed via engineering + Nick.
**Absorbed:** (1) `/scout:review` → `/scout:survey` (plugin v0.3.0; verb slate LOCKED: add, archive, list, start, explain, survey, setup) — Beat 3 step 4 and copy deck updated; demo unaffected (uses `add` only). (2) "Plain in, brand out" register doctrine + sanctioned voice vocabulary (*signals*, *markers*, expedition narration) recorded in the copy deck — the v1 copywriting pass may now put brand narration in Scout's demo output. (3) Tenet-7 positioning guardrail: never market retrieval ("survey is a backstop, not a workflow") — added to copy-deck guardrails. Bonus: the survey rename resolves the earlier launch-gate verb gap differently (v0.1.0 never ships `review`; the site now names `survey`, which lands Phase 3).

## D-014 · Command rendering: colon namespace — **Decided** (2026-07-18, synced from Scout engineering D-007)
**Decision:** The plugin platform namespaces commands with a colon — real commands are `/scout:add`, `/scout:start`, `/scout:survey` (né `review`, renamed in D-017), `/scout:setup`. The site always renders the real command; the "seven plain-English verbs" framing is unaffected (the verbs stay plain — the colon is a platform artifact, not brand register). Copy deck and demo script updated. **Follow-up:** the build workflow launched before this sync — verify/fix command strings in the built sections and demo data during post-review triage.

## D-016 · Router-skill callout (copy direction) — **Decided** (2026-07-19, synced from Scout engineering)
**Context:** the platform only allows colon-form plugin commands (`/scout:add`); engineering ships an optional logic-free personal router skill giving users literal `/scout add`.
**Decision (per engineering's copy implication):** primary install instructions and all screenshots/demo show the **colon form**; the router appears only as a quiet "prefer `/scout add`? one extra step" callout — candidate placement: Beat 5, below the works-with row. Callout copy lands in the v1 copywriting pass.

## D-015 · Domain recommendation (marketing evaluation) — **Proposed** (2026-07-18; still open)
**Recommendation: `scoutpack.dev`** (org `scoutpack`, npm `scout-pack` — all verified free). Rationale against PRD positioning:
- **The domain teaches the category.** "Pack" is the product's core noun; the PRD's one-sentence definition is "a pack your agent carries." Every share, OG card, and install screenshot then carries the thesis. No other candidate does semantic work.
- **It disambiguates by itself.** Against Docker Scout / Scout APM / scout.dev-the-monitoring-product, "scoutpack" is a distinct compound; "getscout" still just says "scout" and leans on context.
- **Register fit:** a scout's pack is literally an expedition object — native to the field-guide brand, and future-proof for the expedition-patches/merch direction.
- **Why not the others:** `getscout.dev` — the "get-" prefix is semantically empty 2010s-SaaS register, and github.com/getscout is taken (org would be the mismatched `get-scout`). `heyscout.dev` — summoning register ("hey Siri") contradicts the zero-recall thesis: you never invoke Scout. `scoutcc.dev` — cleanest namespace but bakes "Claude Code" into the identity, violating PRD §2 ("the site should never read as Claude-only"), and fails the barbecue test.
**Status:** reported back to the engineering thread; Nick decides. **Update 2026-07-19:** Nick deferred the domain ("lowest concern"); recommendation stays on the table. The rest of D-004 settled — name stays Scout (Recon rename evaluated and declined, our assessment recorded in the scout repo's naming research), repo home is github.com/nickheise/scout (personal account, repo as its own single-plugin marketplace, official Anthropic directory later). Site config updated to real org/repo and the two-step install (`/plugin marketplace add nickheise/scout` + `/plugin install scout@scout`) — **CONFIRMED 2026-07-19** with Phase 2 shipped (plugin v0.1.0, strict-validated). Only `domain` remains a placeholder.
**Launch gates from the same sync:** (1) the scout repo is LOCAL-ONLY until Phases 3–4 build out — every GitHub link and the install command on this site 404 until engineering pings that it's public; do not deploy publicly before then. (2) Verb availability: `add/archive/list/explain/start` live in v0.1.0; `/scout:review` ships with Phase 3, `/scout:setup` with Phase 4 — the site's Beat 3 (review) and Beat 4.5 (setup handoff) advertise both, so site launch requires Phase 4 or a copy adjustment. The router template shipped (`templates/scout-router`, `docs/router.md` in the scout repo) — the D-016 callout can link to the real doc.

## D-018 · Positioning canvas adopted; category anchor doctrine — **Decided** (2026-07-19)
**Context:** Dunford 10-step positioning run across both Scout threads (core repo PRD v0.4 + research, this repo's PRD/deck/decisions). Output: `docs/scout-positioning.md` — a pre-launch positioning **thesis**.
**Decision:** (1) Category: **memory for coding agents**, subsegment **taste/tooling memory, not transcript memory**; style Big Fish, Small Pond. (2) **Metaphor on the site, category on comparison surfaces** — pack metaphor stays the site's language; README/directory/OG/HN lead with the category anchor. Canonical strings added to the copy deck (final section) as a handoff to Scout core. (3) Copy-level applications: two new copy-deck guardrails (never market team-policy enforcement; never market recommendations/curation), the 25-lines-vs-CLAUDE.md restraint stat added to Beat 4 tenet 2 (deck + built section), category-anchored `siteDescription` in `src/config.ts`. (4) Launch post drafted on the insight spine (`docs/launch-post.md` — "retrieval doesn't fix forgetting"), including the alternatives-by-approach section.
**Hero test guidance (Proposed, Nick's call at the §9 Q4 test):** run A vs C; retire B ("bookmarks" headline files Scout as a bookmark manager — category baggage). A stays default meanwhile.
**Revisit trigger:** re-run the canvas after the first 10–20 clearly-ecstatic users — watch pack-led vs steps-led enthusiasm and any "does it log my sessions?" confusion from the memory framing.

## D-019 · Visual language reference adopted — **Decided** (2026-07-20)
**Decision:** `docs/visual-language.md` is the reference for Scout's visual system — iconography families with glyph↔concept mappings (blaze↔reports/signal color, tracks↔revealed preferences, waypoint↔markers, pack↔category), palette semantics, type recap, reference sites, motion rules. Includes a decision-weight **avoid list**: fleur-de-lis/trefoil (trademarked org emblems), binoculars/spyglass/magnifier (surveillance register — fights zero-recall and the courier story), camo/tactical (military register, declined with Recon), merit-badge framing, mascots.
**Open polish item:** sprite additions (blaze, tracks, cairn) and the padlock-reading pack glyph fix — schedule with the v1 polish pass.

## D-020 · Positioning widened to libraries+practices; tracks retired; courier-prompt naming unified; roadmap beat added — **Decided** (2026-07-28)

Four related fixes from the same discussion with Nick, landed together
against the current Next.js build (`site/next-migration` branch).

**1. Courier-prompt naming unified.** Scout core has always called this
artifact **the courier prompt** (`docs/courier-prompt.md`, core PRD §7.3).
This site had independently minted a second name, "the tracks prompt"
(section id, eyebrow, CopyBlock label, GoatCounter event, config key) —
two names for one artifact, both live in current docs. `TracksPrompt.tsx`
→ `CourierPrompt.tsx`; `SITE.tracksPrompt` → `SITE.courierPrompt`,
mirrored byte-for-byte from core's file (that file is the source of
truth; keep them in sync on any future edit there). The placeholder text
("[Tracks prompt — supplied by Scout core before v1 launch]") is gone —
D-010's block condition (core ships it) was satisfied back in core's
Phase 4; the site just hadn't picked it up.

**2. "Tracks" retired from user-facing copy, kept where it's a line, not
a label.** Scout core's D-014 retired `tracks` as a verb but explicitly
kept it alive as a copy concept ("Scout reads tracks, not answers"). On
review, the distinction that matters for *this* site is narrower: the
sentence earns its place (an antithesis explaining why there's no setup
questionnaire), but the section eyebrow "Tracks" did not — a label the
reader has to decode before "Meet your taste" (which already says the
thing) is exactly where brand vocabulary costs recall instead of being
free, the one case the register doctrine (PRD §7.1) warns against. Fix:
Philosophy's closing line now reads "Scout reads your history, not your
answers" (same antithesis, no retired word); the eyebrow is now
functional ("Before you install") rather than a lexicon label.

**3. Positioning widened: libraries → libraries+practices, memory
category unchanged.** `docs/scout-positioning.md`'s value theme 3 ("every
project starts like your best project") was deliberately kept to one
quiet sentence in v1 "to protect theme 1's clarity" — a call made
2026-07-19, before Scout core's step/ritual half of the schema had real
weight behind it (path-b-step.md, phase enum, `/scout:start` scaffolding
all exist now). Nick's call: lift that constraint. The **category anchor
stays exactly where D-018 put it** (memory for coding agents,
taste-not-transcripts) — only the *object* of memory widens, from
"libraries" to "what works," which is what the positioning canvas's
one-line description already said ("the libraries, tools, and practices
you meant to use") without the site ever executing the "practices" half.
Applied: hero headline "You keep finding what works. Then every new
project starts from scratch." (was libraries-only); hero subhead now
names both halves explicitly; `siteTitle`/`siteDescription` reworded to
match; HowItWorks' "Pack it" step now names both `/scout:add` paths (URL
→ pack entry, plain text → step) instead of only the URL path; the
trailing ritual line — previously one muted footnote sentence below the
step grid — promoted to a labeled sub-block (icon + heading, same visual
register as a Philosophy tenet) so it reads as a real beat rather than an
afterthought. No new section for this one — it widens two existing beats.
**Revisit trigger unchanged from D-018:** re-run after the first
10–20 ecstatic users; watch specifically whether they turn out pack-led
or steps-led, since that could flip the value-theme order this decision
just set.

**4. The site is written to the intended feature set, in present tense.**
Nick's call, and it supersedes both the earlier "shipped features only"
default *and* the first attempt at it. A "Designed, not shipped" Roadmap
section was built first and rejected on review: quarantining the new
capabilities into a labeled future-tense appendix is not integration, and
it buries the very features that carry the widened positioning. The site
may now run ahead of the plugin; **Nick holds the production gate and
will not deploy until core has caught up.** Two new first-class sections
replace the Roadmap:

- **`FieldGuide.tsx`** — the D-021 distinction as a full beat ("The pack
  goes in. The field guide comes out."). Three cards for the three entry
  types — Links (`pack`), Practices (`step`), Standards (`reference`,
  naming the D-022 exemplar/rubric/gotcha razor inside the card) — then
  the compiled output: manifest, standing instructions, phase checklists.
  Reference entries are presented as peers of the other two, not as a
  preview.
- **`TasteLoop.tsx`** — field notes as a *user-facing* feature and the
  page's compounding argument ("It gets more like you, not less."). This
  is the D-023 taste loop: corrections captured during a session become
  proposed rubric updates at wrap, ratified through the normal
  confirm-before-commit gate. Copy is written so it can never read as
  Scout editing standards autonomously (tenet 7, write-deliberate).

**Lexicon delineation, now executed on the site rather than only recorded.**
Both terms are live user-facing nouns, in exactly one sense each:
*field notes* = what Scout writes when a run deviates or the user
corrects it — local-only, one per run, stored outside the pack dir so a
Tier 1 synced pack can never carry it to a remote (D-018); *the field
guide* = the compiled layer a project receives (D-021). The two are
connected by the taste loop, which is the reason field notes are worth
surfacing to users at all instead of staying maintainer-only. Philosophy's
fine print now says "No telemetry — including field notes, which stay on
your machine," so the new feature strengthens the trust claim instead of
quietly complicating it.

**Deliberately dropped from the site:** core PRD §11's two Parked ideas
(expedition patches; supersession-chains-as-shared-pack-centerpiece).
They were in the rejected Roadmap section; on the integration pass
neither earned first-class treatment — patches are a collectible with no
bearing on the core argument, and the supersession page is about a
sharing surface that doesn't exist yet. Revisit if either gets built.

**Sync obligation:** `FieldGuide.tsx` and `TasteLoop.tsx` mirror core
DECISIONS.md D-021–D-023 by hand (no shared source file), and they
describe behavior the plugin does not yet implement. Re-check both in the
same pass as any core-side change to the reference layer, `work_phase`,
or the wrap-phase taste step — and before the production deploy.

**Also fixed in the same pass (synced from core D-024):** the install
command mirrored in `SITE.installCommand` updated from
`/plugin install scout@scout` to `/plugin install scout@nickheise` —
core renamed its marketplace entry, not the plugin; `/scout:*` commands
are unaffected.

## D-013 · Repo placement — **Decided** (2026-07-18)
**Decision:** Build standalone in `scout-marketing`, structured for a clean lift into the Scout monorepo `/site` (PRD §6). Site-specific paths/config kept relative and self-contained. **Standing reminder: flag the lift to Nick once the site reaches a stable point (v0 gate or v1 pre-launch).**
