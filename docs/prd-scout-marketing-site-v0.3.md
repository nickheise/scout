# PRD — Scout Marketing Site

**Project:** Landing site for the open-source release of Scout
**Version:** 0.3 · July 19, 2026
**Owner:** Nick
**Status:** Draft — synced with Scout PRD v0.4
**Dependency:** ~~Assumes the plugin-first tiered architecture~~ **Resolved** — Scout PRD v0.3 locks Tier 0 (zero-server, zero-key plugin install, ~60 seconds). The install story this site is built on is now canon.
**Changes in 0.2:** verb slate synced (seven plain-English verbs; "tracks" retired as a command, retained as the concept in copy), Beat 4.5 handoff updated, Beat 5 heading restored, ships-empty framing in the gallery/footer, courier pattern named consistently (per Scout PRD §7.3), patch code-renderer mechanic captured, discovery-not-curation stance applied to the Later phase.
**Changes in 0.3:** `review` → `survey` throughout (verb slate now locked: `add, archive, list, start, explain, survey, setup`), the register doctrine ("plain in, brand out") written into tone of voice — Scout's narration/progress copy carries the expedition vocabulary (tracks, signals, markers) precisely because nobody has to remember it.

---

## 1. Purpose

A single-page marketing site that converts a curious developer into an installed user in under two minutes, and communicates Scout's category clearly enough that visitors can retell it ("it's a pack your agent carries — you drop links in, it hands them back at the right moment"). The site sells the *problem recognition* first; every developer has a graveyard of bookmarked libraries they forgot to use.

Secondary purpose: establish the Scout brand (expedition-scout register, the lexicon) so the open-source project has an identity beyond a README — which drives stars, retention, and contributor gravity.

## 2. Audience

**Primary:** Claude Code users who build UI or ship side projects — design engineers, AI-native developers, the emilkowalski/mattpocock skills audience. They already understand skills, plugins, and CLAUDE.md; they need zero education on the substrate.

**Secondary:** Cursor/Codex/other-agent users. The manifest layer works in any AGENTS.md-aware agent on day one; the site should never read as Claude-only even though the full reports experience is Claude Code-first.

**Tertiary (deliberately served, cheaply):** the tech-adjacent visitor — a PM or design lead evaluating whether their team should adopt it. The barbecue-test naming — and now the all-plain-English verb slate — was chosen for exactly this reader; the site's plain-language problem statement is their on-ramp.

## 3. Core narrative (page structure)

One page, six beats, in order. Each beat earns the scroll to the next.

### Beat 1 — Hero: the problem, then the name

- Headline territory: the forgetting problem, stated so the reader self-identifies in one line. Directions to explore: "You keep finding great libraries. Then you forget they exist." / "Your bookmarks are where good libraries go to die." / "Be prepared." (the motto as headline is high-risk/high-reward — test it).
- Subhead: the category definition in one sentence — Scout is a pack your coding agent carries; drop links in, and Scout surfaces them at the exact moment they apply.
- Immediately below: the install one-liner in a copy-block. The command IS the CTA. No "Get Started" button that leads to a docs page — the docs page is one line long.
- Secondary CTA: GitHub link with live star count.

### Beat 2 — The moment (show, don't tell)

The single most important section: a staged terminal/session recording showing the magic moment —

1. User types `/scout add https://…` → Scout drafts the entry → user confirms. (~5 seconds of footage)
2. Cut to: days later, a different project. User asks the agent to build a draggable card list. Mid-plan, a **report** appears: the saved library, one line on why it matched, link. User clicks through, adopts it.

Format: looping muted video or high-fidelity animated terminal (Asciinema-style or custom-built — given the owner's craft standards, custom). This beat must make the zero-recall property *felt*: the user in the recording never searches, never remembers, never invokes anything at the surfacing moment.

### Beat 3 — How it works (the loop, in lexicon)

Four illustrated steps — in-world nouns for the concepts, plain-English verbs for the commands:

1. **Pack it** — `/scout add` a URL from anywhere; Scout analyzes it and files it with the conditions where it applies.
2. **The manifest** — `/scout start` on a new project writes a compact packing list into your agent's context. Capped small on purpose: a pack you can't carry is a pack you don't bring.
3. **Reports** — while you build, matches that survive Scout's gate surface as one-line reports. Ignore them freely; Scout learns from that too.
4. **Survey** — before you ship, `/scout survey` walks the whole project for anything you missed.

Visual direction: field-guide illustration style (see §5). This is also where the steps module gets one sentence — Scout also carries your project rituals (changelog, decision log, how you build big features) so every project starts the same way — without complicating the core pitch.

### Beat 4 — The philosophy (differentiation without naming competitors)

Short manifesto section, 3 tenets max:

- **Zero recall.** If you have to remember to use it, it's already failed. Nothing in Scout requires remembering — not a command, not a keyword, not that it exists.
- **Restraint.** Scout expects to say nothing most of the time. Suggestions pass a gate; rejections are logged; two per moment, max. "Nothing surfaced" is a good result.
- **Your pack, your files.** Entries live in a plain folder you own — file over app. Scout's code updates via plugin; your data never leaves your hands, and Scout has no brain of its own: your agent does the thinking. No server, no account, no API key, ever.

This section carries the trust load for the HN/Reddit audience: local-first, no telemetry, no lock-in, ships-empty (Scout imposes no defaults — your pack is yours from entry one), MIT (or chosen license) stated plainly.

**Copy note — the unreliability of stated vs revealed preferences:** this exact phrase is the anchor language (owner's design-research background; keep the terminology precise, not paraphrased). When the site introduces the history scan inside `/scout setup`, the messaging leans on it directly: stated preferences (what you'd answer in an onboarding interview) are unreliable; revealed preferences (what your repos show you did, repeatedly) are the ground truth. **Scout reads tracks, not answers** — "tracks" survives here as the concept name even though the command is the plainer `setup`. Candidate copy direction: "Scout doesn't ask what you would do. It reads what you did." This is both a product truth and a differentiator against onboarding-questionnaire tools; it also explains *why* Scout has no setup interview, turning an absence into a position.

### Beat 4.5 — The tracks prompt (featured, not buried)

A second copyable block on the landing page, given near-equal visual weight to the install command: a portable prompt the visitor copies into their own Claude/Codex session — *before installing anything* — that surfaces the libraries, tools, and practices recurring across their own history. Deliberately scoped to revealed tooling behavior, never personality assessment.

Why it's featured on the page rather than in docs:

- **It's a zero-install demo of the product's core idea.** The visitor experiences "revealed preferences" on their own data in their own sandbox, sees a list that is unmistakably *theirs*, and now understands exactly what Scout does — conversion follows comprehension.
- **It's the privacy architecture made visible — the courier pattern** (Scout PRD §7.3). The flow itself is the trust story: the prompt runs in the user's session (Scout can't see it), the output is read privately, and the user chooses what to carry into `/scout setup`. Consent isn't a checkbox — it's the physical shape of the flow. Contrast (implicitly, never named) with viral "let AI psychoanalyze your whole history" patterns where the app is the reader and the user is the subject.
- **It's inherently shareable.** A copyable prompt block is the kind of thing people screenshot and post; each share carries the product's thesis with it.

Page mechanics: copy button, one line of instruction ("paste into any Claude or Codex chat"), one line on what comes back, and the handoff line ("bring what rings true into `/scout setup` — leave the rest"). The two copy-blocks on the page make a deliberate pair: *meet your taste* (this) and *install Scout* (Beat 5).

### Beat 5 — Install + tiers, then footer

- Repeat the install one-liner (visitors who scrolled are warmer now).
- Compact tier table, synced with Scout PRD §5.0: **Tier 0** plugin (full Scout, ~60 seconds, zero config, zero keys) · **Tier 1** point your pack at a git remote (cross-machine sync, free Pages browse page) · **Tier 2** optional self-hosted connector for claude.ai accounts / add-from-anywhere URL. Framing: tiers are *depth*, not paywalls — everything is free and open source, and Tier 0 is the whole product.
- Works-with row: Claude Code (manifest + reports) · any AGENTS.md-aware agent (manifest).
- Footer: GitHub, docs, **example packs** — Nick's pack (the nine entries that shaped Scout) plus volunteered others, framed explicitly as "packs are personal; here's what some look like." Never "starter packs," never pre-installed: Scout ships empty, and the gallery exists to show range, not to seed defaults. Credit line acknowledging prior art (emilkowalski/skills, mattpocock/skills) — generous attribution is both correct and strategically smart in this community.

## 4. What the site is NOT

- Not a docs site. Docs live in the repo / a docs subpath; the marketing page links out. One page, one job.
- Not a waitlist or email-capture funnel. No newsletter modal, no gating. The product is `git clone`-able; the site should feel as ungated as the code.
- Not a feature matrix. Scout's surface area is deliberately tiny (seven plain-English verbs); listing features exhaustively would undermine the restraint story. The philosophy section carries differentiation.
- Not a pack chart. No ranked packs, no "most popular," no editorial "best of" — curation of packs is counter to the entire narrative (taste is personal; ranking recreates the homogenization Scout exists to prevent). If community discovery emerges, it lives in a flat, unranked, community-owned directory that the site may *link to*, never host or order.
- Not animated for animation's sake. Emil's gate applies to this site's own motion: the Beat 2 demo is the delight budget; everything else stays quiet. The site must embody the restraint it advertises.

## 5. Brand & visual direction

- **Register:** expedition field guide. Topographic-line motifs, waypoint marks, a restrained badge/stamp system for the lexicon nouns. Warm and analog-leaning against the default dark-terminal aesthetic of dev tools — differentiation through warmth, which also serves the tertiary audience.
- **Palette territory:** paper/cream base, forest and trail-marker accents, one high-contrast signal color reserved exclusively for reports (the surfaced-suggestion moment) — so the visual system itself teaches "this color = Scout found something."
- **Type:** a humanist grotesque for UI/body + a slightly characterful display face for the lexicon nouns. Monospace only inside terminal frames.
- **Illustration:** simple line-drawn pack/trail/waypoint iconography. No mascot in v1 (a scout character is an obvious move — park it; mascots are hard to un-ship).
- **Tone of voice:** plainspoken, dry, confident. Short sentences. The copy should pass both audiences: no jargon required to follow the story, no hand-holding that bores the primary audience. Concepts carry the brand ("the pack," "reports," "tracks"); commands stay plain (`start`, `survey`, `setup`) — the register doctrine, on the site exactly as in the product: **plain in, brand out.** The user speaks to Scout in plain English; Scout speaks back in-world. Scan narration and progress copy shown anywhere on the site should model this voice ("reading your tracks… gathering signals… assembling markers…") — evocative vocabulary lives where reading is free, never where recall is required.

## 6. Technical requirements

- **Stack:** static site, zero backend — the site's architecture should mirror the product's Tier 0 ethos. Astro or plain HTML/CSS with islands for the demo; no client framework unless the demo demands it.
- **Hosting:** GitHub Pages or Cloudflare Pages from the Scout monorepo (`/site`), deployed on push. The site being in the open-source repo is itself a signal.
- **Performance:** Lighthouse ≥ 95 across the board; the demo video lazy-loads; total page weight target < 1.5 MB including demo poster frame.
- **The demo asset** is the long-pole item: budget real time for scripting, recording, and polishing the Beat 2 session. Everything else on this site is a day's work; the demo is the product's trailer.
- **Live data:** GitHub star count via client-side fetch of the public API (no key needed at this scale); graceful fallback to a static number.
- **OG/social:** custom OG image per the brand system; the install one-liner should be legible in the OG card — screenshots of the card get shared as install instructions.
- **Analytics:** none, or a privacy-respecting counter (Plausible-class) at most. "No telemetry" in the product story extends to the site or the story rings hollow.
- **Patch renderer readiness (Later phase, §7):** when expedition patches ship, the site gains one route (`/patch`) that decodes a locally minted code **entirely client-side** and renders the collectible with OG treatment — no registry, no database, no request carrying user data. The static site stays static; the route is the courier pattern's public endpoint.

## 7. Launch scope & sequencing

| Phase | Scope |
|---|---|
| **v0 (with repo going public)** | Beats 1, 3, 5 live; Beat 2 as a polished static screenshot sequence if the recording isn't ready; philosophy section as three lines, not yet designed |
| **v1 (launch post / Show HN)** | Full six beats including the tracks prompt (4.5), real demo recording, OG assets, example-pack gallery |
| **Later** | Link to a community pack directory *if one emerges* — flat, unranked, community-owned; the site links, never hosts or orders (see §4). **Parked: expedition patches** — if the community pulls Scout toward the Boy Scout register, lean in with earned collectibles, executed at Any Distance Achievement Medal quality (ADA-winning "elegant in-app collectibles"): premium rendered patches, minted locally (no server, consistent with local-first), shared via the courier pattern — Scout generates a compact code encoding achievement type, date, optional display name, nothing else; user pastes it at the site's `/patch` route; client-side decode renders the shareable patch. **Forgeable by design:** patches are collectibles, not credentials — verification would mean a secret, which means a server, which unravels the thesis over a sticker. In-register as *expedition patches*, never merit badges. Critical design guardrail: patches reward **curation, not accumulation** — first supersession ("changed my mind"), a survey that finds nothing ("clean camp"), a season at or under the manifest cap — never "100 entries added." Rewarding volume would incentivize hoarding, the exact behavior the manifest cap exists to prevent. Also a natural physical-merch angle (real woven patches) if the community forms. |

## 8. Success criteria

- A first-time visitor can state what Scout does, unprompted, after the hero alone (test with 5 people, mixed technical levels — the barbecue test, formalized).
- Median time from landing → install command copied < 90 seconds (copy-button event, if any analytics exist).
- The tracks prompt gets copied at a meaningful fraction of the install command's rate — evidence the zero-install demo is pulling its conversion weight.
- The demo makes at least one viewer say some version of "oh, it just *shows up*?" — the zero-recall property landing emotionally is the whole game.
- The site never needs a redeploy when Scout's code updates — only when the story changes.

## 9. Open questions

1. **Domain + GitHub org.** `scout.dev`-class domains are likely taken/expensive; candidates to check: scout-pack.dev, packscout.dev, getscout.dev, usescout.dev, or a subdomain of a personal domain for v0. Cross-linked with Scout PRD Open Question #8: the org/repo/plugin-marketplace name ends up in every install command, so this **blocks Scout Phase 2**, not just the site launch. Resolve first.
2. **Name collision positioning** before launch: "Scout" is used by several dev tools (Docker Scout, Scout APM, AWS scout2). None are in the agent-tooling category, but the launch post should establish "Scout for [agents/Claude Code]" phrasing early to own the qualified term.
3. **License** — MIT vs Apache-2.0; affects the philosophy section copy.
4. **Hero headline** — test the three directions in Beat 1 (problem-led vs motto-led) with real people before launch.
5. **Demo format** — real Asciinema-style recording vs hand-built animated recreation. Recreation is more controllable and on-brand but costs more; recording is authentic but hard to art-direct.
6. **The tracks prompt itself** is a launch asset that needs real drafting and testing — it must produce compelling, obviously-personal output across different users' histories, and its scoping (tooling behavior, never personality) must hold under varied phrasings. Treat it like the demo: a small artifact with outsized conversion weight.
