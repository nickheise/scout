import { SectionHeading, SectionShell } from "@/components/blocks";
import { CopyBlock } from "@/components/islands/CopyBlock";
import { SITE } from "@/lib/config";

/**
 * CourierPrompt — Beat 4.5 ("meet your taste"), tinted tone.
 *
 * Artifact naming: Scout core calls this **the courier prompt**
 * (`docs/courier-prompt.md`, PRD §7.3 courier pattern). The site used to
 * mint a competing name ("the tracks prompt"); that is retired. The page
 * deliberately does not give the artifact a proper noun in the heading —
 * one canonical name lives in core, and the section leads with what it does.
 *
 * The eyebrow is functional rather than a lexicon label: an eyebrow the
 * reader has to decode is the one place where brand vocabulary costs recall
 * instead of being free (register doctrine, PRD §7.1).
 *
 * The prompt text is never hardcoded here — it comes from
 * `SITE.courierPrompt`, mirrored from core. This block and the hero's
 * install CopyBlock are a deliberate visual pair (PRD Beat 4.5) — same
 * component, same styling.
 */

const CODE =
  "rounded-sm bg-tone-surface-sunken px-1.5 py-0.5 font-mono text-[0.875em] text-tone-accent";

export function CourierPrompt() {
  return (
    <SectionShell
      id="courier-prompt"
      tone="tinted"
      labelledBy="courier-prompt-title"
    >
      {/* Left-aligned to match every other section — see Philosophy.tsx. */}
      <div className="max-w-2xl space-y-8">
        <SectionHeading
          id="courier-prompt-title"
          eyebrow="Before you install"
          title="Meet your taste."
        />

        <p className="leading-relaxed text-tone-fg">
          Paste this into any Claude or Codex chat. It reads your own history
          — in your session, where Scout can&rsquo;t see — and hands back the
          libraries, tools, and working practices that keep showing up across
          your projects. A list that&rsquo;s unmistakably yours.
        </p>

        <CopyBlock
          text={SITE.courierPrompt}
          label="the courier prompt"
          multiline
          goatcounterEvent="courier-copy"
        />

        <p className="text-sm leading-relaxed text-tone-fg">
          Nothing has moved yet — it&rsquo;s text on your own screen. Bring
          what rings true into <code className={CODE}>/scout:setup</code>,
          leave the rest.
        </p>
      </div>
    </SectionShell>
  );
}

export default CourierPrompt;
