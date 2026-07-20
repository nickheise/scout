# Positioning Canvas — Scout

**Status:** Pre-launch positioning **thesis** (no ecstatic customers yet — Dunford's framework run against documented decisions, the ecosystem survey, and the seed-pack evidence). Revisit after the first 10–20 users who clearly love it; the real positioning emerges from whoever they turn out to be.
**Method:** April Dunford, *Obviously Awesome* 10-step process (brand-positioning-facilitator skill), 2026-07-19.
**Inputs:** Scout PRD v0.4, Scout DECISIONS.md (D-001–D-014), `docs/research/ecosystem-survey.md`, `docs/research/naming.md`, site PRD v0.3, site DECISIONS.md, copy deck v1.

**One-line description:** Scout is memory for your coding agent's *taste* — the libraries, tools, and practices you meant to use — resurfaced at the exact moment they apply. (The pack metaphor — "a pack your agent carries" — remains the brand expression of this; the category anchor above is for surfaces where comparison happens.)

## Market category

**Primary category:** Memory for coding agents (an understood category in mid-2026 — claude-mem at ~87.8k★ proves buyers recognize it and know what to expect from it).
**Subcategory:** Tool-and-practice memory, not transcript memory. Scout remembers what you meant to *use*, not what you *said*.
**Positioning style:** **Big Fish, Small Pond.** The memory category has a clear leader (claude-mem) that Scout cannot and should not out-execute at conversation recall ("don't compete on transcript memory" — ecosystem survey). The subsegment — curated cross-project tool/practice recall with ambient surfacing — is confirmed unoccupied ("nothing occupies Scout's exact square"; awesome-claude-code has no category for it).

**Why this category:** "Memory" triggers exactly the right core assumption — *it remembers so you don't have to* — which is the zero-recall promise verbatim. The one mismatched assumption ("does it remember my conversations?") is precisely the subsegment carve, answerable in one line. The rejected framings: "bookmark manager" (explicit PRD non-goal; triggers save-and-search assumptions — the pull model Scout exists to replace), "knowledge base / PKM" (pull-based assumptions, same problem), "new category: ambient tool packs" (Create-a-New-Game fails the audit — solo project, no runway for years of market education, and an existing category fits).

## Positioning baggage (surfaced, Step 3)

- **"Project init service"** — the product's original conception (the init thread's very title). Correctly demoted to one value theme; must not creep back into lead copy.
- **"Bookmarks"** — hero variant B ("Your bookmarks are where good libraries go to die") names the *alternative's* category; risk of being filed as a bookmark manager.
- The **pack metaphor** is beloved and earned, but a metaphor is not a category — it answers "what's it like?", not "what is it?" Both are needed, on different surfaces.

## Competitive alternatives

What the best-fit customer actually does today if Scout doesn't exist:

**Status quo (dominant in real life):**
- Browser bookmarks / GitHub stars / a Notion or Are.na page — write-only graveyards; nothing resurfaces.
- Memory + vibes — re-finding tools when a use case jogs recall; reliably fails (prospective memory is the failing step).
- Hand-written per-project CLAUDE.md files — the closest real behavior to a manifest; manual, forked per repo, rots (staleness discourse).

**Adjacent tools (the "isn't this just X?" clusters):**
- **Transcript-memory plugins** (claude-mem, Mem0) — remember what was *said* in sessions; DB + daemon architecture; recall-everything posture.
- **Pull-based PKM/MCP** (Basic Memory, Karakeep, Pieces) — general knowledge stores the agent *queries*; someone still has to remember to ask.
- **Repo-locked practice capture** (compound-engineering plugin) — manual verb, single-repo.
- **Curated lists / starter packs** (awesome lists, shipped defaults) — someone else's taste; the homogenization machine.

**Direct alternatives on real shortlists:** none yet — the square is open. The clusters above are what HN/Reddit will compare against, so they function as shortlist competitors at launch.

## Unique capabilities

- **Compiled ambient manifest, hard-capped (~25 lines), written into CLAUDE.md/AGENTS.md** — differentiates against pull-based PKM (no query needed; it's just *in context*), against hand-written CLAUDE.md (recompiled, never rots), and against recall-everything memory (capped, curated, quotably smaller than the community's 50–60-line CLAUDE.md norm).
- **Gated planning-moment reports (max 2, rejection ledger, "nothing surfaced is a good result")** — differentiates against every chatty injection system; restraint as architecture, not promise.
- **Zero infrastructure: agent-as-brain, plain files, no DB/daemon/embedding/API key/server/account** — differentiates against claude-mem (SQLite+Chroma), Mem0 (cloud metering), Karakeep/Pieces (services).
- **Revealed-preferences onboarding (setup's history scan + the courier prompt)** — differentiates against onboarding questionnaires and against shipped defaults; personal by construction.
- **Cross-project, with taste lifecycle (supersession chains, dismissal/recurrence symmetry)** — differentiates against repo-locked capture and static lists.
- **Ships empty; file-over-app** — differentiates against starter packs and lock-in.

## Value themes

**1. What you found actually gets used** *(dominant — the whole pitch)*
- Why it matters: the graveyard problem — libraries and tools discovered, saved, and never applied because remembering-at-the-right-moment is the step that fails. Scout closes the loop: saved once, surfaced at build time, adopted before retrofitting gets expensive.
- Enabled by: manifest + gated reports + survey backstop.
- Proof (pre-launch): the Beat 2 demo *is* the proof; the tracks prompt is self-administered proof on the visitor's own history; post-launch, "retroactive-application incidents avoided" stories.

**2. Nothing to trust but your own filesystem**
- Why it matters: adopting agent tooling normally costs a security/infra conversation. Scout costs nothing — no server, no account, no key, data never leaves your hands, MIT. Install in 60 seconds and lose nothing if you leave.
- Enabled by: agent-as-brain, file-over-app, tiers-as-depth, courier pattern.
- Proof: the architecture is inspectable; the courier prompt makes the privacy model *felt*.

**3. Every project starts like your best project**
- Why it matters: practices (changelog, decision log, build rituals) applied consistently without discipline; side projects get professional hygiene for free.
- Enabled by: step entries, start ritual, standing instructions.
- Deliberately quiet in v1 site copy (one sentence) to protect theme 1's clarity; gets its own beat in the launch post.

## Best-fit customers (thesis)

- **Who:** design engineers and AI-native developers who ship many small/side projects with coding agents (Claude Code primary), follow the emilkowalski/mattpocock skills scene, and maintain a running mental list of tasteful libraries they fully intend to use someday.
- **Behavioral:** start new repos monthly or faster; already hand-write CLAUDE.md files; save links compulsively; have felt the specific sting of finding the perfect library *after* building the worse version.
- **Technographic:** Claude Code + plugins/skills already installed; GitHub-native; taste-forward stack (shadcn-adjacent).
- **Situational:** solo or tiny-team, no infra appetite, HN/Reddit trust posture (local-first or bust).
- **Disqualifiers:** teams wanting enforced org standards (steps ≠ policy); people who want *recommendations* (Scout ships empty — taste in, taste out); developers who don't build with agents; hoarders who want unlimited storage surfaced (the cap will feel like a bug to them — it's the feature).

## Relevant trends (both genuinely reinforce — use, don't force)

- **Context-pollution backlash** ("more skills makes Claude Code dumber"; 50–60-line CLAUDE.md norm): the 25-line cap and the gate are the direct answer. Quotable.
- **AI-output homogenization anxiety** (everything converging on the same defaults): ships-empty + revealed preferences is the structural counter-position.

## The insight (pitch spine, per Sales Pitch)

> **Retrieval doesn't fix forgetting. Every save-it-for-later tool still depends on the one step that fails — remembering to look. The fix isn't better search; it's a system where relevance arrives on its own.**

Competitors can't echo it: pull-based tools would indict their own model; recall-everything memory would indict its noise. The site's existing "You never search. You never remember. It just shows up." is this insight compressed — keep it load-bearing. The secondary insight (stated vs revealed preferences) is already anchored verbatim in the copy deck and stays.

## Known weaknesses / testing expectations

- All of this is thesis. **Revisit after the first 10–20 ecstatic users.** Watch specifically: (a) are the ecstatic ones pack-led or steps-led? (theme order could flip); (b) does "memory" framing produce "so it logs my sessions?" confusion in the wild? (c) does the tertiary PM/design-lead audience actually convert, or is it dead weight in the copy?
- Proof is structurally thin pre-launch; the demo and tracks prompt carry it alone.
- "Memory for coding agents" as a named category is young; if the category label shifts under us (e.g., "agent context tools"), re-run Step 8 only.

**Last updated:** 2026-07-19
