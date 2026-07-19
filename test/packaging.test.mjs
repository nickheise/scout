import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
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

test('hooks config referenced by plugin.json exists', () => {
  if (plugin.hooks) {
    assert.ok(existsSync(join(ROOT, plugin.hooks)), `${plugin.hooks} missing`);
  }
});
