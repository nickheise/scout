import type { ReactNode } from "react";
import { Backpack, Compass, MapPin, Stamp } from "lucide-react";
import { Card, Grid, SectionHeading, SectionShell } from "@/components/blocks";

/**
 * HowItWorks — Beat 3 ("the loop").
 *
 * Four steps as a bento feature grid (Card + Grid), default/white tone.
 * Base copy is from _astro-legacy/src/sections/HowItWorks.astro; the
 * eyebrow ("Workflow") was already new.
 *
 * This section is deliberately the *shape* of the loop, not a feature
 * inventory — FieldGuide.tsx owns what goes in the pack and what gets
 * compiled out, and TasteLoop.tsx owns the wrap-phase feedback step. Two
 * consequences for anyone editing here:
 *
 *  1. "Pack it" names all three entry shapes at the altitude of "anything
 *     worth keeping" rather than enumerating pack/step/reference — the
 *     enumeration is FieldGuide's job, and doing it twice made the page
 *     repeat itself.
 *  2. Step 2 is "The field guide", not "The manifest". The manifest is one
 *     of three things `/scout:start` compiles (DECISIONS.md D-021); naming
 *     the step after the whole artifact keeps the lexicon straight — the
 *     pack is what you carry, the field guide is what a project gets.
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
        <code className={CODE}>/scout:add</code>{" "}
        anything worth keeping — a URL, a practice in plain words, a standard
        worth holding to. Scout drafts it and files the conditions where it
        applies. You confirm before anything is saved.
      </>
    ),
  },
  {
    icon: MapPin,
    title: "The field guide",
    body: (
      <>
        <code className={CODE}>/scout:start</code>{" "}
        compiles your pack into the project: a capped manifest, your standing
        instructions, your phase checklists. A pack you can&rsquo;t carry is a
        pack you don&rsquo;t bring.
      </>
    ),
  },
  {
    icon: Stamp,
    title: "Reports",
    body: (
      <>
        While you build, matches that survive Scout&rsquo;s gate surface as
        compact reports — at the moment that kind of work is happening, not
        at kickoff. Ignore them freely; Scout learns from that too.
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

      <p className="mt-12 max-w-2xl border-t border-tone-border pt-8 text-base leading-relaxed text-tone-fg">
        Every project starts like your best one — because the same pack
        starts all of them.
      </p>
    </SectionShell>
  );
}

export default HowItWorks;
