# Copy Deck — Scout Marketing Site

**Status:** Draft v1 (PRD-derived). A dedicated copywriting polish pass happens before v1 launch. Builders: use this copy **verbatim** — do not paraphrase, "improve," or add copy. Voice: plainspoken, dry, confident, short sentences (PRD §5).

Concepts get the brand register (the pack, reports, tracks, the manifest); commands stay plain (`add`, `start`, `review`, `setup`). **Command rendering (synced from Scout engineering D-007, 2026-07-18):** real commands are colon-namespaced — `/scout:add`, not `/scout add` — because the plugin platform namespaces them that way. The site always renders the real command.

**Verb slate (LOCKED, Scout PRD v0.4 / site PRD v0.3):** `add, archive, list, start, explain, survey, setup`. `review` was renamed `survey` in plugin v0.3.0 — never use "review" as a command anywhere.

**Register doctrine — "plain in, brand out" (site PRD §5, now doctrine):** the user speaks to Scout in plain English (commands cost recall → universal names); Scout speaks back in-world (narration/output cost nothing to read → carry the brand). Sanctioned voice vocabulary: *signals* (what the scan detects), *markers* (what it proposes, evidence attached), expedition narration ("reading your tracks… gathering signals… surveying past projects"). Any Scout narration shown on the site (demo output, scan progress copy) should model this voice. Warm, not twee, not military. Nothing in the voice vocabulary is ever required typing.

**Positioning guardrail (Scout PRD tenet 7 — "write-deliberate, read-ambient"):** never market a "search your pack" or "ask Scout what to use" workflow. Reports arrive unbidden; survey is a backstop, not a workflow. "The day someone needs a 'use my pack' command, zero-recall has failed."

**Positioning guardrails (from the positioning canvas — `docs/scout-positioning.md`, 2026-07-19):**
1. **Never market team-policy enforcement.** Steps are personal rituals, not org standards — "your team's practices, enforced" is a different buyer and a different product. Don't court it.
2. **Never market recommendations or curation.** Scout ships empty; taste in, taste out. No "best libraries," no "we suggest," no starter anything.
3. **Metaphor on the site, category on comparison surfaces.** "A pack your agent carries" is the site's language. Where a stranger is comparing (repo README, plugin directory listing, OG description, launch post, HN title), lead with the category anchor: *memory for your coding agent's taste — what you meant to use, not what you said.* Canonical strings live in the final section of this deck.

`{{INSTALL_COMMAND}}`, `{{GITHUB_URL}}`, `{{DOCS_URL}}` come from `src/config.ts` — never hardcode.

---

## Beat 1 — Hero

**Headline** (variant behind config switch; A is default):
- A (default): You keep finding great libraries. Then you forget they exist.
- B: Your bookmarks are where good libraries go to die.
- C: Be prepared.

*Variant note (positioning canvas, 2026-07-19):* B names the alternative's category — leading with "bookmarks" risks filing Scout as a bookmark manager, an explicit PRD non-goal. Recommendation for the §9 Q4 real-people test: run A vs C, and retire B unless it decisively wins. C only works because the subhead carries the category weight.

**Subhead:** Scout is a pack your coding agent carries. Drop links in — Scout hands them back at the exact moment they apply.

**Install block:** `{{INSTALL_COMMAND}}` in a CopyBlock. The command IS the CTA — no "Get Started" button anywhere.
**Under the block:** Free and open source. No server, no account, no API key.
**Secondary CTA:** GitHub link + live star count (StarCount island).

## Beat 2 — The moment

**Section heading:** The moment it pays off.
**One line above the demo:** You never search. You never remember. It just shows up.
Demo content: see `docs/demo-script.md`. No other copy in this section.

## Beat 3 — How it works

**Section heading:** The loop.

1. **Pack it** — `/scout:add` a URL from anywhere. Scout reads it, drafts the entry, and files it with the conditions where it applies.
2. **The manifest** — `/scout:start` on a new project writes a compact packing list into your agent's context. Capped small on purpose: a pack you can't carry is a pack you don't bring.
3. **Reports** — While you build, matches that survive Scout's gate surface as compact reports. Ignore them freely — Scout learns from that too. *(2026-07-20: "one-line" → "compact" per Nick — the real planning-moment report is a small card; suggest the same softening in the PRD's next revision.)*
4. **Survey** — Before you ship, `/scout:survey` walks the whole project for anything you missed.

**Rituals line (one sentence, quiet placement below the four steps):** Scout also carries your project rituals — changelog, decision log, how you build big features — so every project starts the same way.

## Beat 4 — The philosophy

**Section heading:** Three things Scout believes.

1. **Zero recall.** If you have to remember to use it, it's already failed. Nothing in Scout requires remembering — not a command, not a keyword, not that it exists.
2. **Restraint.** Scout expects to say nothing most of the time. Suggestions pass a gate; rejections are logged; two per moment, max. The whole manifest is capped at 25 lines — smaller than most CLAUDE.md files. "Nothing surfaced" is a good result.
3. **Your pack, your files.** Entries live in a plain folder you own — file over app. Scout's code updates via plugin; your data never leaves your hands. Scout has no brain of its own: your agent does the thinking. No server, no account, no API key, ever.

**Trust line (small, below tenets):** Local-first. No telemetry. Ships empty — your pack is yours from entry one. MIT licensed.

**Tracks copy (bridges into Beat 4.5 — anchor terminology is exact, per PRD copy note; do not paraphrase "stated/revealed preferences"):**
> Scout doesn't ask what you would do. It reads what you did.
> Stated preferences — what you'd answer in an onboarding interview — are unreliable. Revealed preferences — what your repos show you did, repeatedly — are the ground truth. Scout reads tracks, not answers. That's why there's no setup questionnaire.

*(Command references in this section and below use the real colon form: `/scout:setup`.)*

## Beat 4.5 — The tracks prompt

**Section heading:** Meet your taste.
**Lede:** Before you install anything: paste this into any Claude or Codex chat. It reads your own history — in your session, where Scout can't see — and hands back the libraries, tools, and habits that keep showing up in your work. A list that's unmistakably yours.
**The block:** CopyBlock containing `{{TRACKS_PROMPT}}` — **placeholder pending Scout core** (D-010). Placeholder text: `[Tracks prompt — supplied by Scout core before v1 launch]`. Build the block fully; content swap only.
**Handoff line (below block):** Bring what rings true into `/scout:setup` — leave the rest.

Design note: this block and the Beat 1/5 install block are a deliberate pair — near-equal visual weight (PRD Beat 4.5): *meet your taste* / *install Scout*.

## Beat 5 — Install + tiers

**Section heading:** Pack up.
**Install block:** `{{INSTALL_COMMAND}}` (same CopyBlock component).

**Tier table (framing line first):** Tiers are depth, not paywalls. Everything is free and open source — Tier 0 is the whole product.

| Tier | What | You get |
|---|---|---|
| **Tier 0** | The plugin | Full Scout. ~60 seconds. Zero config, zero keys. |
| **Tier 1** | Point your pack at a git remote | Cross-machine sync. A free Pages page to browse your pack. |
| **Tier 2** | Optional self-hosted connector | claude.ai accounts. Add-from-anywhere URL. |

**Works-with row:** Claude Code — manifest + reports · Any AGENTS.md-aware agent — manifest.

**Router callout (D-016, final):** quiet one-liner below the works-with row, small/muted: Prefer `/scout add` without the colon? An optional [router skill]({{GITHUB_URL}}/blob/main/docs/router.md) gets you there — one extra step. — Colon form stays primary everywhere; the callout never appears in screenshots or the demo.

## Footer

- GitHub · Docs · Example packs
- **Example packs framing (exact):** Packs are personal — here's what some look like. *(Nick's pack — the nine entries that shaped Scout — plus volunteered others. Never "starter packs." Scout ships empty.)* Gallery content TBD from Nick; build the list structure with Nick's pack as the first slot.
- **Credit line:** Built on ideas from emilkowalski/skills and mattpocock/skills — generous prior art, generously acknowledged.
- **License:** MIT.
- **Analytics disclosure:** This site counts pageviews with GoatCounter — open source, cookieless, no personal data. Scout itself phones home to no one.

## Off-site comparison surfaces (canonical strings — handoff to Scout core)

These strings are owned here but live in the *scout* repo and launch assets. Per the positioning canvas (`docs/scout-positioning.md`): the site leads with the pack metaphor; surfaces where a stranger is *comparing* lead with the category anchor. Hand these to the engineering thread verbatim. Use these exactly; edit here first, everywhere else second.

**Category anchor (the load-bearing phrase):**
> Memory for your coding agent's taste — what you meant to use, not what you said.

**Meta/OG description (shipped in `src/config.ts` — keep in sync):**
> Memory for your coding agent's taste. Save a link once — Scout hands it to your agent at the exact moment it applies. No server, no account, no API key. Free and open source.

**First-mention qualifier (PRD §9 Q2, own the qualified term):** "Scout for Claude Code" / "Scout for agents" on first mention in launch post and comments.

**Insight line (pitch spine — already load-bearing on the site as the Beat 2 lede):** You never search. You never remember. It just shows up.

**Scout repo README, opening line:**
> Scout is memory for your coding agent's taste — the libraries, tools, and practices you meant to use, resurfaced at the exact moment they apply. No server, no account, no API key. Your agent does the thinking; your files hold the data.

**Plugin directory / marketplace description (short form):**
> Memory for your coding agent's taste. Save a link once — it comes back exactly when a project needs it. Local-first, zero keys, ships empty.

**Show HN title (≤80 chars):**
> Show HN: Scout – memory for your coding agent's taste, not its transcripts

**"Isn't this just…?" (README/FAQ section — grouped by approach, no products named in prepared copy; name specific tools only if a commenter names them first):**

> **Isn't this a memory plugin?** Memory plugins remember what you *said* — session transcripts, compressed and recalled. Scout remembers what you meant to *use*. Different job: no database, no daemon, no recall-everything. A capped, curated manifest of your own tools, plus reports at planning moments. Nothing else.
>
> **Isn't this a knowledge base with extra steps?** Knowledge stores are pull-based: they work great right up until the step that always fails — remembering to ask. Scout is push-based and gated. The manifest is simply *in context*; reports arrive unbidden. You never query your pack, because the day you need to is the day it's failed.
>
> **Isn't this an awesome list?** An awesome list is someone else's taste, frozen. Scout ships empty and fills with yours — what your repos show you actually reach for, kept honest by archives and supersession. Two people's packs should never look alike.
>
> **Isn't this bookmarks?** Bookmarks are where this problem starts. Saving was never the failing step — resurfacing is.
