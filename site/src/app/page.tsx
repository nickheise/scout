import { CtaRow, GlassNav, SectionShell } from "@/components/blocks";
import { CopyBlock } from "@/components/islands/CopyBlock";
import { StarCount } from "@/components/islands/StarCount";
import { TerminalDemo } from "@/components/islands/TerminalDemo";
import { SITE } from "@/lib/config";

/**
 * Hero — token system + primitives (P1), islands wired to them (P2).
 *
 * Copy is the existing Astro hero copy, verbatim (P4 owns copy). The mockup
 * slot holds the real TerminalDemo island (P2). The CTA restores the
 * original hero composition (_astro-legacy/src/sections/Hero.astro): the
 * install one-liner rendered in a CopyBlock IS the primary CTA, with the
 * GitHub link + star count (StarCount) as the secondary action — P1's
 * generic "Install Scout" button was a regression from that pattern.
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
                You keep finding great libraries. Then you forget they exist.
              </h1>

              <p className="max-w-xl text-lg text-pretty text-tone-fg-muted sm:text-xl">
                Scout is a pack your coding agent carries. Drop links in —
                Scout hands them back at the exact moment they apply.
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
      </main>
    </>
  );
}
