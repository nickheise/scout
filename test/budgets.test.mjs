// test/budgets.test.mjs — context-cost budget gates (docs/research/
// token-audit.md, D-017).
//
// Budgets are freeze-plus-headroom (~5–10% above the 2026-07-20 measured
// sizes), not aspirational targets. A failing gate means an edit grew a
// user-facing artifact past its budget: either slim the artifact or bump
// the budget *in the same diff* — the bump is the reviewable line item —
// and update the numbers in docs/research/token-audit.md if they've
// drifted meaningfully. Never bump a budget to green a build without
// looking at what grew.
//
// Sizes are gated in chars (bytes of the artifact, ~4 chars per token).
// Chars, not tokens, so the gate is exact, deterministic, and zero-dep.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { MAX_OUTPUT_CHARS } from '../bin/scout-hook-plan.mjs';
import { compilePack } from '../bin/scout-compile.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const SEED_PACK = path.join(REPO_ROOT, 'fixtures', 'seed-pack');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const HOOK_BIN = path.join(REPO_ROOT, 'bin', 'scout-hook-plan.mjs');

// ---------------------------------------------------------------------------
// The budgets (chars). Measured baseline in the comment on each line.
// ---------------------------------------------------------------------------

/** Per-skill SKILL.md budgets. Every skills/<name>/SKILL.md must appear
 *  here — a new skill without a budget is itself a gate failure. */
const SKILL_BUDGETS = {
  surfacing: 16_000, // 15,574 — T2 cost center; paid every planning moment
  setup: 14_500, //     14,437 — + cross-reads add's path files (R3, D-019)
  add: 6_700, //         6,363 — R2 (D-019): paths split into path-a/path-b files below
  start: 13_500, //     13,314
  survey: 12_000, //    11,885 — + cross-reads surfacing (F3)
  archive: 5_000, //     4,516
  explain: 5_000, //     4,332
  list: 3_500, //        3,139
};

/** templates/scout-router/SKILL.md — the optional personal router. */
const ROUTER_BUDGET = 5_000; // 4,392

/** Shared reference artifacts (thin-skills direction, D-018): loaded only
 *  when a skill follows their pointer, but budgeted like everything else. */
const REFERENCE_BUDGETS = {
  'references/field-notes.md': 4_200, // 3,892 — deviation contract, loaded only on a deviating run
  'skills/add/path-a-pack-entry.md': 6_500, // 6,110 — URL→pack path (R2); loaded only on Path A runs
  'skills/add/path-b-step.md': 2_800, //      2,550 — text→step path (R2); loaded only on Path B runs
  'skills/add/skills-repos.md': 4_800, //     4,504 — meta-repo ingestion; loaded only for skills collections
};

/** The one always-in-context string (T1): surfacing's frontmatter
 *  description. ~195 tokens in every session on the machine. */
const SURFACING_DESCRIPTION_BUDGET = 900; // 785

/** Compiled managed block for the canonical seed pack (T1, cached). */
const COMPILED_BLOCK_BUDGET = 2_400; // 2,185

/** Hook additionalContext against the seed pack (T2, uncached). */
const HOOK_CONTEXT_BUDGET = 2_000; // ~1,760

/** The T2 ceiling: surfacing SKILL.md + a maximal hook injection is what
 *  one planning moment can cost (~5,000 tokens). Growth here is the
 *  reputational number — treat a bump as a product decision. */
const PLANNING_MOMENT_BUDGET = 20_000; // 15,171 + 4,000 = 19,171

/** MAX_OUTPUT_CHARS is a runtime cap, but raising it raises every
 *  planning moment's price — gate the constant itself. */
const HOOK_CAP_BUDGET = 4_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function skillPath(name) {
  return path.join(SKILLS_DIR, name, 'SKILL.md');
}

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, `${file} has YAML frontmatter`);
  return m[1];
}

// ---------------------------------------------------------------------------
// Per-skill size gates
// ---------------------------------------------------------------------------

test('every shipped skill has a budget and fits inside it', () => {
  const shipped = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const name of shipped) {
    const budget = SKILL_BUDGETS[name];
    assert.ok(
      budget !== undefined,
      `skills/${name} has no budget in test/budgets.test.mjs — new skills must declare their context cost`
    );
    const size = fs.statSync(skillPath(name)).size;
    assert.ok(
      size <= budget,
      `skills/${name}/SKILL.md is ${size} chars, budget ${budget} — slim it or bump the budget in this diff (see docs/research/token-audit.md)`
    );
  }

  // The inverse: a budget for a skill that no longer exists is stale.
  for (const name of Object.keys(SKILL_BUDGETS)) {
    assert.ok(shipped.includes(name), `budget for skills/${name} is stale — skill not found`);
  }
});

test('the bare-/scout router template fits its budget', () => {
  const size = fs.statSync(path.join(REPO_ROOT, 'templates', 'scout-router', 'SKILL.md')).size;
  assert.ok(size <= ROUTER_BUDGET, `router SKILL.md is ${size} chars, budget ${ROUTER_BUDGET}`);
});

test('every shared reference artifact has a budget and fits inside it', () => {
  for (const [rel, budget] of Object.entries(REFERENCE_BUDGETS)) {
    const size = fs.statSync(path.join(REPO_ROOT, rel)).size;
    assert.ok(size <= budget, `${rel} is ${size} chars, budget ${budget}`);
  }
});

// ---------------------------------------------------------------------------
// T1 gates — always-on cost
// ---------------------------------------------------------------------------

test('surfacing description (the only always-in-context string) fits its budget', () => {
  const fm = frontmatter(skillPath('surfacing'));
  const desc = fm.match(/^description:(.*)$/m);
  assert.ok(desc, 'surfacing frontmatter has a description');
  assert.ok(
    desc[1].trim().length <= SURFACING_DESCRIPTION_BUDGET,
    `surfacing description is ${desc[1].trim().length} chars, budget ${SURFACING_DESCRIPTION_BUDGET} — this string is in every session on the machine`
  );
});

test('all verbs stay out of always-on context (disable-model-invocation: true)', () => {
  // Dropping this flag on any verb silently adds its description to every
  // Claude Code session's context (token-audit.md F5). Only `surfacing`
  // is model-invoked, by design (plan §3).
  for (const name of Object.keys(SKILL_BUDGETS)) {
    const fm = frontmatter(skillPath(name));
    const disabled = /^disable-model-invocation:\s*true\s*$/m.test(fm);
    if (name === 'surfacing') {
      assert.ok(!disabled, 'surfacing must remain model-invoked');
    } else {
      assert.ok(disabled, `skills/${name} must set disable-model-invocation: true`);
    }
  }
});

test('compiled managed block for the seed pack fits its budget', () => {
  const { body } = compilePack(SEED_PACK);
  assert.ok(
    body.length <= COMPILED_BLOCK_BUDGET,
    `compiled block is ${body.length} chars, budget ${COMPILED_BLOCK_BUDGET}`
  );
});

// ---------------------------------------------------------------------------
// T2 gates — the planning moment
// ---------------------------------------------------------------------------

test('hook additionalContext against the seed pack fits its budget', () => {
  // Same verified payload shape as test/hook.test.mjs (hook-spike.md Q1).
  const payload = {
    session_id: 'sess-budget',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: REPO_ROOT,
    permission_mode: 'default',
    hook_event_name: 'PreToolUse',
    tool_name: 'ExitPlanMode',
    tool_input: {
      plan:
        'Build a settings page: React form components, animated section ' +
        'transitions, a color-picker panel for design tokens, and spring ' +
        'motion tuning until the panel feels right. Update the CHANGELOG.',
      planFilePath: '/tmp/plan.md',
    },
  };
  const stdout = execFileSync('node', [HOOK_BIN], {
    encoding: 'utf8',
    input: JSON.stringify(payload),
    env: { ...process.env, SCOUT_PACK: SEED_PACK, SCOUT_HOOK_DELIVERY: 'context' },
  });
  const context = JSON.parse(stdout).hookSpecificOutput.additionalContext;
  assert.ok(
    context.length <= HOOK_CONTEXT_BUDGET,
    `hook context is ${context.length} chars for the seed pack, budget ${HOOK_CONTEXT_BUDGET}`
  );
  assert.ok(context.length <= MAX_OUTPUT_CHARS, 'hook honors its own runtime cap');
});

test('worst-case planning moment (surfacing skill + hook cap) fits the ceiling', () => {
  const surfacing = fs.statSync(skillPath('surfacing')).size;
  const worst = surfacing + MAX_OUTPUT_CHARS;
  assert.ok(
    worst <= PLANNING_MOMENT_BUDGET,
    `a planning moment can cost ${worst} chars (~${Math.round(worst / 4)} tokens), budget ${PLANNING_MOMENT_BUDGET} — this is the recurring, unbidden cost users pay (token-audit.md F1)`
  );
});

test('MAX_OUTPUT_CHARS itself stays within its gate', () => {
  assert.ok(
    MAX_OUTPUT_CHARS <= HOOK_CAP_BUDGET,
    `MAX_OUTPUT_CHARS is ${MAX_OUTPUT_CHARS}, gate ${HOOK_CAP_BUDGET} — raising it raises every planning moment's price`
  );
});
