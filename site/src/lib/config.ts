/**
 * Site-wide config constant (PLAN.md §1, D-004).
 *
 * Every consumer imports SITE from here — never hardcode org/repo/domain/
 * install command/star counts anywhere else. When the real name lands
 * (D-004), the swap is a one-file edit.
 *
 * All values below are PLACEHOLDERS and read clearly as such.
 */

export type HeroVariant = "A" | "B" | "C";

export interface SiteConfig {
  /** GitHub org / user that owns the repo. Placeholder pending D-004. */
  orgName: string;
  /** Repo name. Placeholder pending D-004. */
  repoName: string;
  /** Full GitHub repo URL, derived from orgName/repoName. */
  githubUrl: string;
  /** Docs URL (the one-line docs page per PRD §4). */
  docsUrl: string;
  /** Production domain. Placeholder pending D-004. */
  domain: string;
  /** The install one-liner — the CTA (PRD Beat 1). */
  installCommand: string;
  /** Build-time static fallback for the GitHub star count (StarCount island). null until first build bakes a real number in. */
  starFallback: number | null;
  /** Hero headline variant (D-006). "A" is the default per copy-deck.md. */
  heroVariant: HeroVariant;
  /**
   * Beat 4.5 courier-prompt text. Owned by Scout core (D-010) and mirrored
   * here from `docs/courier-prompt.md` — that file is the source of truth.
   * "Courier prompt" is the only name for this artifact; the site previously
   * minted a competing "tracks prompt", now retired.
   */
  courierPrompt: string;
  /** <title> — placeholder pending D-004 name swap + copywriting pass. */
  siteTitle: string;
  /**
   * <meta name="description"> / OG description. A comparison surface per the
   * positioning canvas (docs/scout-positioning.md): leads with the category
   * anchor, not the pack metaphor.
   */
  siteDescription: string;
  /**
   * GoatCounter site code (the `<code>` in https://<code>.goatcounter.com).
   * null = analytics OFF: no script is injected and the footer's analytics
   * disclosure line does not render (the disclosure must never ship while
   * analytics aren't real). Nick creates the GoatCounter account and drops
   * the site code in here to turn both on together.
   */
  goatcounter: string | null;
}

export const SITE: SiteConfig = {
  // Settled by Scout engineering (their D-007 sync, 2026-07-19): repo home is
  // Nick's personal account, repo acts as its own single-plugin marketplace.
  orgName: "nickheise",
  repoName: "scout",
  githubUrl: "https://github.com/nickheise/scout",
  docsUrl: "https://github.com/nickheise/scout#readme",
  // Domain deferred by Nick (D-004/D-015 — scoutpack.dev recommendation stands).
  domain: "scout-placeholder.dev",
  // CONFIRMED by engineering 2026-07-19 (plugin v0.1.0, validated with
  // `claude plugin validate --strict`). LAUNCH GATE: repo is not public yet —
  // these links/commands 404 until engineering pings that it's live.
  installCommand:
    "/plugin marketplace add nickheise/scout\n/plugin install scout@nickheise",
  starFallback: null,
  heroVariant: "A",
  // Verbatim from Scout core's `docs/courier-prompt.md` (D-010 resolved:
  // shipped in Phase 4). Keep byte-identical to that file on every edit.
  courierPrompt: `Look back across my conversation history on this account and find tools,
libraries, frameworks, CLI utilities, or working practices that come up
repeatedly — things I've reached for, recommended, or spoken favorably
about in more than one separate conversation.

Strict scope — follow exactly:
- Only name the tool/library/practice itself and, in one clause, what it
  is or does.
- Do not summarize, quote, or describe the subject matter, project, or
  content of any conversation.
- Do not comment on my working style, personality, skill level, or habits
  as a person — this is an inventory of tooling, not an assessment of me.
- Exclude anything that appears in only a single conversation; I only want
  things that recur.
- Exclude anything that looks confidential, proprietary, or tied to a
  specific employer or client's internal systems.

Output format:
- One line per candidate, ranked by how often it recurs, most frequent
  first.
- Each line: \`<name> — <what it is, one clause> (~N conversations)\`
- No more than 7 lines total.
- If nothing clearly recurs, say so plainly in one sentence instead of
  padding the list with thin candidates.`,
  siteTitle: "Scout — memory for how you build, not what you said",
  siteDescription:
    "Memory for your coding agent's taste — the libraries you meant to use and the way you meant to work, resurfaced at the exact moment they apply. No server, no account, no API key. Free and open source.",
  goatcounter: null,
};
