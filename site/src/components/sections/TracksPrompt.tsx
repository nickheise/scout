import { SectionHeading, SectionShell } from "@/components/blocks";
import { CopyBlock } from "@/components/islands/CopyBlock";
import { SITE } from "@/lib/config";

/**
 * TracksPrompt — Beat 4.5 ("meet your taste"), tinted tone.
 *
 * Copy is verbatim from _astro-legacy/src/sections/TracksPrompt.astro; only
 * the eyebrow ("Tracks") is new. The prompt text is never hardcoded — it
 * comes from `SITE.tracksPrompt` (config.ts), same as the legacy Astro
 * section read `SITE.tracksPrompt`. This block and the hero's install
 * CopyBlock are a deliberate visual pair (PRD Beat 4.5) — same component,
 * same styling.
 */

const CODE =
  "rounded-sm bg-tone-surface-sunken px-1.5 py-0.5 font-mono text-[0.875em] text-tone-accent";

export function TracksPrompt() {
  return (
    <SectionShell id="tracks-prompt" tone="tinted" labelledBy="tracks-prompt-title">
      {/* Left-aligned to match every other section — see Philosophy.tsx. */}
      <div className="max-w-2xl space-y-8">
        <SectionHeading
          id="tracks-prompt-title"
          eyebrow="Tracks"
          title="Meet your taste."
        />

        <p className="leading-relaxed text-tone-fg">
          Before you install anything: paste this into any Claude or Codex
          chat. It reads your own history — in your session, where Scout
          can&rsquo;t see — and hands back the libraries, tools, and habits
          that keep showing up in your work. A list that&rsquo;s unmistakably
          yours.
        </p>

        <CopyBlock
          text={SITE.tracksPrompt}
          label="tracks prompt"
          multiline
          goatcounterEvent="tracks-copy"
        />

        <p className="text-sm leading-relaxed text-tone-fg">
          Bring what rings true into <code className={CODE}>/scout:setup</code>{" "}
          — leave the rest.
        </p>
      </div>
    </SectionShell>
  );
}

export default TracksPrompt;
