import type { ReactNode } from "react";
import { Backpack, Compass, MapPin, Stamp } from "lucide-react";
import { Card, Grid, SectionHeading, SectionShell } from "@/components/blocks";

/**
 * HowItWorks — Beat 3 ("the loop").
 *
 * Four steps as a bento feature grid (Card + Grid), default/white tone.
 * Copy is verbatim from _astro-legacy/src/sections/HowItWorks.astro; only
 * the eyebrow ("Workflow") is new, added for the contract's eyebrow -> h2
 * rhythm since the source had no eyebrow line.
 *
 * Inline `/scout:*` commands use the contract's §5 code-inline convention
 * (the old `.code-inline` class is retired, so the utility string is
 * inlined here rather than reintroduced as shared CSS).
 */

const CODE =
  "rounded-sm bg-tone-surface-sunken px-1.5 py-0.5 font-mono text-[0.875em] text-tone-accent";

const STEPS: { icon: typeof Backpack; title: string; body: ReactNode }[] = [
  {
    icon: Backpack,
    title: "Pack it",
    body: (
      <>
        <code className={CODE}>/scout:add</code> a URL from anywhere. Scout
        reads it, drafts the entry, and files it with the conditions where it
        applies.
      </>
    ),
  },
  {
    icon: MapPin,
    title: "The manifest",
    body: (
      <>
        <code className={CODE}>/scout:start</code> on a new project writes a
        compact packing list into your agent&rsquo;s context. Capped small on
        purpose: a pack you can&rsquo;t carry is a pack you don&rsquo;t bring.
      </>
    ),
  },
  {
    icon: Stamp,
    title: "Reports",
    body: (
      <>
        While you build, matches that survive Scout&rsquo;s gate surface as
        compact reports. Ignore them freely — Scout learns from that too.
      </>
    ),
  },
  {
    icon: Compass,
    title: "Survey",
    body: (
      <>
        Before you ship, <code className={CODE}>/scout:survey</code> walks
        the whole project for anything you missed.
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <SectionShell id="how-it-works" tone="default" labelledBy="how-it-works-title">
      <SectionHeading
        id="how-it-works-title"
        eyebrow="Workflow"
        title="The loop."
      />

      <Grid cols={4} as="ul" className="mt-12 list-none">
        {STEPS.map((step) => (
          <Card key={step.title} as="li" elevation="sm" className="flex flex-col gap-3">
            <step.icon
              aria-hidden="true"
              strokeWidth={1.75}
              className="size-8 text-tone-accent"
            />
            <h3 className="text-xl font-semibold text-tone-fg">{step.title}</h3>
            <p className="text-base leading-relaxed text-tone-fg">{step.body}</p>
          </Card>
        ))}
      </Grid>

      <p className="mt-12 border-t border-tone-border pt-8 text-sm leading-relaxed text-tone-fg-muted">
        Scout also carries your project rituals — changelog, decision log, how
        you build big features — so every project starts the same way.
      </p>
    </SectionShell>
  );
}

export default HowItWorks;
