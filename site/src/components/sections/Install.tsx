import { SectionHeading, SectionShell } from "@/components/blocks";
import { CopyBlock } from "@/components/islands/CopyBlock";
import { SITE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Install — Beat 5 ("Pack up"). Install one-liner, tier table, works-with
 * line, router-skill note. Copy is verbatim from
 * `_astro-legacy/src/sections/Install.astro` (P4 owns the actual sentences).
 *
 * Tone: default/white, per the assigned band rhythm (Footer owns sunken;
 * P3a owns the one dark chapter).
 */

interface Tier {
  tier: string;
  what: string;
  youGet: string;
}

const TIERS: Tier[] = [
  {
    tier: "Tier 0",
    what: "The plugin",
    youGet: "Full Scout. ~60 seconds. Zero config, zero keys.",
  },
  {
    tier: "Tier 1",
    what: "Point your pack at a git remote",
    youGet: "Cross-machine sync. A free Pages page to browse your pack.",
  },
  {
    tier: "Tier 2",
    what: "Optional self-hosted connector",
    youGet: "claude.ai accounts. Add-from-anywhere URL.",
  },
];

/**
 * TierTable — a real `<table>` (proper `scope` on both column and row
 * headers) that becomes a stack of labeled cards below `sm`.
 *
 * The kit's block library has no table pattern (BUILD-CONTRACT.md §3), so
 * this borrows only the system's own tokens: `rounded-card`,
 * `shadow-tone-card`, `border-tone-border`, the `gap-*`/`p-*` spacing scale.
 * Below `sm` each `<tr>` becomes a flex column (a card-shaped stack) instead
 * of a table row, and each `<td>` gets a small inline repeat of its column's
 * header text so the value is still legible without the header row — the
 * `<thead>` itself stays mounted (`sr-only`) so screen-reader users get the
 * same "Tier / What / You get" structure at every width. This keeps the
 * table "genuinely tabular" (same element, same scopes, same reading order)
 * while never forcing horizontal scroll at 390px.
 */
function TierTable() {
  return (
    <div className="overflow-hidden rounded-card border border-tone-border bg-tone-surface shadow-tone-card">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">
          Scout&rsquo;s three tiers: what each one is, and what you get.
        </caption>
        <thead className="sr-only sm:not-sr-only">
          <tr className="sm:border-b sm:border-tone-border">
            <th
              scope="col"
              className="sm:px-4 sm:py-3 sm:font-medium sm:text-tone-fg"
            >
              Tier
            </th>
            <th
              scope="col"
              className="sm:px-4 sm:py-3 sm:font-medium sm:text-tone-fg"
            >
              What
            </th>
            <th
              scope="col"
              className="sm:px-4 sm:py-3 sm:font-medium sm:text-tone-fg"
            >
              You get
            </th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((row, i) => (
            <tr
              key={row.tier}
              className={cn(
                "flex flex-col gap-2 p-4 sm:table-row sm:gap-0 sm:p-0",
                i < TIERS.length - 1 && "border-b border-tone-border",
              )}
            >
              <th
                scope="row"
                className="text-left text-base font-semibold text-tone-fg sm:table-cell sm:px-4 sm:py-3 sm:text-sm sm:font-medium"
              >
                {row.tier}
              </th>
              <td className="text-tone-fg-muted sm:table-cell sm:px-4 sm:py-3 sm:text-tone-fg">
                <span className="mr-1 text-xs font-medium tracking-[0.08em] text-tone-fg-subtle uppercase sm:hidden">
                  What —
                </span>{" "}
                {row.what}
              </td>
              <td className="text-tone-fg-muted sm:table-cell sm:px-4 sm:py-3 sm:text-tone-fg">
                <span className="mr-1 text-xs font-medium tracking-[0.08em] text-tone-fg-subtle uppercase sm:hidden">
                  You get —
                </span>{" "}
                {row.youGet}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Install() {
  return (
    <SectionShell id="install" tone="default" labelledBy="install-title">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <SectionHeading id="install-title" eyebrow="Install" title="Pack up." />

          <CopyBlock
            text={SITE.installCommand}
            label="install command"
            goatcounterEvent="install-copy"
          />
        </div>

        <div className="flex flex-col gap-6">
          <p className="max-w-2xl text-base leading-relaxed text-tone-fg">
            Tiers are depth, not paywalls. Everything is free and open source
            — Tier 0 is the whole product.
          </p>

          <TierTable />
        </div>

        <div className="flex flex-col gap-2 border-t border-tone-border pt-6">
          <p className="max-w-2xl text-base leading-relaxed text-tone-fg">
            <strong className="font-semibold">Works with:</strong> Claude
            Code — manifest + reports · Any AGENTS.md-aware agent — manifest.
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-tone-fg-subtle">
            Prefer{" "}
            <code className="rounded-sm bg-tone-surface-sunken px-1.5 py-0.5 font-mono text-[0.875em] text-tone-accent">
              /scout add
            </code>{" "}
            without the colon? An optional{" "}
            <a
              href={`${SITE.githubUrl}/blob/main/docs/router.md`}
              className="rounded-sm underline transition-colors hover:text-tone-fg focus-ring"
            >
              router skill
            </a>{" "}
            gets you there — one extra step.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

export default Install;
