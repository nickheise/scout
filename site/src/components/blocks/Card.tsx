import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card — the kit's elevated surface.
 *
 * 24px radius (`rounded-card`) and the ONE shared 3-layer shadow recipe
 * (hairline inset border + two ambient layers) as a single token. The kit is
 * explicit about this: define the recipe once, never write per-component
 * shadows. `shadow-tone-card` picks the light or on-dark variant from the
 * surrounding band automatically.
 *
 * `elevation="glow"` adds the accent-tinted 4th layer for a themed CTA
 * surface; the tint comes from `--glow-color`, which the tone system already
 * points at the right accent step.
 */

export type CardElevation = "flat" | "sm" | "default" | "glow";
export type CardPadding = "none" | "sm" | "default" | "lg";

const ELEVATION: Record<CardElevation, string> = {
  flat: "border border-tone-border",
  sm: "shadow-tone-card-sm",
  default: "shadow-tone-card",
  glow: "shadow-glow",
};

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  default: "p-6",
  lg: "p-8",
};

export function Card({
  as: Tag = "div",
  elevation = "default",
  padding = "default",
  radius = "card",
  interactive = false,
  className,
  children,
}: {
  as?: "div" | "article" | "li" | "figure";
  elevation?: CardElevation;
  padding?: CardPadding;
  /** `panel` (16px) for secondary/nested cards. */
  radius?: "card" | "panel";
  /** Adds the hover lift — gated to fine pointers in globals.css. */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "bg-tone-surface text-tone-fg",
        radius === "card" ? "rounded-card" : "rounded-panel",
        ELEVATION[elevation],
        PADDING[padding],
        interactive && "hover-lift",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export default Card;
