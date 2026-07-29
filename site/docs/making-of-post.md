# The making of Scout: how a bookmarking problem became a memory architecture

**Status:** Draft for Nick's review. Companion piece to `launch-post.md` — that one pitches the product; this one tells the story of building it. Safe to publish alongside or shortly after launch, once the repo is public (same gate as the launch post).
**Suggested placement:** personal blog / dev.to, cross-posted or linked from the Show HN thread once it's live.

---

I keep a bad habit: I find a great UI library, a shader pack, a `/skill` someone open-sourced — bookmark it, feel good about it, and then forget it exists the exact moment I'm building the feature it was made for. Three months later I'm hand-rolling something DialKit already did better, because DialKit never crossed my mind while I was typing.

That's the whole problem. Not storage — storage is solved, has been for decades. The problem is a *trigger* that fires at the right moment without me remembering to ask for it. Psychologists have a name for this failure mode: prospective memory, remembering to remember, and it fails reliably in humans. Turns out it fails in models too, which is the detail that made this project worth building instead of just complaining about.

This is the story of how that complaint became Scout — a local-first Claude Code plugin that shipped five build phases, 223 passing tests, and a naming saga that took eight increasingly specific turns to resolve. It started as a two-day conversation before a single line of code existed, and the conversation is arguably the more interesting artifact.

## Turn 1: refusing to build a bookmark manager

The obvious framing — "AI-categorized bookmarks" — was the trap. Storing and analyzing links is the easy 20%. So the first move was reframing the ask: don't judge any design by how well it categorizes, judge it by how it solves the *retrieval trigger*. Index by situation, not by taxonomy — when you save a link, the useful metadata isn't "category: animation library," it's "surfaces when: building drag-and-drop, kanban boards, sortable lists." You have leisure to write that at save time; you have none of it at the moment you actually need it.

Four architectures got laid on the table: an MCP tool the model is told to call proactively (works maybe 60% of the time — an intermittent tool trains you to stop trusting it); a compiled ambient index injected into every project's context (zero misses, but doesn't scale past ~30 entries); a hook that semantically matches on every prompt (robust, but a precision problem — cry wolf once too often and the whole system gets ignored); and a plan-time gate, which turned out to be the sharpest version of the hook idea, because a feature plan is far richer matching material than a raw prompt.

The answer that stuck was a hybrid: a small ambient block for the top ~25 things, a hook for the long tail, and a manual query tool as the escape hatch rather than the main event. Two failure modes got named early and never left the design: **staleness** (a stash silently rots — surfaced cards need to show their age) and **the ignore signal** (dismiss the same suggestion three times and the tool should take the hint, not nag forever).

## The portability constraint that decided the architecture

Round two added a constraint that, in hindsight, picked the entire shape of the system: it had to work across a work account, a personal account, and whatever tool was open — which ruled out anything living inside one app's memory or one machine's dotfiles. That's the moment the design became "a personal Git repo of plain files, with thin adapters into every environment" instead of "a service with an API." Git gives you history for free, which mattered more than it looked like at the time — "why did I stop using shadcn, and when?" needed to be an answerable question, not a lost one.

Three generated surfaces fell out of that store: a compiled ambient block for `CLAUDE.md`, an MCP server for the manual interface, and a static browse page. And archiving got specified as a real lifecycle rather than deletion — `active → archived`, with a `superseded_by` pointer, so that abandoning shadcn for something newer doesn't erase the record of having used it. That one decision — model the archive as history, not trash — turned out to be the seed of something bigger a few turns later.

## The moment the scope doubled on purpose

Turn 3 is a two-sentence message that quietly restructured the whole project: the stash — the link collection — should be *one module* inside a broader project-init service, not the whole thing. The other module: a runbook of standing practices. "Create a changelog," "capture screenshots at milestones," "log decisions as we go" — imperative steps executed at project start, as opposed to stash entries, which are conditional reference material surfaced only when context matches.

This is also where the project's most load-bearing design boundary got named: **user-invoked vs. model-invoked**. Some verbs are things you type; some behaviors are things the agent just does. Casual additions via slash command get *drafted, not committed* — the service proposes an entry, you get a yes/no, nothing lands in your permanent record on a whim. That boundary is the reason the tool never feels like it's making unilateral decisions about your own taste.

## Drafting the schema against real links, and having it break immediately

Rather than design a schema in the abstract, the fourth turn ran it against three real links — shadcn/ui, Paper Shaders, and DialKit — plus three real runbook habits. The links behaved. The runbook habits didn't: "create a changelog," "capture screenshots," and "log decisions" all turned out to be *standing practices*, not one-shot init steps. None of them fit a schema built around "things you execute once at project start."

That forced a `phase` field with four values — `init`, `ongoing`, `milestone`, `wrap` — and a more interesting consequence: "running the runbook" doesn't just execute steps, it can *write standing instructions into `CLAUDE.md`* for the ongoing ones, so the agent itself remembers to maintain the decision log without anyone remembering to ask. Same zero-recall property, achieved by a different mechanism. This is the kind of thing you only find by testing a schema against messy real examples instead of clean hypothetical ones.

## The naming saga

Here's the part of the transcript that reads less like a spec session and more like a genuinely fun argument, and it deserves its own section because it took eight rounds to land and every round taught something.

**Roadie** was the first real candidate — the metaphor covers the whole lifecycle (sets up before the show, hands you gear mid-set, knows your rig), and it survived the "type it ten times" test. Then the ask changed: something closer to "agent kit," but not Vercel's AgentKit, and not grand. That produced **Sidekit** (sidekick + kit, one word, both readings correct), **Gokit**, and — because of who was asking — **Kitbash**, the concept-art term for remixing parts from multiple kits into something new.

Then came **Sherpa**, which nails the sentiment (guide and porter in one word) but got talked out of for two compounding reasons: it's one of the most overused metaphors in tech naming, and — more substantively — it's not a job title, it's an ethnic group, and the generic tech usage has drawn real criticism for reducing that to a load-carrying-assistant metaphor. Worth knowing before you ship it in a command name, not after.

Sherpa's *shape* — a person who helps, not an object you carry — was the right instinct, and splitting the sentiment cleanly in two produced **Scout**: someone who goes ahead and reports back what's useful before you arrive, which is a tighter metaphor for ambient surfacing than guiding ever was. Five letters, reads like an order (`/scout add`, `/scout run`), zero explanation needed at any technical level. The decision came down to something almost embarrassingly practical in the end: keyboard ergonomics. Scout alternates hands cleanly across the keyboard; the runner-up made your right hand do all the work. The name you don't hesitate to type is the one you'll actually use.

The stash itself got renamed too, a few turns later, once the register question ("boy scout or military scout?") got resolved as neither — a wilderness/expedition scout, the shared ancestor of both. In that frame, "stash" was a verb wearing a noun's clothes; **pack** is what a scout literally carries, and it closes the loop the old name left open — stash never said where things came *back* from, pack does both ends. The compiled ambient index became the **manifest** as a bonus, a genuine double meaning: a packing manifest and an established software term, in the same word.

Even the verb slate went through real scrutiny. `tracks` — a history-scan command — got killed entirely once its owner pointed out he'd never voluntarily type something that felt that awkward, and the scan quietly moved inside onboarding instead, where a once-per-user action belongs. `review` got renamed to `survey` late, specifically to kill the gravitational pull toward "code review." And a late correction landed a real naming principle: *frequency determines register.* Commands you type often need to be boringly guessable. Commands you type once can afford to be clever. Everything evocative that didn't survive as a verb — *signals*, *markers*, *gathering*, *reading tracks* — didn't get thrown away, it got reassigned to how Scout *narrates itself*, which is where flavor is free and forgettability is cheap.

## The stress test: what "open source" quietly changes

Before any code existed, the plan was stress-tested against a single question: would a stranger on Hacker News get past the install step? The answer split the architecture into what a *personal* tool needs versus what an *OSS* tool needs, and the gap was bigger than expected.

The original design assumed a hosted worker, a database, a bearer token, a cron job — a Saturday's work for the person who built it, and the exact point where 90% of an OSS funnel dies for everyone else. The fix wasn't a smaller feature set, it was inverting a default: **plugin-first, server-optional.** The store becomes a local directory. The MCP server speaks stdio instead of remote HTTP, which deletes auth as a concept entirely. And the biggest simplification came from a genuinely reframing observation — Scout doesn't need its own intelligence, because it's already running inside an agent that has some. Ingestion, matching, compiling — all of it is choreography over an LLM the user is already paying for, not a service that needs its own API key. Embeddings got cut too, for the same reason vector databases usually get cut from small personal tools: a pack is 30–150 entries, the whole matching index is a few thousand tokens, and handing that to an LLM's judgment beats cosine similarity at answering "does this feature genuinely benefit."

## The shadcn problem, and why Scout ships empty

One question mid-project reframed the whole product: if a bookmarking-and-practices tool has *taste* baked into it, doesn't every user of the tool converge on the same taste? shadcn faced exactly this — the whole design was "copy the code into your repo so you can diverge," and homogenization happened anyway, because defaults are sticky and almost nobody customizes an escape hatch they were never forced to look at.

The fix wasn't a customization layer — shadcn already had one, and it didn't work. The fix was structural: **never ship content, only structure.** Scout ships with zero seed entries. What would've been "the 25 best libraries" became one person's example pack instead — published, forkable, cherry-pickable, never pre-installed. Two people's packs diverging isn't a bug to patch, it's the system working as designed.

That single decision turned an incidental feature — "let me archive suggestions I don't want anymore" — into the actual thesis. A pack, including its archive and supersession chains, *is* a taste fingerprint. Scout doesn't build a recommendation engine on top of that; it just stays out of the way of it.

## Cold start, without an interview

Shipping empty creates an obvious problem: day one, an empty pack does nothing. The first fix on the table was a preference interview — and it got argued down for a reason worth remembering any time you're tempted to ask users what they want: **stated preference is famously unreliable, and the questions themselves encode a menu.** An interview about "what libraries do you like" leads the witness before it learns anything.

The fix that survived: scan your own filesystem for repeated behavior instead of asking. Recurring dependencies across your `package.json` files, practice files that keep appearing across repos, scripts you write from scratch in every project — a scan for *revealed* preference rather than stated preference, evidence-attached ("found in 4 of 6 repos, here's the paths"), proposed and never auto-committed. This became `/scout:setup`'s history scan, and it's the mechanism behind the phrase this project kept coming back to as its own kind of anchor: **the unreliability of stated versus revealed preferences.**

There's a genuinely clever privacy move bolted onto this. Instead of Scout ever touching your chat history, the site ships a copyable prompt you run yourself, in your own session, on your own machine — a sandbox Scout can't see into. You read what comes back, and *you* decide what gets pasted into the scan. Scout never ingests anything; the user is the courier of their own data, with a review checkpoint built into the physical shape of the flow rather than a checkbox promising one.

## Two strangers, building the same thing

Partway through, two existing projects got pulled in as reference material — Emil Kowalski's `find-animation-opportunities` skill and Matt Pocock's skills repo — not because they changed direction, but because they'd independently converged on the same two ideas this project had arrived at on its own: restraint-first surfacing (a hard cap, a rejection ledger, a gate every candidate has to answer before it's allowed to surface) and the user-invoked/model-invoked split as a first-class design boundary, not an afterthought.

That convergence prompted an honest question worth asking about any project before you sink weeks into it: does this actually deserve to exist as its own thing, or should you just adopt what already works? The answer, argued out loud rather than assumed: the two reference repos are *content* — hand-authored expertise frozen at commit time. This project is *infrastructure* — capture from a URL, a lifecycle that ages and re-verifies, matching against whatever's in the collection this month. You can't be a competitor to the shelf you sit on; both reference repos ended up as seed entries in the very tool they helped shape.

## From PRD to code

By the time the PRD hit v0.4, the naming was locked, the verb slate was final, and the questions left in the document had changed character — early drafts argued architecture, the last one argued only thresholds and calibrations (how many repeats trigger a nudge, what the manifest cap should be). That shift is usually the tell that a design has stopped moving and it's time to build.

The build ran as five phases, each one an agent team — a dedicated orchestrator, a reviewer, and several builders with models assigned per task — with every phase closing out an adversarial review before it counted as done. That discipline paid for itself immediately: Phase 1's review caught a path-traversal vulnerability via a crafted entry ID and a schema hole in type discrimination, before either shipped. Phase 3's reviewer hand-walked a full scenario — an animated background feature, watching Paper Shaders surface correctly and a keyword match get logged to the rejection ledger — rather than trusting the code in isolation. The test suite grew alongside the phases: 105, then 153, then 193, then 223 tests, all green, plus a strict plugin-manifest validation pass.

Along the way, a live platform check overturned an assumption baked into the PRD from day one: plugin commands can never be a bare `/scout`, they're always namespaced as `/scout:add`. Rather than force a workaround, the fix became a second, optional artifact — a tiny logic-free personal router skill that gives you the bare form if you want it, sitting alongside the plugin rather than replacing it. And a research thread late in the process corrected an assumption in the other direction: there was never a first-come race for the plugin name in Anthropic's official directory — that directory has no submission process at all. The only real listing path is a community marketplace where the name was already taken by an unrelated project, and rather than split the command surface across two different install sources under two different names, the call was to skip that listing entirely. Not every open question resolves toward more; some resolve toward walking a false urgency back.

## Where it landed

By the time the fifth phase shipped, the plugin had reached v0.4.0: a local-first Claude Code plugin with seven verbs (`add`, `archive`, `list`, `start`, `explain`, `survey`, `setup`), a manifest capped at 25 lines by design — smaller, deliberately, than most `CLAUDE.md` files — a planning-moment hook that surfaces matches at the exact point a feature gets planned, and a zero-build static browse page that reads the pack's plain JSON files directly, in keeping with the file-over-app principle that shaped the whole architecture: if the tool vanished tomorrow, the pack would still just be files on disk.

The marketing site ran as its own parallel track from day one — its own PRD, its own decision log, its own build — and only merged into the main repository once the core product had shipped enough real output for the site's demo to be reconciled against reality instead of an art-directed guess. That reconciliation is a small, honest detail: the demo originally showed an imagined report card; once real captures existed, the demo got rebuilt to match what the tool actually does, not what it was supposed to do.

And then, once everything shipped, the project turned its own scrutiny inward. A token-cost audit measured exactly what the tool costs to run silently — the expensive, invisible case being a planning moment that finds nothing to surface, which is the tool's designed-common outcome. Those measurements got frozen as CI-gated budgets: growth in what gets injected into context now requires a deliberate, reviewable line in the same diff that causes it, rather than silently drifting upward one skill at a time. A second pass ran the plugin's own skills against an external checklist for well-built agent skills, and came back with restructuring proposals rather than a clean bill of health — held for review before anything gets cut, on the theory that you don't refactor a shipped tool's guts without live usage data telling you where the weight actually is.

## The part that's easy to miss

Here's the detail that makes this story mean something beyond "here's how we built a plugin": this project's own runbook — the one born in turn 3, the one that says "keep a changelog, log your decisions from day one, plan before you build" — is the same discipline that produced the two documents this entire post was reconstructed from. Every naming argument, every reversed assumption, every "actually, wait" is in `DECISIONS.md` and `CHANGELOG.md` because the tool insists that projects keep exactly that record, and its own build was the first project it was ever run against.

It started as a complaint about forgetting a link existed. It ended up as an argument for writing everything down as you go, structural enough that a project's whole history can be reconstructed months later — including the parts where the design was wrong, and got corrected in the open.
