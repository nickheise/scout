import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Grid — the bento / card-row helper.
 *
 * The kit's feature grids are 2-3 columns of mixed tile sizes on the same
 * 24px gap. Children opt into a wider span with `col-span-2` (or the
 * `sm:col-span-2` responsive form) rather than the grid managing sizes.
 */
export function Grid({
  cols = 3,
  gap = "default",
  as: Tag = "div",
  className,
  children,
}: {
  cols?: 2 | 3 | 4;
  gap?: "sm" | "default";
  as?: "div" | "ul";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "grid grid-cols-1",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        gap === "sm" ? "gap-4" : "gap-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export default Grid;
