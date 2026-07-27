import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

/**
 * SectionHeading — the eyebrow -> h2 -> subhead rhythm as one unit.
 *
 * SECTIONS.md treats this ordering as a rule, not a suggestion, so it is
 * encoded here rather than reassembled per section. `id` is required: pass
 * the same string to SectionShell's `labelledBy` so the band becomes a
 * named landmark.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  subhead,
  align = "start",
  className,
}: {
  /** Also used as SectionShell's `labelledBy`. */
  id: string;
  eyebrow: string;
  title: ReactNode;
  subhead?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-balance text-tone-fg sm:text-display-sm"
      >
        {title}
      </h2>
      {subhead ? (
        <p className="max-w-xl text-lg text-pretty text-tone-fg-muted">
          {subhead}
        </p>
      ) : null}
    </div>
  );
}

export default SectionHeading;
