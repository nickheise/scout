import type { ReactNode } from "react";
import { BookOpen, Link2, ListChecks } from "lucide-react";
import { Card, Grid, SectionHeading, SectionShell } from "@/components/blocks";

/**
 * FieldGuide — the pack's contents and its compiled output, as one argument.
 *
 * This section is the site's execution of DECISIONS.md D-021's core
 * distinction: **the pack is what you carry; the field guide is what Scout
 * hands a project** (manifest + standing-instructions block + phase
 * checklists + surfaced references). Both nouns are ratified lexicon, so
 * both are used plainly here rather than explained apologetically.
 *
 * The three cards are the three entry types — `pack` and `step` (shipped,
 * schema/entry.v1.json) and `reference` (D-022, the exemplar/rubric/gotcha
 * razor). Per Nick's 2026-07-28 call the site is written to the intended
 * feature set rather than only to what's currently in the plugin, so
 * references are presented as first-class alongside the other two, in
 * present tense. Do not ship this site to production before core's
 * reference layer lands — that gate is Nick's, recorded in
 * site/DECISIONS.md D-020.
 *
 * Copy discipline: "Standards" is the card's plain-English label; exemplar
 * / rubric / gotcha are named inside it because they're a closed enum the
 * user actually picks from, not decorative vocabulary. Per the register
 * doctrine (core PRD §7.1) the reader never has to *type* any of them —
 * `/scout:add` infers the kind from what they hand it.
 */

const CODE =
  "rounded-sm bg-tone-surface-sunken px-1.5 py-0.5 font-mono text-[0.875em] text-tone-accent";

const KINDS: {
  icon: typeof Link2;
  label: string;
  title: string;
  body: ReactNode;
}[] = [
  {
    icon: Link2,
    label: "Links",
    title: "What to reach for",
    body: (
      <>
        A library, a tool, an effect you want to use again. Scout reads the
        source, drafts the entry, and files the conditions where it applies —
        so it comes back when they&rsquo;re true, not when you remember it.
      </>
    ),
  },
  {
    icon: ListChecks,
    label: "Practices",
    title: "How you work",
    body: (
      <>
        A changelog from commit one. A decision log. How you break down a big
        feature. Described in plain words, kept as a step, and scaffolded into
        every new project so the habit doesn&rsquo;t depend on your discipline.
      </>
    ),
  },
  {
    icon: BookOpen,
    label: "Standards",
    title: "What good looks like",
    body: (
      <>
        The part that usually never survives a project. Three shapes: an{" "}
        <strong className="font-semibold">exemplar</strong> — something you
        built whose shape should be reproduced; a{" "}
        <strong className="font-semibold">rubric</strong> — the checklist you
        would review against; a{" "}
        <strong className="font-semibold">gotcha</strong> — what the model
        gets wrong every time unless told.
      </>
    ),
  },
];

const COMPILED: { term: string; def: ReactNode }[] = [
  {
    term: "The manifest",
    def: (
      <>
        Your links, compressed to one line each and hard-capped at 25 —
        smaller than most CLAUDE.md files. Ambient, not searchable: your agent
        just knows they exist.
      </>
    ),
  },
  {
    term: "Standing instructions",
    def: (
      <>
        The practices that apply continuously, written as a Scout-owned
        block inside that project&rsquo;s own CLAUDE.md or AGENTS.md —
        layered underneath whatever you already keep at{" "}
        <code className={CODE}>~/.claude/CLAUDE.md</code>. Your global file
        stays entirely yours; Scout only ever writes its own block, and only
        inside a project, so the two never collide.
      </>
    ),
  },
  {
    term: "Phase checklists",
    def: (
      <>
        Your standards, filed by the kind of work rather than the calendar —
        planning, build, review, ship — so a rubric for reviewing shows up
        when you&rsquo;re reviewing, not at project kickoff.
      </>
    ),
  },
];

export function FieldGuide() {
  return (
    <SectionShell id="field-guide" tone="sunken" labelledBy="field-guide-title">
      <SectionHeading
        id="field-guide-title"
        eyebrow="The field guide"
        title="The pack goes in. The field guide comes out."
        subhead="The pack is what you carry. The field guide is what Scout hands a project — compiled fresh on every start, capped small, written where your agent already looks."
      />

      <Grid cols={3} as="ul" className="mt-12 list-none">
        {KINDS.map((kind) => (
          <Card
            key={kind.label}
            as="li"
            elevation="sm"
            className="flex flex-col gap-3"
          >
            <kind.icon
              aria-hidden="true"
              strokeWidth={1.75}
              className="size-8 text-tone-accent"
            />
            <div>
              <p className="text-xs font-medium tracking-[0.08em] text-tone-fg-subtle uppercase">
                {kind.label}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-tone-fg">
                {kind.title}
              </h3>
            </div>
            <p className="text-base leading-relaxed text-tone-fg">
              {kind.body}
            </p>
          </Card>
        ))}
      </Grid>

      <div className="mt-12 border-t border-tone-border pt-8">
        <p className="max-w-2xl text-base leading-relaxed text-tone-fg">
          <code className={CODE}>/scout:start</code> compiles all three into
          the project itself:
        </p>

        <dl className="mt-6 max-w-2xl space-y-5">
          {COMPILED.map((row) => (
            <div key={row.term} className="space-y-1">
              <dt className="text-base font-semibold text-tone-fg">
                {row.term}
              </dt>
              <dd className="text-base leading-relaxed text-tone-fg-muted">
                {row.def}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </SectionShell>
  );
}

export default FieldGuide;
