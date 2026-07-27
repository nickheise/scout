import { ArrowRight, GitBranch, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CTA_LG,
  Card,
  CtaRow,
  GlassNav,
  SectionShell,
} from "@/components/blocks";
import { SITE } from "@/lib/config";

/**
 * P1 hero shell — proves the token system and the primitives.
 *
 * Copy is the existing Astro hero copy, verbatim (P4 owns copy). The mockup
 * slot holds a STATIC placeholder terminal frame: P2 replaces it with the
 * real TerminalDemo island, and P3 builds every section below this one.
 */

/* Placeholder only. Static markup, no island. The lines are transcribed from
 * the existing demo script so the frame is sized realistically. */
function TerminalFramePlaceholder() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-tone-border bg-tone-surface-sunken px-4 py-3">
        <Terminal
          aria-hidden="true"
          strokeWidth={1.75}
          className="size-4 shrink-0 text-tone-accent"
        />
        <p className="truncate font-terminal text-xs text-tone-fg-muted">
          side-project · claude
        </p>
      </div>
      <div className="min-h-72 space-y-1.5 p-5 font-terminal text-sm [overflow-wrap:anywhere]">
        <p className="font-medium text-tone-fg">
          <span className="mr-2 select-none text-tone-accent">❯</span>
          /scout:add https://github.com/clauderic/dnd-kit
        </p>
        <div className="my-2 space-y-1 rounded-panel border border-tone-border bg-tone-surface-sunken px-3 py-2.5 text-tone-fg-muted">
          <p>dnd-kit — modular drag-and-drop toolkit for React</p>
          <p>packs when: drag-and-drop, sortable lists, draggable UI</p>
          <p>Add to pack? (y/n) y</p>
        </div>
        <p className="font-medium text-tone-accent">✓ Packed.</p>
        <p className="pt-4 text-tone-fg-subtle italic">
          — days later, a different project —
        </p>
        <p className="font-medium" style={{ color: "var(--tone-report)" }}>
          ⌖ dnd-kit — github.com/clauderic/dnd-kit
        </p>
        <p className="pl-[2ch] text-tone-fg">
          Modular drag-and-drop toolkit for React.
        </p>
        <p className="pl-[2ch] text-tone-fg">
          Matched: &quot;drag-and-drop, sortable lists, draggable UI&quot;
        </p>
      </div>
    </Card>
  );
}

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
                <Button size="lg" className={CTA_LG} asChild>
                  <a href="#install">
                    Install Scout
                    <ArrowRight aria-hidden="true" strokeWidth={1.75} />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className={CTA_LG} asChild>
                  <a href={SITE.githubUrl}>
                    <GitBranch aria-hidden="true" strokeWidth={1.75} />
                    GitHub
                  </a>
                </Button>
              </CtaRow>
            </div>

            <div className="lg:col-span-7">
              <TerminalFramePlaceholder />
            </div>
          </div>
        </SectionShell>
      </main>
    </>
  );
}
