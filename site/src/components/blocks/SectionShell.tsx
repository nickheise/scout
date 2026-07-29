import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionShell — the full-bleed band + constrained content column.
 *
 * Every page section goes through this. It does three jobs:
 *
 *  1. Paints a full-bleed background band. Cycling bands (default -> tinted
 *     -> dark -> default) is what gives the page its sense of "chapters"
 *     while scrolling — the kit's banding pattern (SECTIONS.md §5).
 *  2. Sets `data-tone`, which re-points the whole tone palette for
 *     everything inside (see globals.css). Children use `text-tone-fg`,
 *     `bg-tone-surface`, `text-tone-accent`, `shadow-tone-card` and land
 *     correctly on any band without threading a prop.
 *  3. Renders a real `<section>` landmark with an accessible name. A
 *     `<section>` only becomes a landmark when it is named, so the props
 *     require exactly one of `labelledBy` (preferred — point at the h2's
 *     id) or `label`.
 *
 * `tone="dark"` is a compositional device, NOT a dark theme. There is no
 * dark mode on this site.
 */

export type SectionTone = "default" | "tinted" | "sunken" | "dark";

const TONE_BG: Record<SectionTone, string> = {
  default: "bg-canvas",
  tinted: "bg-canvas-tinted",
  sunken: "bg-canvas-sunken",
  dark: "bg-ink",
};

const SIZE: Record<"compact" | "default" | "tall", string> = {
  compact: "py-12 sm:py-16",
  default: "py-16 sm:py-24 lg:py-32",
  tall: "py-24 sm:py-32 lg:py-40",
};

type Nameable =
  | { labelledBy: string; label?: never }
  | { label: string; labelledBy?: never };

export type SectionShellProps = Nameable & {
  id?: string;
  tone?: SectionTone;
  size?: "compact" | "default" | "tall";
  /** Classes for the full-bleed band. */
  className?: string;
  /** Classes for the constrained content column. */
  containerClassName?: string;
  /** Escape hatch for the interactive-demo band, which has no text at all. */
  as?: ExtendedElement;
  children: ReactNode;
};

type ExtendedElement = Extract<ElementType, "section" | "header" | "footer">;

export function SectionShell({
  id,
  tone = "default",
  size = "default",
  className,
  containerClassName,
  as: Tag = "section",
  labelledBy,
  label,
  children,
}: SectionShellProps) {
  return (
    <Tag
      id={id}
      data-tone={tone}
      aria-labelledby={labelledBy}
      aria-label={label}
      className={cn("text-tone-fg", TONE_BG[tone], SIZE[size], className)}
    >
      <div className={cn("container-page", containerClassName)}>{children}</div>
    </Tag>
  );
}

export default SectionShell;
