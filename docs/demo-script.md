# Demo Script — Beat 2 "The Moment"

**Status:** v2 — reconciled against real plugin v0.4.0 output (D-011; captures in `docs/real-output-captures.md`, 2026-07-19). Nick's reconciliation calls: Act 2 report renders as the real compressed card (not a one-liner); no no-op scene (two acts stay); Beat 3 copy softened to "compact reports." Builders implement strings and timing **verbatim** as the beat-script data for the TerminalDemo island.

## Format

Two acts in one styled terminal frame (TerminalFrame component, paper-register chrome — not a black terminal). All text is real DOM text. The **report card in Act 2 is the only element on the entire site that uses `--color-report`**.

- Typing speed: 35ms/char (±10ms jitter). Command output appears line-by-line, 120ms/line.
- Pauses noted as `[wait Ns]`.
- Total loop ≈ 30s, hold final frame 4s, 400ms fade, restart.
- Controls: pause/play affordance (WCAG 2.2.2). Starts only when scrolled into view (`client:visible` + IntersectionObserver).
- `prefers-reduced-motion`: no animation — render Act 1 final frame and Act 2 final frame as two static stacked frames with the scene-break stamp between them.

## Act 1 — Packing (≈8s)

Window title: `side-project · claude`

```
❯ /scout:add https://github.com/clauderic/dnd-kit
```
`[wait 0.8s]` then output, as a drafted-entry card (indented block, subtle border):

```
  dnd-kit — modular drag-and-drop toolkit for React
  packs when: drag-and-drop, sortable lists, draggable UI
  Add to pack? (y/n)
```
`[wait 1.2s]` user types `y` `[wait 0.4s]`

```
  ✓ Packed.
```
`[wait 1.5s]`

## Scene break (≈2s)

Stamp-style interstitial across the frame (display face, waypoint mark):
**— days later, a different project —**

## Act 2 — The report (≈14s)

Window title: `kanban-board · claude`

```
❯ make the board cards draggable between columns
```
`[wait 0.8s]` agent plan lines appear (muted/dim text, 400ms apart):

```
  Planning: board view, drag layer, column drop targets…
```
`[wait 1.0s]` — then the report card appears as one unit (400ms ease-out fade + 4px rise; **the** signal-color moment — signal color on the title line + card's left border, body lines in ink). Format mirrors the real gated-report voice (capture 2), compressed to three lines; the Matched clause quotes Act 1's `packs when:` line verbatim, tying the acts together:

```
  ⌖ dnd-kit — github.com/clauderic/dnd-kit
    Modular drag-and-drop toolkit for React.
    Matched: "drag-and-drop, sortable lists, draggable UI"
```
`[wait 2.5s]` agent continues (normal text):

```
  Using dnd-kit for the drag layer.
```
`[wait 1.0s]`

```
  ✓ Cards draggable between columns.
```

Hold 4s. Loop.

## The property being demonstrated

The user in Act 2 never searches, never remembers, never invokes anything — the report just appears mid-plan. Nothing in the animation may undercut this (no cursor moving toward the report, no fake "scout thinking…" spinner). "Oh, it just *shows up*?" is the target reaction (PRD §8).
