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
  /** Beat 4.5 tracks prompt text — owned by Scout core (D-010). */
  tracksPrompt: string;
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
    "/plugin marketplace add nickheise/scout\n/plugin install scout@scout",
  starFallback: null,
  heroVariant: "A",
  tracksPrompt:
    "[Tracks prompt — supplied by Scout core before v1 launch]",
  siteTitle: "Scout — the pack your coding agent carries",
  siteDescription:
    "Memory for your coding agent's taste. Save a link once — Scout hands it to your agent at the exact moment it applies. No server, no account, no API key. Free and open source.",
  goatcounter: null,
};
