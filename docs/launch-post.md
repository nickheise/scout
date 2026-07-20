# Launch post — draft v0.1

**Status:** Draft for Nick's review. Built on the positioning canvas (`docs/scout-positioning.md`) per Dunford's pitch storyboard: insight → alternatives → perfect world → introduction → value → proof → objections → ask. Voice per the copy deck: plainspoken, dry, confident, short sentences.
**Launch gates (from DECISIONS.md D-004/D-015):** the scout repo is not public yet; `/scout:setup` lands with Phase 4. Do not publish before both clear.
**Working title (blog):** *Retrieval doesn't fix forgetting*
**Show HN title (canonical, copy deck):** Show HN: Scout – memory for your coding agent's taste, not its transcripts

---

## 1. The insight (open cold, no throat-clearing)

Every save-it-for-later system has the same failure point, and it isn't storage. Bookmarks hold. Stars hold. Notion holds. The step that fails is the one none of them own: *remembering to look, at the exact moment it matters.*

Psychologists call it prospective memory — remembering to remember — and it fails reliably, in humans and in models. You find a beautiful drag-and-drop library in March. In July you build a kanban board from scratch, and the library sits in your bookmarks the whole time. You didn't need better search. Search requires the one thing you didn't have: the thought to go looking.

Retrieval doesn't fix forgetting. A system where relevance arrives on its own does.

## 2. The problem, concretely

*(One short paragraph. The graveyard: libraries, effects, skills, practices — discovered continuously, forgotten at the moment of application. Retrofitting is expensive; the moment that matters is planning time. Same failure applies to practices: the changelog you keep on real projects and forget on side projects.)*

## 3. What people do instead — and why each one misses

*(The alternatives step, grouped by approach. No products named in the prepared text; name specific tools in comments only if a commenter names them first. Canonical short versions live in the copy deck's "Isn't this just…?" section — keep the two in sync.)*

- **Bookmarks and stars** — write-only. Saving was never the failing step; resurfacing is.
- **Memory plugins for your agent** — they remember what you *said*. Transcripts, compressed and recalled. Useful — but your taste isn't in your transcripts; it's in what you chose to save and what your repos show you reach for.
- **Pull-based knowledge stores (PKM, MCP servers)** — great right up until the step that always fails: someone — you or the model — has to remember to ask.
- **Awesome lists and starter packs** — someone else's taste, frozen. The homogenization machine: everyone who starts from the same defaults ships the same thing.

A perfect version would: hold *your* finds; live in *your* files; cost nothing to run; and put the right entry in front of your agent at planning time without anyone — human or model — remembering it exists. Right?

## 4. Introducing Scout

Scout is memory for your coding agent's taste — an open-source, local-first plugin. The mental model is a pack your agent carries: you drop links in; Scout hands them back at the exact moment they apply.

*(One tight paragraph on the loop, from copy deck Beat 3: `add` → the manifest via `start` → gated reports while you build → `survey` before you ship. Include the ~60-second install.)*

## 5. Value, in three parts

**What you found actually gets used.** *(The demo goes here — the March/July story resolved. The manifest is ambient; reports pass a gate; two per moment, max. Zero recall is the design constraint, not a feature: nothing in Scout requires remembering it exists.)*

**Nothing to trust but your own filesystem.** *(No server, no account, no API key, no database, no daemon. Your agent does the thinking; plain files hold the data. If Scout vanished tomorrow the pack remains readable. MIT.)*

**Every project starts like your best project.** *(Steps: changelog, decision log, your build rituals — carried across projects, executed at `start`. One paragraph, not more — this is the quiet theme.)*

## 6. Proof and restraint

*(The numbers that carry the trust story: the whole manifest is capped at 25 lines — smaller than most CLAUDE.md files. Rejections are logged. "Nothing surfaced" is a good result. Then the tracks prompt as zero-install proof: paste it into your own chat, watch your own revealed preferences come back. Stated preferences are unreliable; revealed preferences are the ground truth. Scout reads tracks, not answers.)*

## 7. Objections, preempted

- **"Another thing polluting my context."** The cap is the answer — 25 lines, hard, and compile refuses past it. A pack you can't carry is a pack you don't bring.
- **"AI recommending libraries = slop."** Scout recommends nothing. It ships empty. Everything it ever surfaces is something *you* saved or *your* history revealed. Taste in, taste out.
- **"Lock-in."** One folder of JSON and markdown you own. Delete Scout; keep the pack.
- **"Does it work outside Claude Code?"** The manifest layer works in any AGENTS.md-aware agent today; gated planning-time reports are Claude Code-first. Said plainly, no asterisks.

## 8. The ask

*(Install one-liner — the command is the CTA. Secondary: the tracks prompt for the not-yet-convinced. Link to Nick's example pack — "packs are personal; here's what one looks like." Credit emilkowalski/skills and mattpocock/skills as the prior art that shaped the gate and the user/model-invoked boundary.)*

---

## Comment-thread notes (not part of the post)

- If a commenter names a specific memory plugin: acknowledge it generously, state the square difference in one line (transcripts vs. taste), never compete on transcript memory.
- If asked "why not embeddings/vector search": at personal-pack scale the whole index fits in context; judgment beats cosine similarity for "does this feature genuinely benefit." North of ~500 entries you'd want vectors — the cap philosophy says you should never get there.
- If asked about telemetry: none, and the site's own analytics are a cookieless open-source counter, disclosed in the footer.
- The stated-vs-revealed-preferences framing is anchor language — use it verbatim, never paraphrased.
