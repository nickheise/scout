import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    goatcounter?: {
      count: (options: { path: string; event?: boolean }) => void;
    };
  }
}

const REVERT_MS = 2000;

export interface CopyBlockProps {
  /** The exact command/prompt string — rendered verbatim, copied verbatim. */
  text: string;
  /** Human-readable label for the a11y string: "Copy {label} to clipboard". */
  label: string;
  /** Long-form content (e.g. the tracks prompt) wraps in a <pre>; a single
   * command renders in an inline, horizontally-scrollable <code>. */
  multiline?: boolean;
  /** GoatCounter custom-event name (e.g. "install-copy", "tracks-copy"). When
   * unset, or when window.goatcounter isn't present, this is a no-op. */
  goatcounterEvent?: string;
  className?: string;
}

/**
 * CopyBlock — the site's copy-button pattern (PLAN.md §1, PRD Beat 1/4.5).
 * Used for both the install one-liner and the tracks prompt; the two blocks
 * are a deliberate pair (copy-deck.md Beat 4.5) so they share this exact
 * component and styling.
 *
 * Native <button>, navigator.clipboard.writeText, icon+label swap to
 * "Copied" that reverts after ~2s, aria-live announcement for screen
 * readers. No motion beyond an instant icon swap and a color transition —
 * this site's animation budget belongs entirely to the Beat 2 demo.
 */
export function CopyBlock({
  text,
  label,
  multiline = false,
  goatcounterEvent,
  className,
}: CopyBlockProps) {
  const [copied, setCopied] = useState(false);
  const revertTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revertTimeout.current) clearTimeout(revertTimeout.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    let succeeded = false;

    try {
      await navigator.clipboard.writeText(text);
      succeeded = true;
    } catch {
      // Clipboard API blocked (permissions/insecure context/older browser).
      // Fall back to the classic hidden-textarea + execCommand("copy")
      // path so the button still works in those environments.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        textarea.style.left = "-1000px";
        document.body.appendChild(textarea);
        textarea.select();
        succeeded = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        // Neither path worked. The text is still plainly visible and
        // selectable in the block, so this fails soft — we just don't
        // claim success in the UI (see `succeeded` check below).
      }
    }

    if (succeeded) {
      setCopied(true);
      if (revertTimeout.current) clearTimeout(revertTimeout.current);
      revertTimeout.current = setTimeout(() => setCopied(false), REVERT_MS);
    }

    if (goatcounterEvent) {
      window.goatcounter?.count({ path: goatcounterEvent, event: true });
    }
  }, [text, goatcounterEvent]);

  const isMultiline = multiline || text.includes("\n");
  const TextTag = isMultiline ? "pre" : "code";

  return (
    <div
      data-slot="copy-block"
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-ink/15 bg-paper-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <TextTag
        className={cn(
          "min-w-0 flex-1 font-mono text-sm text-ink",
          isMultiline
            ? "whitespace-pre-wrap leading-relaxed text-left"
            : "overflow-x-auto whitespace-nowrap",
        )}
      >
        {text}
      </TextTag>

      <button
        type="button"
        data-slot="copy-block-button"
        onClick={handleCopy}
        aria-label={`Copy ${label} to clipboard`}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-ink/15 bg-paper-100 px-3 py-1.5 text-sm font-medium text-ink",
          "transition-colors [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-200 motion-reduce:transition-none",
          "active:scale-[0.97] motion-reduce:active:scale-100",
          "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "sm:self-auto",
        )}
      >
        <svg
          width="16"
          height="16"
          aria-hidden="true"
          focusable="false"
          className={cn("shrink-0", copied && "text-forest-600")}
        >
          <use href={copied ? "#icon-check" : "#icon-copy"} />
        </svg>
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}

export default CopyBlock;
