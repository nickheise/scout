import { Compass, GitBranch } from "lucide-react";
import { SITE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * GlassNav — the sticky frosted-glass header.
 *
 * The kit's nav pattern (SECTIONS.md §1): sticky, `backdrop-filter:
 * blur(24px)`, wordmark left, utility links right, nav labels single words
 * with no verbs. Scout had no nav at all under the Astro build, so this is
 * new.
 *
 * Server component — zero JS. There is no mobile menu button: below `sm`
 * the text links drop out and the GitHub link survives as an icon-only
 * control with an `aria-label`, which is cheaper and more robust than a
 * disclosure widget for three links.
 *
 * It carries `data-tone="default"` explicitly so it stays a light frosted
 * panel even while scrolled over a `tone="dark"` band.
 */

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Install", href: "#install" },
  { label: "Docs", href: SITE.docsUrl },
];

/* Plain `hover:` is enough — Tailwind v4 already compiles every hover
 * utility inside `@media (hover: hover)`, so no touch device gets a stuck
 * hover state. The explicit `(hover:hover) and (pointer:fine)` form is only
 * needed for transform-based lift (see the `hover-lift` utility). */
const linkClass =
  "rounded-sm text-sm font-medium text-fg-muted transition-colors hover:text-fg focus-ring";

export function GlassNav({ className }: { className?: string }) {
  return (
    <header
      data-tone="default"
      className={cn(
        "sticky top-0 z-40 w-full border-b border-hairline",
        "bg-white/70 backdrop-blur-glass supports-[backdrop-filter]:bg-white/60",
        className,
      )}
    >
      <nav
        aria-label="Main"
        className="container-page flex h-[var(--page-header)] items-center justify-between gap-6"
      >
        <a
          href="/"
          className="flex items-center gap-2 rounded-sm text-base font-semibold tracking-[-0.01em] text-fg focus-ring"
        >
          <Compass
            aria-hidden="true"
            strokeWidth={1.75}
            className="size-5 text-forest-500"
          />
          <span>Scout</span>
        </a>

        <div className="flex items-center gap-6">
          <ul className="hidden items-center gap-6 sm:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            href={SITE.githubUrl}
            aria-label="Scout on GitHub"
            className={cn(linkClass, "inline-flex items-center gap-1.5")}
          >
            <GitBranch
              aria-hidden="true"
              strokeWidth={1.75}
              className="size-[18px] shrink-0"
            />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>
    </header>
  );
}

export default GlassNav;
