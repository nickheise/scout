import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// CI cannot hard-gate on `claude plugin validate` (the CLI is not on
// runners), so the manifest invariants it would catch are asserted here.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
const marketplace = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));

test('plugin.json and marketplace.json versions match', () => {
  assert.equal(marketplace.plugins[0].version, plugin.version);
});

test('every plugin.json skills entry exists and has a SKILL.md', () => {
  for (const rel of plugin.skills) {
    assert.ok(existsSync(join(ROOT, rel, 'SKILL.md')), `${rel}/SKILL.md missing`);
  }
});

test('every shipped skills/ dir is listed in plugin.json', () => {
  const listed = new Set(plugin.skills.map((s) => s.replace(/^\.\//, '')));
  for (const dir of readdirSync(join(ROOT, 'skills'))) {
    if (existsSync(join(ROOT, 'skills', dir, 'SKILL.md'))) {
      assert.ok(listed.has(`skills/${dir}`), `skills/${dir} not in plugin.json skills array`);
    }
  }
});

// The standard hooks/hooks.json is auto-loaded by Claude Code. Nothing in
// plugin.json points at it any more (D-023), so this is the only guard that
// it still exists and parses — without it, deleting or renaming the file
// would silently disable the whole reports layer.
test('the auto-loaded hooks/hooks.json exists and registers both triggers', () => {
  const hooksPath = join(ROOT, 'hooks/hooks.json');
  assert.ok(existsSync(hooksPath), 'hooks/hooks.json missing');
  const hooks = JSON.parse(readFileSync(hooksPath, 'utf8'));
  assert.ok(hooks.hooks, 'hooks.json must wrap its event map in a top-level "hooks" key');
  assert.ok(hooks.hooks.PreToolUse, 'PreToolUse(ExitPlanMode) trigger missing');
  assert.ok(hooks.hooks.PostToolUse, 'PostToolUse(TodoWrite) fallback trigger missing');
});

// D-023 — this exact regression took the entire plugin down on v0.4.0.
// Claude Code auto-loads hooks/hooks.json; naming it again in plugin.json
// registers it twice and the CLI rejects the whole plugin with "Duplicate
// hooks file detected" — no skills, no hooks, no MCP server. `manifest.hooks`
// is only for ADDITIONAL hook files beyond the standard one. The previous
// version of this test asserted the opposite (that the referenced file
// exists), which is why CI stayed green through the outage.
test('plugin.json does not re-declare the auto-loaded hooks file', () => {
  if (!plugin.hooks) return; // the correct, shipped state: no hooks key at all
  const declared = [].concat(plugin.hooks);
  for (const rel of declared) {
    const normalized = rel.replace(/^\.\//, '');
    assert.notEqual(
      normalized,
      'hooks/hooks.json',
      'plugin.json must not reference hooks/hooks.json — it is auto-loaded, and ' +
        'declaring it makes Claude Code reject the entire plugin (D-023)',
    );
    assert.ok(existsSync(join(ROOT, rel)), `${rel} missing`);
  }
});

// ---------------------------------------------------------------------------
// Real-install smoke test (D-023)
// ---------------------------------------------------------------------------
// The static assertions above encode the specific mistakes we already know
// about. This one catches the class: it installs the plugin the way a user
// does and asserts the CLI actually loaded it. `claude plugin validate` is
// NOT a substitute — it passed green throughout the v0.4.0 outage, because
// with both manifests present it validates only the marketplace manifest and
// duplicate-hooks detection happens at load time, not validate time.
//
// Skipped when the `claude` CLI is absent (hosted CI runners), so this is a
// local/dev-machine gate, not a required CI signal. Everything happens inside
// a throwaway CLAUDE_CONFIG_DIR — plugin install/marketplace-add write to
// real user-scope config otherwise.

function claudeAvailable() {
  try {
    execFileSync('claude', ['--version'], { stdio: 'ignore', timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

const HAVE_CLAUDE = claudeAvailable();

test(
  'the plugin installs and loads cleanly from a real marketplace install',
  { skip: HAVE_CLAUDE ? false : 'claude CLI not available on this machine' },
  () => {
    const configDir = mkdtempSync(join(tmpdir(), 'scout-install-test-'));
    const env = { ...process.env, CLAUDE_CONFIG_DIR: configDir };
    const run = (args) =>
      execFileSync('claude', args, { env, encoding: 'utf8', timeout: 120_000 });

    try {
      run(['plugin', 'marketplace', 'add', ROOT]);
      run(['plugin', 'install', 'scout@scout']);
      const listed = run(['plugin', 'list']);

      assert.doesNotMatch(
        listed,
        /failed to load/i,
        `plugin failed to load after a clean install:\n${listed}`,
      );
      assert.match(listed, /enabled/i, `plugin not reported enabled:\n${listed}`);

      // The components a user actually pays for must all be present — a
      // partial load is its own failure mode.
      const details = run(['plugin', 'details', 'scout@scout']);
      assert.match(details, /Skills \(8\)/, `expected 8 skills:\n${details}`);
      assert.match(details, /Hooks \(2\)/, `expected 2 hooks:\n${details}`);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  },
);
