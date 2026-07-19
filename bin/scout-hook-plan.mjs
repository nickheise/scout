#!/usr/bin/env node
// scout-hook-plan.mjs — the planning-moment hook (docs/plan.md §4 task 3.1,
// PRD §5.6/§5.7, docs/research/hook-spike.md, DECISIONS.md D-013).
//
// Registered by hooks/hooks.json on:
//   - PreToolUse  matcher "ExitPlanMode"  (primary — hook-spike Q1: fires
//     with the full plan text in tool_input.plan, synchronously, exactly at
//     the planning moment)
//   - PostToolUse matcher "TodoWrite"     (fallback — hook-spike Q3: fires
//     for users who skip plan mode and go straight to a todo-driven session;
//     tool_input.todos is the full replacement list every call)
//
// Contract (plan §3 binding rules + docs/research/ecosystem-survey.md "hook
// discipline to copy"): cheap, no LLM call, no network, lean output, <100ms
// target, SILENT fast-exit (exit 0, no stdout) whenever there's nothing
// worth pointing at. The hook POINTS; the host agent JUDGES — this script
// never itself decides whether a pack entry is relevant, it only hands the
// host agent the full matching index (bin/scout-compile.mjs --index) and a
// one-line instruction to apply the scout surfacing discipline (skills/
// surfacing, gate + cap 2 + "nothing surfaced is a good result").
//
// Fast-exit guards, in order (first hit wins, always exit 0 with zero
// stdout — never throw, never leave a partial write):
//   1. malformed/absent stdin JSON
//   2. SCOUT_HOOK_OFF=1 — explicit user/ops disable switch
//   3. best-effort child/subagent-context guard (see looksLikeChildContext)
//   4. plan/todo text under MIN_TEXT_CHARS
//   5. pack dir missing, or zero active pack entries (compilePack() already
//      degrades a missing dir to zero entries, so one check covers both)
//
// Delivery (D-013 — dual delivery behind a named constant, because hook-
// spike.md Q2 could not confirm live whether hookSpecificOutput.
// additionalContext demonstrably reaches the model in this sandbox):
//   DELIVERY = 'context' (default, ships first): emit
//     {"hookSpecificOutput":{"hookEventName":..., "additionalContext":...}}
//     on stdout, exit 0. Non-blocking — if Q2 turns out false, this is a
//     silent no-op, not a regression, just zero-marginal-value.
//   DELIVERY = 'block' (verified fallback, PreToolUse only): write the
//     pointer to stderr and exit 2 — the platform's universally-documented
//     "block the tool call, feed stderr back to the model as the reason"
//     contract (verified mechanism, coarser UX: it interrupts ExitPlanMode
//     once rather than quietly informing). Not meaningful on PostToolUse
//     (the tool already ran) — if DELIVERY is 'block' but the firing event
//     is PostToolUse(TodoWrite), this script falls back to 'context'
//     delivery for that call rather than blocking a no-op.
//   See docs/hook-selfcheck.md for the two-minute procedure to determine
//   which delivery actually reaches the model on a given machine, and how to
//   flip the default.
//
// SCOUT_HOOK_DELIVERY env var overrides the DELIVERY constant for a single
// invocation — a test/ops escape hatch (see test/hook.test.mjs and
// docs/hook-selfcheck.md) so both code paths are exercisable without editing
// this file. Real deployments should flip the DELIVERY constant itself, not
// rely on an env var nobody set.
//
// Zero npm dependencies: plain Node >= 18 built-ins + scout-store.mjs +
// scout-compile.mjs only (both already zero-dep, never reimplemented here).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePackDir } from './scout-store.mjs';
import { compilePack } from './scout-compile.mjs';

// ---------------------------------------------------------------------------
// Tunable constants (named, not magic numbers — plan §3 / house style)
// ---------------------------------------------------------------------------

/** D-013: the shipped default. Flip via docs/hook-selfcheck.md's procedure. */
export const DELIVERY = 'context'; // 'context' | 'block'

/**
 * Minimum trimmed character length of the extracted plan/todo text before
 * the hook bothers building a pointer. A one-liner like "ok let's start" has
 * no matching material worth judging against the index — firing on it is
 * exactly the "chatty system" ecosystem-survey.md warns gets learned around.
 */
export const MIN_TEXT_CHARS = 40;

/**
 * Hard ceiling on the emitted pointer message, "far under the 10k-char hook
 * output cap" per task 3.1. Chosen well below both that cap and typical
 * manifest-cap-scale packs (25 entries * a few conditions each comfortably
 * fits); exists so a pathological pack (many entries, verbose surfaces_when)
 * can't blow the cap. Truncation is defensive, not expected in practice.
 */
export const MAX_OUTPUT_CHARS = 4000;

const POINTER_PREFACE =
  'Scout: planning moment. Judge this plan against the pack index below via the scout surfacing discipline (max 2 reports; nothing is a good result).';

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Best-effort, defense-in-depth child/subagent-context guard. NOT verified
 * against a live hook envelope (docs/research/hook-spike.md Q1 caveat): the
 * `agentId`/`teamName` pair is confirmed to gate a *different* internal
 * ExitPlanMode code path (the multi-agent "team" flow), not confirmed to
 * appear on the hook's own top-level envelope or tool_input. Checked
 * defensively at both locations anyway, at zero cost, in case it does — if
 * it never appears, this guard is simply inert and SCOUT_HOOK_OFF remains
 * the one confirmed disable mechanism (hook-spike.md Q4).
 */
export function looksLikeChildContext(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const candidates = [payload, payload.tool_input];
  return candidates.some((o) => o && typeof o === 'object' && o.agentId && o.teamName);
}

/**
 * Extract the plan/todo text to threshold-check and (eventually) let the
 * host agent judge. Returns '' when nothing extractable — that's a fast-exit
 * case, not an error.
 *
 * ExitPlanMode: tool_input.plan is the full plan text (hook-spike.md Q1,
 * source-verified). Q1 also flags planFilePath as the authoritative fallback
 * if plan is ever empty/absent (the gated multi-agent flow omits `plan`
 * entirely) — honored here defensively even though Scout's target is a
 * plain single-session run.
 *
 * TodoWrite: tool_input.todos is the full replacement list every call
 * (hook-spike.md Q3, source-verified); every todo's `content` joined is
 * plenty of matching material.
 */
export function extractText(payload) {
  const toolName = payload && payload.tool_name;
  const toolInput = (payload && payload.tool_input) || {};

  if (toolName === 'ExitPlanMode') {
    if (typeof toolInput.plan === 'string' && toolInput.plan.trim()) {
      return toolInput.plan;
    }
    if (typeof toolInput.planFilePath === 'string' && toolInput.planFilePath) {
      try {
        return fs.readFileSync(toolInput.planFilePath, 'utf8');
      } catch {
        return '';
      }
    }
    return '';
  }

  if (toolName === 'TodoWrite') {
    const todos = Array.isArray(toolInput.todos) ? toolInput.todos : [];
    return todos
      .map((t) => (t && typeof t.content === 'string' ? t.content : ''))
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

// ---------------------------------------------------------------------------
// Message assembly
// ---------------------------------------------------------------------------

/**
 * Build the compact pointer message: the fixed preface plus the matching
 * index, truncated defensively (whole lines only, never mid-line) to stay
 * under MAX_OUTPUT_CHARS. Returns { text, truncated }.
 */
export function buildMessage(indexLines) {
  const full = [POINTER_PREFACE, '', ...indexLines].join('\n');
  if (full.length <= MAX_OUTPUT_CHARS) {
    return { text: full, truncated: false };
  }

  // Truncate to whole index lines that fit, leaving room for the preface and
  // a truncation note that names how much was cut.
  const kept = [];
  let used = POINTER_PREFACE.length + 1; // + blank separator line
  for (const line of indexLines) {
    const cost = line.length + 1; // + newline
    if (used + cost > MAX_OUTPUT_CHARS - 120) break; // reserve room for the note
    kept.push(line);
    used += cost;
  }
  const note = `[truncated: showing ${kept.length} of ${indexLines.length} pack index entries — output capped well under the 10k-char hook limit]`;
  const text = [POINTER_PREFACE, '', ...kept, '', note].join('\n');
  return { text, truncated: true };
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/**
 * Pure: decide what to write where and what exit code to use, without
 * actually touching process.stdout/stderr/exit — that's left to main() so
 * this stays trivially unit-testable. `delivery` defaults to the DELIVERY
 * constant but is overridable by SCOUT_HOOK_DELIVERY (test/ops escape
 * hatch — see module header) or an explicit argument.
 */
export function planDelivery(event, message, delivery = DELIVERY) {
  const useBlock = delivery === 'block' && event === 'PreToolUse';
  if (useBlock) {
    return { stream: 'stderr', text: message.text + '\n', exitCode: 2 };
  }
  const payload = {
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: message.text,
    },
  };
  return { stream: 'stdout', text: JSON.stringify(payload), exitCode: 0 };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function readStdin() {
  if (process.stdin.isTTY) return null;
  try {
    const text = fs.readFileSync(0, 'utf8');
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

function resolveDelivery() {
  const override = process.env.SCOUT_HOOK_DELIVERY;
  if (override === 'context' || override === 'block') return override;
  return DELIVERY;
}

function main() {
  const raw = readStdin();
  if (!raw) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
    return;
  }

  if (process.env.SCOUT_HOOK_OFF === '1') process.exit(0);
  if (looksLikeChildContext(payload)) process.exit(0);

  const event = payload.hook_event_name;
  const text = extractText(payload);
  if (text.trim().length < MIN_TEXT_CHARS) process.exit(0);

  const packDir = resolvePackDir({});
  const { packCount, indexLines } = compilePack(packDir);
  if (packCount === 0) process.exit(0);

  const message = buildMessage(indexLines);
  const delivery = planDelivery(event, message, resolveDelivery());

  if (delivery.stream === 'stderr') {
    process.stderr.write(delivery.text);
  } else {
    process.stdout.write(delivery.text);
  }
  process.exit(delivery.exitCode);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}
