import { Footprints, Stamp } from "lucide-react";
import { SectionHeading, SectionShell } from "@/components/blocks";

/**
 * Philosophy — Beat 4, the page's one dark band (`tone="dark"`).
 *
 * Copy is verbatim from _astro-legacy/src/sections/Philosophy.astro; only
 * the eyebrow ("Philosophy") is new. Every color in this file is a
 * `tone-*` utility — per BUILD-CONTRACT.md §1 a raw token here would look
 * correct on white and vanish on the near-black band. Icon color (legacy
 * `text-trail-500`) maps to `text-tone-accent` per the contract's §5
 * old->new map (`trail-*` is retired, no second accent).
 */

const TENETS = [
  {
    title: "Zero recall.",
    body: "If you have to remember to use it, it's already failed. Nothing in Scout requires remembering — not a command, not a keyword, not that it exists.",
  },
  {
    title: "Restraint.",
    body: 'Scout expects to say nothing most of the time. Suggestions pass a gate; rejections are logged; two per moment, max. The whole manifest is capped at 25 lines — smaller than most CLAUDE.md files. "Nothing surfaced" is a good result.',
  },
  {
    title: "Your pack, your files.",
    body: "Entries live in a plain folder you own — file over app. Scout's code updates via plugin; your data never leaves your hands. Scout has no brain of its own: your agent does the thinking. No server, no account, no API key, ever.",
  },
];

export function Philosophy() {
  return (
    <SectionShell id="philosophy" tone="dark" labelledBy="philosophy-title">
      {/* Left-aligned, not centered: every other section on the page anchors
          its content to the container's left edge, and a centered column here
          made the page's left edge visibly wobble on scroll. */}
      <div className="max-w-2xl">
        <SectionHeading
          id="philosophy-title"
          eyebrow="Philosophy"
          title="Three things Scout believes."
        />

        <div className="mt-12 space-y-8">
          {TENETS.map((tenet) => (
            <div key={tenet.title} className="space-y-2">
              <div className="flex items-center gap-2">
                <Stamp
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="size-5 shrink-0 text-tone-accent"
                />
                <h3 className="text-lg font-medium text-tone-fg">
                  {tenet.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-tone-fg">
                {tenet.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-tone-fg-muted">
          Local-first. No telemetry. Ships empty — your pack is yours from
          entry one. MIT licensed.
        </p>

        <blockquote className="mt-8 border-l-2 border-tone-accent py-2 pl-4 italic text-tone-fg">
          <p className="mb-3 flex items-start gap-2">
            <Footprints
              aria-hidden="true"
              strokeWidth={1.75}
              className="size-5 shrink-0 translate-y-0.5 text-tone-accent"
            />
            <span>
              Scout doesn&rsquo;t ask what you would do. It reads what you
              did.
            </span>
          </p>
          <p>
            Stated preferences — what you&rsquo;d answer in an onboarding
            interview — are unreliable. Revealed preferences — what your
            repos show you did, repeatedly — are the ground truth. Scout
            reads tracks, not answers. That&rsquo;s why there&rsquo;s no
            setup questionnaire.
          </p>
        </blockquote>
      </div>
    </SectionShell>
  );
}

export default Philosophy;
