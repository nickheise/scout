import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Container — the 1200px content column on its own, for the rare case that
 * needs it outside a SectionShell (GlassNav, a full-bleed band that has to
 * paint edge-to-edge but keep its text constrained).
 *
 * SectionShell already wraps its children in this; do not nest them.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("container-page", className)}>{children}</div>;
}

export default Container;
