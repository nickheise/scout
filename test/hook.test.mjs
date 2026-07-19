// test/hook.test.mjs — unit + CLI tests for bin/scout-hook-plan.mjs (docs/plan.md
// §4 task 3.1 acceptance: "fast-exit cases (each guard), firing case output
// shape for both deliveries, index truncation, and a timing assertion
// (<100ms on the firing path with the seed pack)").
//
// The ExitPlanMode and TodoWrite payload shapes used below are the verified
// shapes from docs/research/hook-spike.md (Q1: ExitPlanMode tool_input is
// {plan, planFilePath}, source-verified; Q3: TodoWrite tool_input is
// {todos: [{content, status, activeForm}]}, source-verified; envelope fields
// session_id/transcript_path/cwd/hook_event_name/permission_mode by analogy
// to the live-captured SessionStart/UserPromptSubmit envelope, same
// construction code per Q3's writeup) — not invented shapes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  DELIVERY,
  MIN_TEXT_CHARS,
  MAX_OUTPUT_CHARS,
  extractText,
  looksLikeChildContext,
  buildMessage,
  planDelivery,
} from '../bin/scout-hook-plan.mjs';
import { compilePack } from '../bin/scout-compile.mjs';
import { createEntry } from '../bin/scout-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const SEED_PACK = path.join(REPO_ROOT, 'fixtures', 'seed-pack');
const HOOK_BIN = path.join(REPO_ROOT, 'bin', 'scout-hook-plan.mjs');

function tmpPackDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'scout-hook-test-'));
}

// ---------------------------------------------------------------------------
// Real, verified payload shapes (docs/research/hook-spike.md)
// ---------------------------------------------------------------------------

const SUBSTANTIAL_PLAN =
  'Add a login form using shadcn/ui components: a Dialog wrapping a Form with ' +
  'email and password fields, client-side validation, and a submit handler ' +
  'that calls the existing auth API. Also wire up basic error states for ' +
  'invalid credentials.';

function exitPlanModePayload(overrides = {}) {
  return {
    session_id: 'sess-abc123',
    transcript_path: '/Users/nick/.claude/projects/scout/transcript.jsonl',
    cwd: '/Users/nick/Documents/GitHub/scout',
    permission_mode: 'default',
    hook_event_name: 'PreToolUse',
    tool_name: 'ExitPlanMode',
    tool_input: {
      plan: SUBSTANTIAL_PLAN,
      planFilePath: '/Users/nick/.claude/plans/sess-abc123.md',
    },
    ...overrides,
  };
}

function todoWritePayload(overrides = {}) {
  return {
    session_id: 'sess-abc123',
    transcript_path: '/Users/nick/.claude/projects/scout/transcript.jsonl',
    cwd: '/Users/nick/Documents/GitHub/scout',
    permission_mode: 'default',
    hook_event_name: 'PostToolUse',
    tool_name: 'TodoWrite',
    tool_input: {
      todos: [
        {
          content: 'Scaffold the login dialog component with shadcn/ui primitives',
          status: 'in_progress',
          activeForm: 'Scaffolding the login dialog component',
        },
        {
          content: 'Wire client-side validation and error states',
          status: 'pending',
          activeForm: 'Wiring client-side validation',
        },
        {
          content: 'Connect the submit handler to the existing auth API',
          status: 'pending',
          activeForm: 'Connecting the submit handler',
        },
      ],
    },
    tool_response: { ok: true },
    ...overrides,
  };
}

function runHook(payload, { env = {}, allowNonZeroExit = false } = {}) {
  const args = {
    input: payload === null ? '' : JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...env },
    // Explicit full pipe: execFileSync otherwise inherits stderr straight to
    // this test process's own stderr (in addition to capturing it in
    // err.stderr) — harmless, but noisy in CI logs for the block-delivery
    // (exit 2) cases.
    stdio: ['pipe', 'pipe', 'pipe'],
  };
  if (allowNonZeroExit) {
    try {
      const stdout = execFileSync('node', [HOOK_BIN], args);
      return { status: 0, stdout, stderr: '' };
    } catch (err) {
      return { status: err.status, stdout: err.stdout, stderr: err.stderr };
    }
  }
  const stdout = execFileSync('node', [HOOK_BIN], args);
  return { status: 0, stdout, stderr: '' };
}

// ---------------------------------------------------------------------------
// Unit: extractText
// ---------------------------------------------------------------------------

test('extractText: ExitPlanMode reads tool_input.plan verbatim', () => {
  assert.equal(extractText(exitPlanModePayload()), SUBSTANTIAL_PLAN);
});

test('extractText: ExitPlanMode falls back to reading planFilePath when plan is absent (hook-spike Q1 caveat)', () => {
  const dir = tmpPackDir();
  const planFile = path.join(dir, 'plan.md');
  fs.writeFileSync(planFile, 'A plan persisted to disk instead of arriving as tool_input.plan.');
  try {
    const payload = exitPlanModePayload({ tool_input: { planFilePath: planFile } });
    assert.equal(extractText(payload), 'A plan persisted to disk instead of arriving as tool_input.plan.');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('extractText: TodoWrite joins every todo\'s content (hook-spike Q3: full replacement list)', () => {
  const text = extractText(todoWritePayload());
  assert.match(text, /Scaffold the login dialog/);
  assert.match(text, /client-side validation/);
  assert.match(text, /submit handler/);
});

test('extractText: unknown tool_name yields empty string', () => {
  assert.equal(extractText({ tool_name: 'SomethingElse', tool_input: {} }), '');
});

// ---------------------------------------------------------------------------
// Unit: looksLikeChildContext (best-effort, unverified guard — see module doc)
// ---------------------------------------------------------------------------

test('looksLikeChildContext: true when agentId+teamName both present on tool_input', () => {
  const payload = exitPlanModePayload({
    tool_input: { plan: SUBSTANTIAL_PLAN, agentId: 'agent-1', teamName: 'team-1' },
  });
  assert.equal(looksLikeChildContext(payload), true);
});

test('looksLikeChildContext: true when agentId+teamName both present at the envelope top level', () => {
  const payload = exitPlanModePayload({ agentId: 'agent-1', teamName: 'team-1' });
  assert.equal(looksLikeChildContext(payload), true);
});

test('looksLikeChildContext: false when only one of agentId/teamName is present', () => {
  assert.equal(looksLikeChildContext(exitPlanModePayload({ tool_input: { plan: SUBSTANTIAL_PLAN, agentId: 'agent-1' } })), false);
});

test('looksLikeChildContext: false on a normal payload', () => {
  assert.equal(looksLikeChildContext(exitPlanModePayload()), false);
});

// ---------------------------------------------------------------------------
// Unit: buildMessage + truncation
// ---------------------------------------------------------------------------

test('buildMessage: untruncated for the seed pack (well under MAX_OUTPUT_CHARS)', () => {
  const { indexLines } = compilePack(SEED_PACK);
  const message = buildMessage(indexLines);
  assert.equal(message.truncated, false);
  assert.ok(message.text.includes('Scout: planning moment.'));
  for (const line of indexLines) assert.ok(message.text.includes(line));
  assert.ok(message.text.length <= MAX_OUTPUT_CHARS);
});

test('buildMessage: truncates a pathologically large index, keeps only whole lines, and says so', () => {
  const bigCondition = 'a very long surfaces_when condition repeated for size '.repeat(20);
  const indexLines = Array.from({ length: 20 }, (_, i) => `fixture-${i}: ${bigCondition}`);
  const message = buildMessage(indexLines);
  assert.equal(message.truncated, true);
  assert.match(message.text, /\[truncated: showing \d+ of 20 pack index entries/);
  assert.ok(message.text.length <= MAX_OUTPUT_CHARS + 200, 'stays close to the budget even after the note');
  // every kept line must appear whole, never cut mid-line
  for (const line of indexLines) {
    if (message.text.includes(line.slice(0, 20))) {
      assert.ok(message.text.includes(line), `line for ${line.slice(0, 20)}... must appear whole or not at all`);
    }
  }
});

// ---------------------------------------------------------------------------
// Unit: planDelivery (both delivery code paths, pure — no process.exit)
// ---------------------------------------------------------------------------

test('planDelivery: context delivery emits hookSpecificOutput.additionalContext on stdout, exit 0', () => {
  const message = { text: 'pointer text', truncated: false };
  const result = planDelivery('PreToolUse', message, 'context');
  assert.equal(result.stream, 'stdout');
  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.text);
  assert.deepEqual(parsed, { hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: 'pointer text' } });
});

test('planDelivery: block delivery on PreToolUse writes to stderr and exits 2', () => {
  const message = { text: 'pointer text', truncated: false };
  const result = planDelivery('PreToolUse', message, 'block');
  assert.equal(result.stream, 'stderr');
  assert.equal(result.exitCode, 2);
  assert.equal(result.text, 'pointer text\n');
});

test('planDelivery: block delivery on PostToolUse falls back to context (block is PreToolUse-only)', () => {
  const message = { text: 'pointer text', truncated: false };
  const result = planDelivery('PostToolUse', message, 'block');
  assert.equal(result.stream, 'stdout');
  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.text);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PostToolUse');
});

test('DELIVERY constant ships as \'context\' by default (D-013)', () => {
  assert.equal(DELIVERY, 'context');
});

test('MIN_TEXT_CHARS is a positive tunable constant', () => {
  assert.ok(Number.isInteger(MIN_TEXT_CHARS) && MIN_TEXT_CHARS > 0);
});

// ---------------------------------------------------------------------------
// CLI: fast-exit guards — each must exit 0 with EMPTY stdout and stderr
// ---------------------------------------------------------------------------

test('CLI fast-exit: SCOUT_HOOK_OFF=1 silences firing even with a real payload + non-empty pack', () => {
  const { stdout, stderr, status } = runHook(exitPlanModePayload(), {
    env: { SCOUT_PACK: SEED_PACK, SCOUT_HOOK_OFF: '1' },
  });
  assert.equal(status, 0);
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});

test('CLI fast-exit: missing pack dir', () => {
  const missing = path.join(os.tmpdir(), `scout-hook-missing-${process.pid}-${Date.now()}`);
  const { stdout, stderr, status } = runHook(exitPlanModePayload(), { env: { SCOUT_PACK: missing } });
  assert.equal(status, 0);
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});

test('CLI fast-exit: pack dir exists but has zero active pack entries', () => {
  const dir = tmpPackDir();
  try {
    const { stdout, stderr, status } = runHook(exitPlanModePayload(), { env: { SCOUT_PACK: dir } });
    assert.equal(status, 0);
    assert.equal(stdout, '');
    assert.equal(stderr, '');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI fast-exit: plan text under MIN_TEXT_CHARS, even against the seed pack', () => {
  const payload = exitPlanModePayload({ tool_input: { plan: 'ok' } });
  const { stdout, stderr, status } = runHook(payload, { env: { SCOUT_PACK: SEED_PACK } });
  assert.equal(status, 0);
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});

test('CLI fast-exit: TodoWrite with trivially short todo content', () => {
  const payload = todoWritePayload({ tool_input: { todos: [{ content: 'ok', status: 'pending', activeForm: 'ok' }] } });
  const { stdout, stderr, status } = runHook(payload, { env: { SCOUT_PACK: SEED_PACK } });
  assert.equal(status, 0);
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});

test('CLI fast-exit: malformed JSON on stdin', () => {
  const args = { input: '{not valid json', encoding: 'utf8', env: { ...process.env, SCOUT_PACK: SEED_PACK } };
  const stdout = execFileSync('node', [HOOK_BIN], args);
  assert.equal(stdout, '');
});

test('CLI fast-exit: empty stdin', () => {
  const stdout = runHook(null, { env: { SCOUT_PACK: SEED_PACK } }).stdout;
  assert.equal(stdout, '');
});

test('CLI fast-exit: child/subagent-context guard suppresses firing even with a long plan + real pack', () => {
  const payload = exitPlanModePayload({
    tool_input: { plan: SUBSTANTIAL_PLAN, agentId: 'agent-1', teamName: 'team-1' },
  });
  const { stdout, stderr, status } = runHook(payload, { env: { SCOUT_PACK: SEED_PACK } });
  assert.equal(status, 0);
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});

// ---------------------------------------------------------------------------
// CLI: firing cases — both deliveries, both trigger events
// ---------------------------------------------------------------------------

test('CLI firing: ExitPlanMode + context delivery (default) emits valid additionalContext JSON on stdout', () => {
  const { stdout, stderr, status } = runHook(exitPlanModePayload(), { env: { SCOUT_PACK: SEED_PACK } });
  assert.equal(status, 0);
  assert.equal(stderr, '');
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Scout: planning moment\./);
  assert.match(parsed.hookSpecificOutput.additionalContext, /shadcn-ui: /);
  assert.match(parsed.hookSpecificOutput.additionalContext, /dialkit: /);
});

test('CLI firing: TodoWrite + context delivery (default) emits valid additionalContext JSON on stdout', () => {
  const { stdout, stderr, status } = runHook(todoWritePayload(), { env: { SCOUT_PACK: SEED_PACK } });
  assert.equal(status, 0);
  assert.equal(stderr, '');
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Scout: planning moment\./);
  assert.match(parsed.hookSpecificOutput.additionalContext, /paper-shaders: /);
});

test('CLI firing: ExitPlanMode + block delivery (verified fallback) exits 2, pointer on stderr, empty stdout', () => {
  const { stdout, stderr, status } = runHook(exitPlanModePayload(), {
    env: { SCOUT_PACK: SEED_PACK, SCOUT_HOOK_DELIVERY: 'block' },
    allowNonZeroExit: true,
  });
  assert.equal(status, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /Scout: planning moment\./);
  assert.match(stderr, /mattpocock-skills: /);
});

test('CLI firing: TodoWrite + block delivery falls back to context (PreToolUse-only) — exits 0, JSON on stdout', () => {
  const { stdout, stderr, status } = runHook(todoWritePayload(), {
    env: { SCOUT_PACK: SEED_PACK, SCOUT_HOOK_DELIVERY: 'block' },
  });
  assert.equal(status, 0);
  assert.equal(stderr, '');
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Scout: planning moment\./);
});

// ---------------------------------------------------------------------------
// CLI: index truncation, end-to-end through the real hook process
// ---------------------------------------------------------------------------

test('CLI firing: a pathologically large pack truncates the index and says so in the delivered message', () => {
  const dir = tmpPackDir();
  try {
    const bigCondition = 'a repeated, deliberately verbose surfaces_when condition for size '.repeat(20);
    for (let i = 0; i < 8; i++) {
      createEntry(dir, {
        id: `big-${i}`,
        type: 'pack',
        title: `Big ${i}`,
        url: `https://example.com/${i}`,
        install: 'npm i example',
        summary: 'A fixture pack entry with a deliberately huge surfaces_when.',
        surfaces_when: [bigCondition],
        ambient_line: `Big ${i} — a fixture entry.`,
      });
    }
    const { stdout, stderr, status } = runHook(exitPlanModePayload(), { env: { SCOUT_PACK: dir } });
    assert.equal(status, 0);
    assert.equal(stderr, '');
    const parsed = JSON.parse(stdout);
    assert.match(parsed.hookSpecificOutput.additionalContext, /\[truncated: showing \d+ of 8 pack index entries/);
    assert.ok(parsed.hookSpecificOutput.additionalContext.length <= MAX_OUTPUT_CHARS + 300);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Timing: the firing path itself (compilePack + extractText + buildMessage,
// excluding node-process-startup overhead which is inherent to any hook
// script and outside Scout's own logic) must stay well under 100ms against
// the seed pack.
// ---------------------------------------------------------------------------

test('timing: the firing-path logic (extract + compile + build message) is well under 100ms on the seed pack', () => {
  const payload = exitPlanModePayload();
  const durationsMs = [];
  for (let i = 0; i < 5; i++) {
    const start = process.hrtime.bigint();
    const text = extractText(payload);
    assert.ok(text.length >= MIN_TEXT_CHARS);
    const { packCount, indexLines } = compilePack(SEED_PACK);
    assert.ok(packCount > 0);
    buildMessage(indexLines);
    const end = process.hrtime.bigint();
    durationsMs.push(Number(end - start) / 1e6);
  }
  const max = Math.max(...durationsMs);
  assert.ok(max < 100, `expected every run under 100ms, got ${JSON.stringify(durationsMs)}`);
});
