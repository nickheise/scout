#!/usr/bin/env node
// scout-compile.mjs — manifest + standing-instructions compiler (docs/plan.md
// §2 task 2.1, PRD §5.3, docs/research/file-format-patterns.md).
//
// Reads the active entries of a pack dir (via scout-store.mjs, never
// reimplemented) and produces the two compiled artifacts described in PRD
// §5.3:
//
//   1. The manifest — the `ambient_line` of every status:active pack entry,
//      hard-capped (default 25, PRD §12.6/P-4 — a named tunable constant,
//      not a magic number). Exceeding the cap stops compilation with a
//      pointer to /scout:archive; compile never decides what to drop.
//   2. The standing-instructions block — every status:active step entry
//      whose phase is "ongoing" or "milestone", rendered as its own
//      `instruction` text verbatim, PLUS any phase:"init" step that also
//      declares a `produces` artifact (PRD §5.3 models steps like changelog
//      as "init+ongoing" — scaffold once, then maintain for the life of the
//      project; the phase enum is single-valued, so that ongoing half is
//      signaled by a non-null `produces` instead of a second phase value).
//      Plain phase:"init" steps with no `produces` are pure start-time
//      scaffolding and stay out; phase:"wrap" steps run at project close —
//      neither belongs in a block that lives in context continuously.
//
// A third, independent output — the **matching index** (PRD §5.3/§5.6: "the
// host agent judges the plan against the full active surfaces_when index")
// — is available via `--index` / `indexLines`. One line per active pack
// entry: `id: condition 1; condition 2; ...`. Unlike the manifest, the index
// is never capped or blocked by the manifest cap — it exists so
// scout-hook-plan.mjs (task 3.1) has cheap, complete matching material even
// on a planning moment where the manifest itself is over cap.
//
// This module is both a CLI and a library (mirrors scout-store.mjs) so
// skills/start, scout-mcp.mjs, and scout-hook-plan.mjs can call compilePack()
// in-process instead of shelling out.
//
// Zero npm dependencies: plain Node >= 18 built-ins + scout-store.mjs only.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePackDir, listEntries } from './scout-store.mjs';

const __filename = fileURLToPath(import.meta.url);

// PRD §12.6 / P-4: "manifest cap value (25 = starting hypothesis; ship as
// tunable constant)". Overridable per-call (--cap) for testing and for a
// future setting, but this is the shipped default.
export const DEFAULT_MANIFEST_CAP = 25;

const STANDING_PHASES = ['ongoing', 'milestone'];

/**
 * Render one matching-index line for an active pack entry: "id: cond1;
 * cond2; ...". `surfaces_when` is required non-empty on pack entries by
 * schema/entry.v1.json, so no fallback is needed here.
 */
function renderIndexLine(entry) {
  return `${entry.id}: ${entry.surfaces_when.join('; ')}`;
}

/**
 * True if a step entry belongs in the standing-instructions block: its own
 * phase is one of STANDING_PHASES, OR it's a phase:"init" step that also
 * maintains an artifact (`produces` is non-null). The latter is the
 * init+ongoing case (PRD §5.3, e.g. changelog: scaffold CHANGELOG.md once,
 * then keep it updated for the life of the project) — the schema's phase
 * enum can only hold one value, so the ongoing-maintenance half is signaled
 * by `produces` rather than a second phase.
 */
function isStandingStep(e) {
  return STANDING_PHASES.includes(e.phase) || (e.phase === 'init' && Boolean(e.produces));
}

/**
 * Compile a pack dir into the manifest + standing-instructions artifacts.
 * Pure read — never writes anything. Returns a plain object; throws nothing
 * of its own (propagates whatever listEntries throws, which is nothing —
 * listEntries degrades to an empty pack on a missing dir).
 *
 * Shape:
 *   {
 *     cap, packCount, manifestLines: string[],
 *     indexLines: string[],  // matching index, always populated regardless
 *                             // of overCap (see module header) — one
 *                             // "id: cond1; cond2; ..." line per active
 *                             // pack entry, id-alphabetical
 *     standingSteps: [{ id, title, phase, instruction }],
 *     overCap: boolean, overflowIds: string[] (only when overCap),
 *     body: string   // the assembled managed-block body text (empty when
 *                     // overCap is true — there is nothing safe to inject)
 *     warnings: string[]  // unreadable entry files, passed through
 *   }
 */
export function compilePack(packDir, opts = {}) {
  const cap = Number.isInteger(opts.cap) ? opts.cap : DEFAULT_MANIFEST_CAP;

  const { entries: packEntries, warnings: packWarnings } = listEntries(packDir, {
    type: 'pack',
    status: 'active',
  });
  const { entries: stepEntries, warnings: stepWarnings } = listEntries(packDir, {
    type: 'step',
    status: 'active',
  });
  const warnings = [...packWarnings, ...stepWarnings];

  // listEntries() already sorts by id; that's our determinism source (golden
  // tests depend on stable ordering across runs).
  const manifestLines = packEntries.map((e) => e.ambient_line);
  // The matching index is independent of the manifest cap (module header) —
  // compute it unconditionally so both return branches below carry it.
  const indexLines = packEntries.map(renderIndexLine);

  if (manifestLines.length > cap) {
    return {
      cap,
      packCount: manifestLines.length,
      manifestLines: [],
      indexLines,
      standingSteps: [],
      overCap: true,
      overflowIds: packEntries.map((e) => e.id),
      body: '',
      warnings,
    };
  }

  // Group ongoing-or-equivalent steps (phase:"ongoing", plus phase:"init"
  // steps with a `produces` — see isStandingStep) before phase:"milestone"
  // steps, for a readable block; id order is preserved as the secondary
  // sort within each group (listEntries()'s alphabetical order).
  const standingSteps = [
    ...stepEntries.filter((e) => isStandingStep(e) && e.phase !== 'milestone'),
    ...stepEntries.filter((e) => e.phase === 'milestone'),
  ].map((e) => ({ id: e.id, title: e.title, phase: e.phase, instruction: e.instruction }));

  const body = renderBody(manifestLines, standingSteps);

  return {
    cap,
    packCount: manifestLines.length,
    manifestLines,
    indexLines,
    standingSteps,
    overCap: false,
    overflowIds: [],
    body,
    warnings,
  };
}

function renderBody(manifestLines, standingSteps) {
  const sections = [];

  if (manifestLines.length > 0) {
    sections.push(
      [
        '## Scout pack',
        '',
        "The following tools and practices are in the user's active Scout pack.",
        "Reach for them when they genuinely fit — see `/scout:explain <id>` for",
        'full detail on any entry.',
        '',
        ...manifestLines.map((line) => `- ${line}`),
      ].join('\n')
    );
  }

  if (standingSteps.length > 0) {
    sections.push(
      [
        '## Scout standing instructions',
        '',
        ...standingSteps.map((s) => `- ${s.instruction}`),
      ].join('\n')
    );
  }

  return sections.join('\n\n');
}

function overCapMessage(result) {
  return [
    `scout-compile: manifest exceeds cap: ${result.packCount} active pack ` +
      `entries but only ${result.cap} allowed.`,
    'Archive or demote some before compiling — see /scout:archive.',
    `Over-cap entries (alphabetical): ${result.overflowIds.join(', ')}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') flags.json = true;
    else if (arg === '--index') flags.index = true;
    else if (arg === '--pack') flags.pack = argv[++i];
    else if (arg === '--cap') flags.cap = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') flags.help = true;
  }
  return flags;
}

function usage() {
  return [
    'usage: scout-compile.mjs [--pack <dir>] [--cap <n>] [--json] [--index]',
    '',
    'Compiles the active pack into the manifest + standing-instructions block.',
    'Prints the assembled block body to stdout (ready to pipe into',
    'scout-block.mjs write <file>). --json prints the structured pieces',
    'instead (manifestLines, standingSteps, body, cap, ...).',
    '',
    '--index prints the matching index instead (PRD §5.3/§5.6): one',
    '"id: cond1; cond2; ..." line per active pack entry, id-alphabetical.',
    'Never blocked by the manifest cap — with --json, prints {"indexLines":',
    '[...]} instead of newline-joined text.',
    '',
    'Exits 1 (no output body) if the manifest exceeds its cap — the error',
    'message names the overflow and points to /scout:archive. --index is',
    'unaffected by this (it exits 0 regardless of manifest cap state).',
  ].join('\n');
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(usage());
    return;
  }
  const packDir = resolvePackDir(flags);
  const result = compilePack(packDir, { cap: flags.cap });

  for (const w of result.warnings) {
    console.error(`scout-compile: warning: skipped unreadable entry: ${w}`);
  }

  if (flags.index) {
    if (flags.json) {
      console.log(JSON.stringify({ indexLines: result.indexLines }, null, 2));
    } else if (result.indexLines.length > 0) {
      console.log(result.indexLines.join('\n'));
    }
    return;
  }

  if (result.overCap) {
    if (flags.json) {
      console.log(
        JSON.stringify(
          { error: 'CAP_EXCEEDED', cap: result.cap, count: result.packCount, overflowIds: result.overflowIds },
          null,
          2
        )
      );
    } else {
      console.error(overCapMessage(result));
    }
    process.exit(1);
  }

  if (flags.json) {
    console.log(
      JSON.stringify(
        {
          cap: result.cap,
          packCount: result.packCount,
          manifestLines: result.manifestLines,
          standingSteps: result.standingSteps,
          body: result.body,
        },
        null,
        2
      )
    );
  } else {
    process.stdout.write(result.body + (result.body.endsWith('\n') ? '' : '\n'));
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}
