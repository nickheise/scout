import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * TerminalDemo — Beat 2, "the product's trailer" (PRD §6, demo-script.md).
 *
 * A hand-built beat-script player: a small data array of typed-line/output/
 * wait/scene-break steps (DEMO_SCRIPT below, transcribed verbatim from
 * docs/demo-script.md) drives real DOM text inside a paper-register terminal
 * frame. No video, no canvas — every character on screen is a real text node.
 *
 * This island only ever mounts for visitors who don't prefer reduced motion —
 * Demo.astro hydrates it with `client:media="(prefers-reduced-motion:
 * no-preference)"`, so the animation's JS is never fetched or executed for
 * reduced-motion users at all. Demo.astro separately renders a fully static,
 * zero-JS two-frame fallback (real <TerminalFrame> markup) for that audience,
 * toggled purely by the `motion-reduce:` CSS variant — that CSS swap is
 * instant and needs no JS help. The one thing hydration-time gating can't
 * catch is the preference flipping *after* mount: this component still
 * carries a `prefers-reduced-motion` change listener (alongside a
 * `visibilitychange` one) purely to pause the timeline in those two cases,
 * so it never keeps ticking state behind a backgrounded tab or a
 * newly-hidden `display:none` container.
 *
 * Motion budget: this is the page's entire animation budget (PLAN.md §3).
 * The only non-instant transition anywhere in this file is the report line's
 * 400ms opacity+transform fade — the sole use of --color-report on the site —
 * and the 400ms cross-fade the loop uses to restart. Everything else appears
 * or disappears in a single frame. Transform/opacity only, throughout.
 */

/* ==========================================================================
 * Beat-script data — verbatim strings + timings from docs/demo-script.md.
 * ========================================================================== */

type LineVariant =
  | "prompt" // a `❯`-prefixed command the "user" types
  | "card" // lines inside the drafted-entry card (indented, bordered)
  | "success" // a "✓ …" confirmation line
  | "dim" // muted agent "planning" text
  | "output" // plain agent continuation text
  | "report" // the report card's title line — --color-report
  | "report-body"; // the report card's body lines — ink, indented

interface RenderLine {
  id: string;
  text: string;
  variant: LineVariant;
  group?: "card" | "report";
  /** True while this line is still being typed (shows a blinking caret). */
  cursor?: boolean;
}

interface FrameState {
  title: string;
  lines: RenderLine[];
  /** Set while the scene-break stamp is covering the frame body. */
  sceneBreak: string | null;
}

type Step =
  | {
      kind: "typed-line";
      text: string;
      variant: "prompt";
      /** Type onto the end of the current last line instead of a new one
       * (used for the inline "y" answer to the pack confirmation prompt). */
      appendToLast?: boolean;
    }
  | {
      kind: "output";
      lines: { text: string; variant: LineVariant }[];
      /** Tags every line so the renderer can wrap the run in one bordered
       * card, per the script's "indented block, subtle border" direction. */
      group?: "card" | "report";
      /** Gap between lines as they're revealed (default 120ms/line). */
      lineDelayMs?: number;
    }
  | { kind: "wait"; ms: number }
  | { kind: "scene-break"; text: string; ms: number; nextTitle: string };

const ACT_1_TITLE = "side-project · claude";

const DEMO_SCRIPT: Step[] = [
  {
    kind: "typed-line",
    variant: "prompt",
    text: "/scout:add https://github.com/clauderic/dnd-kit",
  },
  { kind: "wait", ms: 800 },
  {
    kind: "output",
    group: "card",
    lineDelayMs: 120,
    lines: [
      {
        text: "dnd-kit — modular drag-and-drop toolkit for React",
        variant: "card",
      },
      {
        text: "packs when: drag-and-drop, sortable lists, draggable UI",
        variant: "card",
      },
      { text: "Add to pack? (y/n)", variant: "card" },
    ],
  },
  { kind: "wait", ms: 1200 },
  { kind: "typed-line", variant: "prompt", text: "y", appendToLast: true },
  { kind: "wait", ms: 400 },
  { kind: "output", lines: [{ text: "✓ Packed.", variant: "success" }] },
  { kind: "wait", ms: 1500 },
  {
    kind: "scene-break",
    text: "— days later, a different project —",
    ms: 2000,
    nextTitle: "kanban-board · claude",
  },
  {
    kind: "typed-line",
    variant: "prompt",
    text: "make the board cards draggable between columns",
  },
  { kind: "wait", ms: 800 },
  {
    kind: "output",
    lineDelayMs: 400,
    lines: [
      {
        text: "Planning: board view, drag layer, column drop targets…",
        variant: "dim",
      },
    ],
  },
  { kind: "wait", ms: 1000 },
  {
    // The report card — demo-script v2: the real gated-report voice
    // (docs/real-output-captures.md capture 2), compressed to three lines.
    // The Matched clause quotes Act 1's `packs when:` line verbatim.
    kind: "output",
    group: "report",
    lines: [
      { text: "⌖ dnd-kit — github.com/clauderic/dnd-kit", variant: "report" },
      {
        text: "Modular drag-and-drop toolkit for React.",
        variant: "report-body",
      },
      {
        text: 'Matched: "drag-and-drop, sortable lists, draggable UI"',
        variant: "report-body",
      },
    ],
  },
  { kind: "wait", ms: 2500 },
  {
    kind: "output",
    lines: [{ text: "Using dnd-kit for the drag layer.", variant: "output" }],
  },
  { kind: "wait", ms: 1000 },
  {
    kind: "output",
    lines: [
      { text: "✓ Cards draggable between columns.", variant: "success" },
    ],
  },
  { kind: "wait", ms: 4000 }, // hold final frame
];

const LOOP_FADE_MS = 400;

/* ==========================================================================
 * Timeline engine — a pausable async walk through DEMO_SCRIPT. Each step
 * mutates `stateRef`/React state through `updateState`; every wait between
 * (and inside) steps goes through `pausableDelay`, which is the single choke
 * point pause/resume and off-screen suspension act on.
 * ========================================================================== */

interface Ctl {
  cancelledRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
}

function jitterMs(): number {
  // 35ms/char ±10ms, per demo-script.md.
  return Math.round(35 + (Math.random() * 20 - 10));
}

function pausableDelay(ms: number, ctl: Ctl): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) return resolve();
    let remaining = ms;
    let last = performance.now();
    const POLL_MS = 50;

    const tick = () => {
      if (ctl.cancelledRef.current) return resolve();
      if (ctl.pausedRef.current) {
        last = performance.now();
        setTimeout(tick, POLL_MS);
        return;
      }
      const now = performance.now();
      remaining -= now - last;
      last = now;
      if (remaining <= 0) return resolve();
      setTimeout(tick, Math.min(remaining, POLL_MS));
    };

    setTimeout(tick, Math.min(remaining, POLL_MS));
  });
}

/** Blocks until unpaused (or cancelled) without mutating any state — this is
 * what keeps the demo from rendering so much as an empty prompt line before
 * it has ever scrolled into view. */
function waitUntilUnpaused(ctl: Ctl): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (ctl.cancelledRef.current || !ctl.pausedRef.current) return resolve();
      setTimeout(check, 50);
    };
    check();
  });
}

type Updater = (updater: (s: FrameState) => FrameState) => void;

async function runTypedLine(
  step: Extract<Step, { kind: "typed-line" }>,
  update: Updater,
  ctl: Ctl,
  nextId: () => string,
) {
  const chars = Array.from(step.text);

  if (step.appendToLast) {
    let base = "";
    update((s) => {
      base = s.lines.length > 0 ? s.lines[s.lines.length - 1].text : "";
      return s;
    });
    // Separate the typed answer from the prompt text ("(y/n) y", matching
    // the static reduced-motion fallback), never "(y/n)y".
    if (base && !base.endsWith(" ")) base += " ";
    for (let i = 0; i <= chars.length; i++) {
      if (ctl.cancelledRef.current) return;
      const partial = chars.slice(0, i).join("");
      update((s) => {
        const lines = s.lines.slice();
        const idx = lines.length - 1;
        if (idx < 0) return s;
        lines[idx] = {
          ...lines[idx],
          text: base + partial,
          cursor: i < chars.length,
        };
        return { ...s, lines };
      });
      if (i < chars.length) await pausableDelay(jitterMs(), ctl);
    }
    return;
  }

  const id = nextId();
  for (let i = 0; i <= chars.length; i++) {
    if (ctl.cancelledRef.current) return;
    const partial = chars.slice(0, i).join("");
    update((s) => {
      const lines = s.lines.slice();
      const idx = lines.findIndex((l) => l.id === id);
      const line: RenderLine = {
        id,
        text: partial,
        variant: step.variant,
        cursor: i < chars.length,
      };
      if (idx === -1) lines.push(line);
      else lines[idx] = line;
      return { ...s, lines };
    });
    if (i < chars.length) await pausableDelay(jitterMs(), ctl);
  }
}

async function runOutput(
  step: Extract<Step, { kind: "output" }>,
  update: Updater,
  ctl: Ctl,
  nextId: () => string,
) {
  for (let i = 0; i < step.lines.length; i++) {
    if (ctl.cancelledRef.current) return;
    const { text, variant } = step.lines[i];
    const id = nextId();
    update((s) => ({
      ...s,
      lines: [...s.lines, { id, text, variant, group: step.group }],
    }));
    if (i < step.lines.length - 1) {
      await pausableDelay(step.lineDelayMs ?? 120, ctl);
    }
  }
}

async function runSceneBreak(
  step: Extract<Step, { kind: "scene-break" }>,
  update: Updater,
  ctl: Ctl,
) {
  update((s) => ({ ...s, sceneBreak: step.text }));
  await pausableDelay(step.ms, ctl);
  if (ctl.cancelledRef.current) return;
  update(() => ({ title: step.nextTitle, lines: [], sceneBreak: null }));
}

async function runScript(
  update: Updater,
  ctl: Ctl,
  setFading: (v: boolean) => void,
) {
  let idCounter = 0;
  const nextId = () => `l${idCounter++}`;

  // The component's initial React state is already act 1's empty starting
  // frame, so the first iteration needs no reset — only the loop-back does.
  while (!ctl.cancelledRef.current) {
    for (const step of DEMO_SCRIPT) {
      if (ctl.cancelledRef.current) return;
      await waitUntilUnpaused(ctl);
      if (ctl.cancelledRef.current) return;

      switch (step.kind) {
        case "typed-line":
          await runTypedLine(step, update, ctl, nextId);
          break;
        case "output":
          await runOutput(step, update, ctl, nextId);
          break;
        case "wait":
          await pausableDelay(step.ms, ctl);
          break;
        case "scene-break":
          await runSceneBreak(step, update, ctl);
          break;
      }
    }

    if (ctl.cancelledRef.current) return;
    await waitUntilUnpaused(ctl);
    if (ctl.cancelledRef.current) return;

    // Restart: fade the final frame out, swap content back to act 1's empty
    // start while fully invisible, then fade the fresh frame back in — the
    // content swap itself is never seen, only the two 400ms opacity ramps.
    setFading(true);
    await pausableDelay(LOOP_FADE_MS, ctl);
    if (ctl.cancelledRef.current) return;
    update(() => ({ title: ACT_1_TITLE, lines: [], sceneBreak: null }));
    setFading(false);
  }
}

/* ==========================================================================
 * Presentation
 * ========================================================================== */

const VARIANT_CLASS: Record<LineVariant, string> = {
  prompt: "text-ink font-medium",
  card: "text-ink-muted",
  success: "text-forest-600 font-medium",
  dim: "text-ink-faint italic",
  output: "text-ink",
  report: "font-medium",
  "report-body": "text-ink pl-[2ch]",
};

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.125em] animate-pulse bg-ink-muted align-text-bottom motion-reduce:animate-none"
    />
  );
}

function DemoLine({ line }: { line: RenderLine }) {
  const isReport = line.variant === "report";
  const [visible, setVisible] = useState(!isReport);

  useEffect(() => {
    if (!isReport) return;
    // Double rAF so the initial (opacity:0, translateY:4px) state actually
    // paints before we flip to the transitioned-to state — otherwise the
    // browser may coalesce both states into one frame and skip the fade.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (
    <>
      {line.variant === "prompt" && (
        <span className="mr-2 select-none text-forest-600">❯</span>
      )}
      <span>{line.text}</span>
      {line.cursor && <Caret />}
    </>
  );

  if (isReport) {
    return (
      <p
        className={cn(
          "transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none",
          VARIANT_CLASS.report,
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-[4px] opacity-0",
        )}
        style={{ color: "var(--color-report)" }}
      >
        {content}
      </p>
    );
  }

  return <p className={VARIANT_CLASS[line.variant]}>{content}</p>;
}

function renderLines(lines: RenderLine[]) {
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.group === "card") {
      const group: RenderLine[] = [];
      while (i < lines.length && lines[i].group === "card") {
        group.push(lines[i]);
        i++;
      }
      nodes.push(
        <div
          key={`card-${group[0].id}`}
          className="my-1 space-y-1 rounded-md border border-ink/15 bg-paper-100/70 px-3 py-2.5"
        >
          {group.map((l) => (
            <DemoLine key={l.id} line={l} />
          ))}
        </div>,
      );
    } else {
      nodes.push(<DemoLine key={line.id} line={line} />);
      i++;
    }
  }
  return nodes;
}

function SceneBreakStamp({ text }: { text: string }) {
  return (
    <div
      className="flex min-h-32 items-center justify-center gap-2 py-6 text-center"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      <svg
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
        className="shrink-0 text-trail-500"
      >
        <use href="#icon-waypoint" />
      </svg>
      <span className="italic text-ink-muted">{text}</span>
    </div>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {playing ? (
        <>
          <path d="M8 5v14" />
          <path d="M16 5v14" />
        </>
      ) : (
        <path d="M7 4.5v15l13-7.5-13-7.5Z" />
      )}
    </svg>
  );
}

export interface TerminalDemoProps {
  className?: string;
}

export function TerminalDemo({ className }: TerminalDemoProps) {
  const [state, setState] = useState<FrameState>({
    title: ACT_1_TITLE,
    lines: [],
    sceneBreak: null,
  });
  const [fading, setFading] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const stateRef = useRef(state);
  const cancelledRef = useRef(false);
  const pausedRef = useRef(true); // true until first proven visible+playing
  const startedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const update: Updater = useCallback((updater) => {
    stateRef.current = updater(stateRef.current);
    setState(stateRef.current);
  }, []);

  // Pause/resume when scrolled off-screen — starts only once visible.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause the instant the tab is backgrounded. IntersectionObserver only
  // tracks viewport geometry — a backgrounded-but-scrolled-into-view tab
  // wouldn't otherwise flip `isVisible`, and the beat-script's setTimeout
  // loop would keep ticking (and mutating React state) while hidden.
  useEffect(() => {
    const onVisibilityChange = () => setPageHidden(document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Re-sync if the OS-level reduced-motion preference flips mid-session.
  // Demo.astro's `motion-reduce:` CSS already swaps the visible frame
  // instantly (a live media query, no JS needed for that part) — this only
  // stops the now-hidden timeline from continuing to tick behind
  // `display:none`.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    pausedRef.current =
      userPaused || !isVisible || pageHidden || prefersReducedMotion;
  }, [userPaused, isVisible, pageHidden, prefersReducedMotion]);

  // Start the timeline once. It idles (via waitUntilUnpaused) until the
  // section first scrolls into view.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    cancelledRef.current = false;
    const ctl: Ctl = { cancelledRef, pausedRef };
    void runScript(update, ctl, setFading);
    return () => {
      cancelledRef.current = true;
    };
  }, [update]);

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-3", className)}>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-ink/15 bg-paper-50 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-center gap-2 border-b border-ink/10 bg-paper-200/70 px-4 py-2.5">
          <svg
            width="14"
            height="14"
            className="shrink-0 text-trail"
            aria-hidden="true"
            focusable="false"
          >
            <use href="#icon-waypoint" />
          </svg>
          <p className="truncate font-mono text-xs text-ink-muted">
            {state.title}
          </p>
        </div>
        <div
          className="min-h-72 overflow-x-auto p-4 font-mono text-sm [overflow-wrap:anywhere] sm:p-5"
          style={{
            opacity: fading ? 0 : 1,
            transition: `opacity ${LOOP_FADE_MS}ms ease-out`,
          }}
        >
          {state.sceneBreak ? (
            <SceneBreakStamp text={state.sceneBreak} />
          ) : (
            <div className="space-y-1.5">{renderLines(state.lines)}</div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setUserPaused((p) => !p)}
        aria-pressed={userPaused}
        aria-label={userPaused ? "Play demo animation" : "Pause demo animation"}
        className={cn(
          "inline-flex w-fit items-center gap-2 self-start rounded-md border border-ink/15 bg-paper-100 px-3 py-1.5 text-xs font-medium text-ink-muted",
          "transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none",
          "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-200",
          "active:scale-[0.97] motion-reduce:active:scale-100",
          "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      >
        <PlayPauseIcon playing={!userPaused} />
        <span>{userPaused ? "Play" : "Pause"}</span>
      </button>
    </div>
  );
}

export default TerminalDemo;
