# Field reports — evaluating the Drop skill's self-improvement loop for Scout — 2026-07-24

Cross-pollination from the Drop deploy skill's v2.9 retro (relayed from
the "Drop skill improvements" session, 2026-07-24, at Nick's request).
Drop's insight: a skill hits edge cases in each user's *particular*
environment, and that knowledge evaporates with the session — their v2.9
was built from a retro that was only possible because one transcript
happened to survive. Their (endorsed, unbuilt) answer is a "field report"
loop: deviation-triggered capture → structured, version-stamped notes →
central collection → human-in-the-loop promotion into releases.

This note evaluates the design against Scout's architecture and tenets.
Status: **proposal for discussion (R6)** — nothing here is built, and it
joins the R1–R5 queue from `skill-checklist-review.md` awaiting the
owner's ruling.

## What Scout already has (independently converged)

Three of Drop's five pillars have existing Scout twins, which is strong
evidence the pattern fits:

- **Deviation-triggered, capped, structured capture** — the rejection
  ledger (`.scout/ledger.jsonl`): closed-enum reasons, one line per event,
  compact JSON, "logged, never shown." Same discipline, different subject
  (it records *gate decisions about pack content*, not *skill mechanics*).
- **User-corrections-as-telemetry** — dismissal capture (D-008): an
  explicit wave-off is already treated as the highest-signal correction
  there is, recorded with context and consumed later. Drop generalizes
  this from "the user declined a report" to "the user corrected the
  skill's behavior mid-run."
- **Notes-are-data-not-instructions** — surfacing Hard Rule 6 / add Hard
  Rule 2, verbatim the same trust rule for the same reason (content
  authored inside arbitrary contexts is an injection surface).

And the loop's closing rule — *the plugin never updates itself from
notes; a maintainer eval promotes changes into releases* — is Scout's
three-plane update model already: code changes ship subscribe-not-fork,
and nothing Scout ships ever rewrites user data.

## What transfers (the R6 core)

A **field-notes channel for skill mechanics**: when a Scout skill run
deviates, write one structured note. Trigger contract (mechanical, not
vibes — Drop's key defense against LLM over-reporting):

1. a documented step failed and the run had to adapt (e.g. a store/compile
   CLI invocation errored and the usage-line fallback was used);
2. the environment fell outside what the skill documents (e.g.
   `CLAUDE_PLUGIN_ROOT` unset in a context the CLI note doesn't cover);
3. the user corrected the skill mid-run — routing was wrong, a draft
   misunderstood the input shape, a confirmation had to be walked back.

Hard cap one note per run; smooth runs write nothing. Note shape (JSONL,
one compact object, ledger house style): plugin version (**mandatory** —
it is what lets the eval drop already-fixed issues), skill + step,
platform, what happened / what the docs said / what was done instead /
did it work, proposed change, confidence. Version stamping needs the
plugin version to be *readable at runtime* — plugin.json is in
`${CLAUDE_PLUGIN_ROOT}`, so this is available today.

This directly serves the dogfooding register in
`skill-checklist-review.md`: questions 2–4 (non-hook trigger reliability,
deletion-test evidence, hook-pointer follow rate) are exactly the kind of
signal that currently evaporates with each session. R4 and R5 are blocked
on this data.

## What does not transfer: central collection

Drop's pillar 3 (fire-and-forget writes to a shared location) is right
for an internal, single-org tool. For Scout it contradicts the Tier 0
promise as written in the README — *no server, no account, no API key* —
and "telemetry in a privacy-first open-source tool" is a reputational
one-way door regardless of how benign the payload. Scout already has the
answer to every boundary crossing: **the courier pattern.** Notes
accumulate locally; sharing them is a deliberate act by the user's own
hands — e.g. a command that assembles accumulated notes into a redacted
GitHub-issue draft the user reviews and posts themselves. Nothing
automatic, nothing best-effort, no endpoint. (Drop's pillar 5 — privacy
boundary stated up front, retention window, changelog disclosure — 
transfers verbatim to whatever the courier surface says.)

## Cost discipline (the audit applies to this too)

Capture instructions cost tokens on *every* run even though notes are
written on almost none. Constraints from D-017:

- The trigger contract lives in **one shared reference artifact**
  (thin-skills/thick-artifacts, same shape as R1–R3), pointed to in a
  line or two — never restated per skill.
- Instrument the heavy skills only (the small verbs barely have steps to
  deviate from).
- The per-skill pointer growth must fit inside existing budgets or carry
  a deliberate bump in the same diff (`test/budgets.test.mjs`).

## Proposed phasing

- **Phase A — dogfooding instrument (candidate to build with/before
  R4/R5):** local-only notes, single user (the maintainer *is* the only
  user today). No privacy surface at all yet; unblocks the deletion tests
  and trigger-reliability questions with real evidence.
- **Phase B — public loop (document-only first, D-010 pattern):** the
  courier share surface, privacy statement, retention wording, README
  disclosure. Build it only when there are real external users whose
  environments diverge — the thing Phase A cannot see.

## Open questions for the owner

1. **Scope now:** Phase A only, or design the Phase B contract up front
   so Phase A's note schema never needs a breaking change? (Leaning:
   design the schema for B, build only A — accretion-only schema
   evolution is already house rules.)
2. **Where notes live:** `.scout/` per-project (ledger precedent) or one
   global pack-adjacent location (`~/.scout/field-notes.jsonl`)? Skill-
   mechanics deviations are mostly project-independent, which argues
   global; but global means a second writable location outside the pack.
3. **Sequencing vs R1–R5:** Phase A before R4/R5 (it produces their
   evidence), alongside R2/R3, or after the whole R queue?
