# Real Scout output captures — engineering, 2026-07-19

Provenance: live runs, plugin v0.4.0 (all five build phases complete, 223/223 tests). The add capture is a real fetch of the library's repo; report + survey captures are real gate runs against Nick's seed pack. Per engineering: "this is the product's actual voice." For D-011 Beat 2 reconciliation. Filed as docs/real-output-captures.md.

## Capture 1 — /scout:add https://github.com/emilkowalski/vaul

Adding as **pack entry**: **Vaul** — draft below.

```json
{
  "schema": 1,
  "id": "vaul",
  "type": "pack",
  "title": "Vaul",
  "status": "active",
  "superseded_by": null,
  "notes": "Overlaps shadcn/ui — its drawer component is built on Vaul; keep this entry for direct use outside shadcn projects. Caveat from the repo itself: README marks the project unmaintained ('I might come back to it at some point'), last release Dec 2024.",
  "added": "2026-07-19",
  "verified": "2026-07-19",
  "dismissals": 0,
  "url": "https://vaul.emilkowal.ski",
  "repo": "https://github.com/emilkowalski/vaul",
  "stack": ["react"],
  "install": "npm i vaul",
  "summary": "A drawer component for React. Slide-out and bottom-sheet panels with swipe-to-dismiss gestures; TypeScript, MIT, 8.5k stars, though the README currently marks it unmaintained.",
  "surfaces_when": [
    "building a bottom sheet, slide-out drawer, or swipe-dismissable panel in a React app",
    "a plan needs a mobile-style sheet UI on the web without hand-rolling drag gestures"
  ],
  "ambient_line": "Vaul — drawer/bottom-sheet component for React with swipe gestures (currently unmaintained upstream).",
  "instruction": null, "phase": null, "automation": null, "produces": null
}
```

Then: "Two things before I commit: the repo declares itself unmaintained — pack it anyway with the caveat, or skip? And it overlaps shadcn/ui's drawer (which is built on this) — the distinction I've noted is 'direct use outside shadcn projects'; sound right?"

## Capture 2 — a gated report (planning moment: "add an animated gradient hero to the landing page")

**Paper Shaders** — https://github.com/paper-design/shaders
Paper Shaders — zero-dependency canvas shaders; use for animated backgrounds and gradient effects.
Matched: "a plan calls for an animated background, hero-section visual, or gradient effect on a web page"
Install: `npm i @paper-design/shaders-react`

(One card; cap is 2; rejections go to the ledger unshown.)

## Capture 3 — the signature no-op (planning moment: "refactor the auth middleware")

Scout: nothing surfaced for this plan.

(Exactly one line by Hard Rule — no apology, no explanation, no "however." Engineering recommends the demo shows this posture.)

## Capture 4 — /scout:survey close (wrap moment, sample project)

Surveyed: the last 14 days of commits (32, landing page + checkout flow).
One missed opportunity: **Paper Shaders** — the hero shipped as a 4MB looping video doing decorative-background work; matched "replacing a video file or heavyweight animation library that is only serving as a decorative background." Retrofit is contained: the hero is one component.
No dismissals to reconcile. No unpacked recurring dependencies.

## Voice notes (engineering)

Narration plain and unhurried; brand vocabulary only where sanctioned (the pack, reports, the graveyard on the browse page); commands always colon-form. More captures available against any demo-script scenario on request.

## Reconciliation deltas vs docs/demo-script.md (to raise with Nick — D-011 gives him the call)

1. **Report shape:** real reports are a compact 3–4 line card (bold title+repo, ambient line, `Matched: "<surfaces_when clause>"`, install line) — not the demo's single line ("⌖ Scout report — dnd-kit: you packed this…"). Also no "Scout report" label prefix in the real voice.
2. **Copy tension:** Beat 3 copy says "one-line reports" — true of the manifest's ambient_line, but the planning-moment report is a card. Copy may need "one-line" softened or scoped, or demo shows the card and copy stays as-is about the ambient layer. Nick's call.
3. **Add flow:** real /scout:add drafts a full entry and asks judgment questions ("pack it anyway with the caveat, or skip?") — richer than the demo's "Add to pack? (y/n)". Demo compresses for pacing (legitimately, per art-directed recreation), but the y/n framing could become a one-question confirm to match the real conversational shape.
4. **The no-op:** "Scout: nothing surfaced for this plan." is the restraint story in one line; engineering recommends the demo show it. Candidate: brief third scene between Acts (or after Act 2) — needs Nick's pacing call.
