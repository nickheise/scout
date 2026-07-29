import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * CTA_LG — page CTA sizing.
 *
 * shadcn's `size="lg"` is 36px tall: correct for in-app density, too small
 * for a marketing page. Every primary/secondary page CTA is
 * `<Button size="lg" className={CTA_LG}>`, so they stay identical across
 * sections. Plain utilities (not an `@utility`) so `cn`'s tailwind-merge
 * reliably overrides the variant's own `h-9 / px-2.5 / text-[0.8rem]`.
 */
export const CTA_LG = "h-11 gap-2 rounded-lg px-5 text-base";

/**
 * CtaRow — the hero/section call-to-action cluster.
 *
 * Kit hero anatomy (SECTIONS.md §2) ends with a primary CTA row followed by
 * one line of fine print (a system requirement, a licence note). `fine`
 * renders that line at the muted step so it never competes with the buttons.
 */
export function CtaRow({
  align = "start",
  fine,
  className,
  children,
}: {
  align?: "start" | "center";
  fine?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          align === "center" && "justify-center",
        )}
      >
        {children}
      </div>
      {fine ? <p className="text-sm text-tone-fg-subtle">{fine}</p> : null}
    </div>
  );
}

export default CtaRow;
