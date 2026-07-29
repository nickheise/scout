import { GitBranch } from "lucide-react";
import { SectionShell } from "@/components/blocks";
import { SITE } from "@/lib/config";

/**
 * Footer — nav links, example-packs note, credit/license, analytics
 * disclosure. Copy is verbatim from `_astro-legacy/src/sections/Footer.astro`
 * (P4 owns the actual sentences).
 *
 * Tone: sunken/tinted, per the assigned band rhythm (Install owns
 * default/white; P3a owns the one dark chapter).
 *
 * The analytics-disclosure paragraph is gated on `SITE.goatcounter` being
 * non-null, exactly like the legacy section — it must never ship while
 * analytics aren't actually wired up. `SITE.goatcounter` is currently
 * `null`, so that paragraph does not render.
 */
export function Footer() {
  return (
    <SectionShell as="footer" id="footer" tone="sunken" label="Site footer">
      <div className="flex flex-col gap-8">
        <nav aria-label="Footer" className="text-sm text-tone-fg">
          <ul className="flex flex-wrap items-center gap-4">
            <li>
              <a
                href={SITE.githubUrl}
                className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-tone-accent focus-ring"
              >
                <GitBranch
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="size-4 shrink-0"
                />
                GitHub
              </a>
            </li>
            <li aria-hidden="true" className="text-tone-fg-subtle">
              ·
            </li>
            <li>
              <a
                href={SITE.docsUrl}
                className="rounded-sm transition-colors hover:text-tone-accent focus-ring"
              >
                Docs
              </a>
            </li>
            <li aria-hidden="true" className="text-tone-fg-subtle">
              ·
            </li>
            <li>Example packs</li>
          </ul>
        </nav>

        <div className="flex flex-col gap-4">
          <p className="max-w-2xl text-base leading-relaxed text-tone-fg">
            Packs are personal — here&rsquo;s what some look like.
          </p>
          <div className="flex flex-col gap-3 pl-4 text-base leading-relaxed text-tone-fg">
            <div>
              <strong className="font-semibold">Nick&rsquo;s pack</strong> —
              the nine entries that shaped Scout
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-tone-border pt-6 text-sm leading-relaxed text-tone-fg-muted">
          <p>
            Built on ideas from{" "}
            <a
              href="https://github.com/emilkowalski/skills"
              className="rounded-sm underline transition-colors hover:text-tone-fg focus-ring"
            >
              emilkowalski/skills
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/mattpocock/skills"
              className="rounded-sm underline transition-colors hover:text-tone-fg focus-ring"
            >
              mattpocock/skills
            </a>{" "}
            — generous prior art, generously acknowledged.
          </p>
          <p>MIT licensed.</p>
          {SITE.goatcounter && (
            <p>
              This site counts pageviews with{" "}
              <a
                href="https://www.goatcounter.com/"
                className="rounded-sm underline transition-colors hover:text-tone-fg focus-ring"
              >
                GoatCounter
              </a>{" "}
              — open source, cookieless, no personal data. Scout itself
              phones home to no one.
            </p>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

export default Footer;
