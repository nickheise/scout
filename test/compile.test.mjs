// test/compile.test.mjs — golden-file + unit tests for bin/scout-compile.mjs
// (docs/plan.md §4 task 2.1 acceptance: "golden-file tests; cap-exceeded path
// tested").

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { compilePack, DEFAULT_MANIFEST_CAP } from '../bin/scout-compile.mjs';
import { createEntry } from '../bin/scout-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const SEED_PACK = path.join(REPO_ROOT, 'fixtures', 'seed-pack');
const COMPILE_BIN = path.join(REPO_ROOT, 'bin', 'scout-compile.mjs');
const GOLDEN = path.join(__dirname, 'golden', 'compile-seed-pack.txt');

function tmpPackDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-compile-test-'));
  return dir;
}

test('compilePack() against the seed pack matches the golden file', () => {
  const result = compilePack(SEED_PACK);
  const golden = fs.readFileSync(GOLDEN, 'utf8');
  assert.equal(result.body + '\n', golden);
});

test('CLI: scout-compile.mjs --pack fixtures/seed-pack matches the golden file byte-for-byte', () => {
  const stdout = execFileSync('node', [COMPILE_BIN, '--pack', SEED_PACK], { encoding: 'utf8' });
  const golden = fs.readFileSync(GOLDEN, 'utf8');
  assert.equal(stdout, golden);
});

test('manifest is exactly the ambient_line of every active pack entry, alphabetical by id', () => {
  const result = compilePack(SEED_PACK);
  assert.deepEqual(result.manifestLines, [
    'DialKit — floating dev panel for live-tweaking UI values; use when tuning motion or design params.',
    "emilkowalski/skills — Emil's design-engineering skills; reach for animation and UI-polish passes.",
    "mattpocock/skills — Matt's engineering-workflow skills; use for alignment interviews, TDD, handoffs.",
    'Paper Shaders — zero-dependency canvas shaders; use for animated backgrounds and gradient effects.',
    'shadcn/ui — copy-in React components; reach for it when building standard UI in a React app.',
  ]);
});

test('standing instructions include ongoing + milestone steps, plus init steps that declare a produces artifact', () => {
  const result = compilePack(SEED_PACK);
  const ids = result.standingSteps.map((s) => s.id).sort();
  // changelog is phase:"init" but declares produces:"CHANGELOG.md" — PRD §5.3
  // models it as init+ongoing, so its maintenance half must reach the
  // standing block just like decision-log's.
  assert.deepEqual(ids, ['agent-team-builds', 'changelog', 'decision-log', 'milestone-screenshots']);
});

test('a phase:"init" step with no produces artifact stays out of the standing-instructions block', () => {
  const dir = tmpPackDir();
  try {
    createEntry(dir, {
      id: 'pure-init-step',
      type: 'step',
      title: 'Pure init step',
      instruction: 'One-time scaffolding only, nothing ongoing about it.',
      phase: 'init',
    });
    const result = compilePack(dir);
    assert.deepEqual(result.standingSteps, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('changelog (init+produces) standing instruction is the exact maintenance instruction text', () => {
  const result = compilePack(SEED_PACK);
  const step = result.standingSteps.find((s) => s.id === 'changelog');
  assert.ok(step, 'expected changelog to appear in standingSteps');
  assert.match(step.instruction, /create CHANGELOG\.md at the repo root/);
  assert.match(step.instruction, /maintain it for the life of the project/);
});

test('D-005 wording: agent-team standing instruction is the qualitative three-part test verbatim', () => {
  const result = compilePack(SEED_PACK);
  const step = result.standingSteps.find((s) => s.id === 'agent-team-builds');
  assert.match(step.instruction, /multi-file, multi-day, or architecturally novel/);
  assert.match(step.instruction, /dedicated orchestrator, a reviewer, and several build subagents/);
});

test('D-004 wording: milestone-screenshots standing instruction carries the accepted trigger wording verbatim', () => {
  const result = compilePack(SEED_PACK);
  const step = result.standingSteps.find((s) => s.id === 'milestone-screenshots');
  assert.match(
    step.instruction,
    /after any stakeholder demo, or when a major feature first works end-to-end, prompt to capture/i
  );
});

test('cap-exceeded: stops with overCap=true and names every overflow id, no body produced', () => {
  const result = compilePack(SEED_PACK, { cap: 3 });
  assert.equal(result.overCap, true);
  assert.equal(result.body, '');
  assert.equal(result.packCount, 5);
  assert.deepEqual(result.overflowIds, ['dialkit', 'emilkowalski-skills', 'mattpocock-skills', 'paper-shaders', 'shadcn-ui']);
});

test('CLI cap-exceeded: exits 1, prints an archive pointer on stderr, empty stdout', () => {
  assert.throws(() => {
    execFileSync('node', [COMPILE_BIN, '--pack', SEED_PACK, '--cap', '3'], { encoding: 'utf8' });
  }, (err) => {
    assert.equal(err.status, 1);
    assert.match(err.stderr, /exceeds cap/);
    assert.match(err.stderr, /\/scout:archive/);
    assert.equal(err.stdout, '');
    return true;
  });
});

test('default cap is 25 (PRD §12.6 / P-4 starting hypothesis) and the 5-pack seed sits well under it', () => {
  assert.equal(DEFAULT_MANIFEST_CAP, 25);
  const result = compilePack(SEED_PACK);
  assert.equal(result.overCap, false);
  assert.equal(result.cap, 25);
});

test('cap-exceeded at the real default: 26 active pack entries stops compilation', () => {
  const dir = tmpPackDir();
  try {
    for (let i = 0; i < 26; i++) {
      createEntry(dir, {
        id: `pack-${String(i).padStart(2, '0')}`,
        type: 'pack',
        title: `Pack ${i}`,
        url: `https://example.com/${i}`,
        install: 'npm i example',
        summary: 'A fixture pack entry.',
        surfaces_when: ['whenever this fixture is relevant'],
        ambient_line: `Pack ${i} — a fixture entry.`,
      });
    }
    const result = compilePack(dir);
    assert.equal(result.overCap, true);
    assert.equal(result.packCount, 26);
    assert.equal(result.overflowIds.length, 26);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('empty pack dir compiles to an empty body without error (Scout ships empty)', () => {
  const dir = tmpPackDir();
  try {
    const result = compilePack(dir);
    assert.equal(result.overCap, false);
    assert.equal(result.body, '');
    assert.deepEqual(result.manifestLines, []);
    assert.deepEqual(result.standingSteps, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('archived pack/step entries never appear in the manifest or standing instructions', () => {
  const dir = tmpPackDir();
  try {
    createEntry(dir, {
      id: 'archived-pack',
      type: 'pack',
      title: 'Archived Pack',
      status: 'archived',
      url: 'https://example.com',
      install: 'npm i archived',
      summary: 'An archived fixture.',
      surfaces_when: ['never'],
      ambient_line: 'Archived Pack — should never appear.',
    });
    createEntry(dir, {
      id: 'archived-step',
      type: 'step',
      title: 'Archived Step',
      status: 'archived',
      instruction: 'This should never appear in standing instructions.',
      phase: 'ongoing',
    });
    const result = compilePack(dir);
    assert.deepEqual(result.manifestLines, []);
    assert.deepEqual(result.standingSteps, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a repeated compile of an unchanged pack is byte-identical (determinism for the block writer no-op path)', () => {
  const first = compilePack(SEED_PACK).body;
  const second = compilePack(SEED_PACK).body;
  assert.equal(first, second);
});
