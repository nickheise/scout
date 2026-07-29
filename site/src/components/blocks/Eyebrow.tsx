import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Eyebrow — the small caps accent label that precedes every h2.
 *
 * SECTIONS.md makes this a hard rhythm rule: eyebrow -> h2 -> optional
 * one-line subhead -> content, on every section. One or two words, all caps,
 * accent color. No verbs, no sentences.
 *
 * Colour comes from `text-tone-accent`, so it flips to the on-dark accent
 * step automatically inside a `tone="dark"` band.
 */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.12em] text-tone-accent uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export default Eyebrow;
