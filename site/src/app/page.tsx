import { CtaRow, GlassNav, SectionShell } from "@/components/blocks";
import { CopyBlock } from "@/components/islands/CopyBlock";
import { StarCount } from "@/components/islands/StarCount";
import { TerminalDemo } from "@/components/islands/TerminalDemo";
import { SITE } from "@/lib/config";
import { CourierPrompt } from "@/components/sections/CourierPrompt";
import { FieldGuide } from "@/components/sections/FieldGuide";
import { Footer } from "@/components/sections/Footer";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Install } from "@/components/sections/Install";
import { Philosophy } from "@/components/sections/Philosophy";
import { TasteLoop } from "@/components/sections/TasteLoop";

/**
 * Hero — token system + primitives (P1), islands wired to them (P2).
 *
 * Copy widened from the original Astro hero (libraries-only) per Nick's
 * 2026-07-28 positioning call: the memory-category niche (site
 * docs/scout-positioning.md) stays put, but the object of memory widens
 * from "libraries" to "what works" — covering both pack entries and the
 * step/ritual half of the schema (previously undersold; see value theme 3,
 * scout-positioning.md, which had been deliberately kept to one quiet
 * sentence in v1 — that constraint is lifted here). The mockup slot holds
 * the real TerminalDemo island (P2). The CTA restores the original hero
 * composition (_astro-legacy/src/sections/Hero.astro): the install
 * one-liner rendered in a CopyBlock IS the primary CTA, with the GitHub
 * link + star count (StarCount) as the secondary action — P1's generic
 * "Install Scout" button was a regression from that pattern.
 */

export default function Home() {
  return (
    <>
      <GlassNav />
      <main>
        <SectionShell
          id="hero"
          tone="tinted"
          size="tall"
          labelledBy="hero-title"
        >
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <h1
                id="hero-title"
                className="text-4xl font-semibold tracking-[-0.025em] text-balance text-tone-fg sm:text-display-sm lg:text-display"
              >
                You keep finding what works. Then every new project starts
                from scratch.
              </h1>

              <p className="max-w-xl text-lg text-pretty text-tone-fg-muted sm:text-xl">
                Scout is a pack your coding agent carries — what to reach
                for, how you work, what good looks like. Pack it once; Scout
                hands it back at the exact moment it applies.
              </p>

              <CtaRow fine="Free and open source. No server, no account, no API key.">
                <CopyBlock
                  text={SITE.installCommand}
                  label="the install command"
                  goatcounterEvent="install-copy"
                  className="w-full"
                />
              </CtaRow>

              <StarCount className="mt-1" />
            </div>

            <div className="lg:col-span-7">
              <TerminalDemo />
            </div>
          </div>
        </SectionShell>

        {/* Band rhythm (BUILD-CONTRACT §1): tinted -> default -> sunken ->
            default -> dark -> tinted -> default -> sunken. No two adjacent
            bands repeat, and Philosophy stays the page's only dark chapter. */}
        <HowItWorks />
        <FieldGuide />
        <TasteLoop />
        <Philosophy />
        <CourierPrompt />
        <Install />
      </main>
      <Footer />
    </>
  );
}
