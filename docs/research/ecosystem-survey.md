# Ecosystem survey (mid-2026) — researched 2026-07-18

12 web searches + 8 primary fetches. Condensed; ⚠ = search-verified only.

## Key takeaways

1. **Nothing occupies Scout's exact square.** Memory tools (claude-mem
   ~87.8k★, Mem0) do session-transcript recall; PKM tools (Basic Memory,
   Karakeep, Pieces) are general knowledge, pull-based via MCP;
   compound-engineering captures practices but manually and repo-locked.
   Curated cross-project link/tool/practice pack + compiled ambient manifest
   is an open niche — awesome-claude-code has **no category** for it.
2. **The manifest architecture is independently validated**: Mem0 injects a
   "decision rubric" at session start and lets the agent decide when to
   search; a dev.to self-updating-KB post uses SessionStart index injection.
   The ~25-line budget sits well under the community's 50–60-line CLAUDE.md
   norm (alexop.dev; HumanLayer) — quotable positioning.
3. **Hook discipline to copy** (dev.to KB post, the closest single prior
   art): hooks must be cheap (grep, no LLM call), lean (titles + one line,
   never whole files), non-blocking; recursion guards so spawned instances
   don't re-trigger; capture enqueued at SessionEnd, processed next
   SessionStart (synchronous Stop-hook capture degraded UX).
4. **Distribution playbook:** public marketplace repo (auto-indexed daily by
   claudemarketplaces.com — 23k+ skills, so the README must differentiate
   sharply) → anthropics/claude-plugins-community → official directory
   (immutable slugs; quality bar). Consider a skills.sh-format variant.
   Submit to hesreallyhim/awesome-claude-code at launch.
5. **Avoid:** databases/daemons (Karakeep, Pieces, claude-mem's
   SQLite+Chroma), cloud metering (Mem0), capture-everything noise, manual
   capture verbs as the primary loop, more than ~one skill's context
   footprint (viral "more skills makes Claude Code dumber" thread —
   x.com/PrajwalTomar_/status/2075149712492212376 ⚠), and injecting anything
   while disabled (open bugs; users are burned already).

## Notable neighbors

- **claude-mem** — github.com/thedotmack/claude-mem — hooks capture + AI
  compression + SQLite/Chroma + SessionStart injection. Copy its progressive
  disclosure with visible token costs (index → timeline → detail ≙ Scout's
  manifest line → summary → full JSON). Don't compete on transcript memory.
- **EveryInc/compound-engineering-plugin** — closest philosophical neighbor
  on the steps side (`/ce-compound` captures solved problems into
  `docs/solutions/`). Differentiators: Scout is ambient not manual, and
  cross-project not repo-locked.
- **Basic Memory** (basicmachines-co) — plain-markdown user-owned store via
  MCP; strongest file-over-app precedent; pull-based only.
- **cxpak** (via awesome-claude-code) — "token-budgeted annotated context
  bundles"; phrasing close to our manifest concept.
- **everything-claude-code** (affaan-m ⚠) — flagship dotfiles pack; note its
  documented constraint that plugins can't distribute CLAUDE.md rules —
  Scout's compile-into-CLAUDE.md is the workaround; make it explicit.
- **Anthropic skill-design guidance** — anthropic.com/engineering/equipping-
  agents-for-the-real-world-with-agent-skills: description = trigger surface;
  progressive disclosure; iterate from real trajectories.
- Staleness discourse (dani_avila7 ⚠): hand-written CLAUDE.md rots — Scout's
  *recompiled* manifest is the anti-staleness mechanism; say so in docs.
