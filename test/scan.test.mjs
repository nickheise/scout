import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  listProjectDirs,
  readPackageJson,
  dependencyNames,
  scriptNames,
  practiceFileNames,
  scanProject,
  scanRoots,
  tally,
  buildReport,
  scan,
} from '../bin/scout-scan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures', 'scan');
const ROOT1 = path.join(FIXTURES, 'root1');
const ROOT2 = path.join(FIXTURES, 'root2');
const SCRIPT = path.join(__dirname, '..', 'bin', 'scout-scan.mjs');

function byName(rows, name) {
  return rows.find((r) => r.name === name);
}

// ---------------------------------------------------------------------------
// listProjectDirs — depth limiting, symlinks, skip rules
// ---------------------------------------------------------------------------

describe('listProjectDirs', () => {
  test('returns only the three real project dirs under root1', () => {
    const dirs = listProjectDirs(ROOT1).map((d) => path.basename(d)).sort();
    assert.deepEqual(dirs, ['project-a', 'project-b', 'project-c']);
  });

  test('skips node_modules, .git-named children, dot-directories, symlinks, and plain files', () => {
    const dirs = listProjectDirs(ROOT1);
    const names = dirs.map((d) => path.basename(d));
    assert.ok(!names.includes('node_modules'));
    assert.ok(!names.includes('.hidden-dir'));
    assert.ok(!names.includes('project-a-link'));
    assert.ok(!names.includes('stray-file.txt'));
  });

  test('does not descend into a project to find its internal node_modules/.git', () => {
    // project-a/node_modules and project-a/.git exist but must never surface
    // as sibling "project dirs" of root1 itself.
    const dirs = listProjectDirs(ROOT1).map((d) => path.basename(d));
    assert.ok(!dirs.some((n) => n === 'somepkg' || n === 'fake-project'));
  });

  test('missing root degrades to an empty list, not a throw', () => {
    assert.deepEqual(listProjectDirs(path.join(FIXTURES, 'does-not-exist')), []);
  });
});

// ---------------------------------------------------------------------------
// Per-project gathering
// ---------------------------------------------------------------------------

describe('readPackageJson / dependencyNames / scriptNames', () => {
  test('reads dependencies + devDependencies + scripts from project-a', () => {
    const pkg = readPackageJson(path.join(ROOT1, 'project-a'));
    assert.deepEqual(dependencyNames(pkg).sort(), ['eslint', 'lodash', 'react']);
    assert.deepEqual(scriptNames(pkg).sort(), ['build', 'test']);
  });

  test('missing package.json returns null / empty arrays, never throws', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-scan-nopkg-'));
    try {
      assert.equal(readPackageJson(tmp), null);
      assert.deepEqual(dependencyNames(null), []);
      assert.deepEqual(scriptNames(null), []);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('malformed package.json degrades to null, never throws', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-scan-badpkg-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), '{ not json');
      assert.equal(readPackageJson(tmp), null);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('practiceFileNames', () => {
  test('project-a: CHANGELOG.md + DECISIONS.md', () => {
    assert.deepEqual(practiceFileNames(path.join(ROOT1, 'project-a')).sort(), [
      'CHANGELOG.md',
      'DECISIONS.md',
    ]);
  });

  test('project-b: CHANGELOG.md + AGENTS.md', () => {
    assert.deepEqual(practiceFileNames(path.join(ROOT1, 'project-b')).sort(), [
      'AGENTS.md',
      'CHANGELOG.md',
    ]);
  });

  test('project-c: docs/adr (dir) + top-level CLAUDE.md', () => {
    assert.deepEqual(practiceFileNames(path.join(ROOT1, 'project-c')).sort(), [
      'CLAUDE.md',
      'docs/adr',
    ]);
  });

  test('project-d: .claude/CLAUDE.md counts as the canonical "CLAUDE.md" practice', () => {
    assert.deepEqual(practiceFileNames(path.join(ROOT2, 'project-d')), ['CLAUDE.md']);
  });

  test('a project with none of the practice files reports none', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-scan-bare-'));
    try {
      assert.deepEqual(practiceFileNames(tmp), []);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('scanProject', () => {
  test('assembles path + dependencies + scripts + practices for one project', () => {
    const p = path.join(ROOT1, 'project-a');
    const result = scanProject(p);
    assert.equal(result.path, p);
    assert.deepEqual(result.dependencies.sort(), ['eslint', 'lodash', 'react']);
    assert.deepEqual(result.scripts.sort(), ['build', 'test']);
    assert.deepEqual(result.practices.sort(), ['CHANGELOG.md', 'DECISIONS.md']);
  });
});

// ---------------------------------------------------------------------------
// scanRoots — multi-root, dedup
// ---------------------------------------------------------------------------

describe('scanRoots', () => {
  test('scans all three project dirs under a single root', () => {
    const projects = scanRoots([ROOT1]);
    assert.equal(projects.length, 3);
    assert.deepEqual(
      projects.map((p) => path.basename(p.path)).sort(),
      ['project-a', 'project-b', 'project-c']
    );
  });

  test('combines projects across multiple roots', () => {
    const projects = scanRoots([ROOT1, ROOT2]);
    assert.equal(projects.length, 4);
    assert.ok(projects.some((p) => path.basename(p.path) === 'project-d'));
  });

  test('dedupes when the same root is passed twice', () => {
    const projects = scanRoots([ROOT1, ROOT1]);
    assert.equal(projects.length, 3);
  });
});

// ---------------------------------------------------------------------------
// tally — recurrence sorting, evidence, denominators
// ---------------------------------------------------------------------------

describe('tally + buildReport', () => {
  test('dependency recurrence across root1 (3 projects)', () => {
    const report = buildReport([ROOT1], scanRoots([ROOT1]));
    assert.equal(report.projectsScanned, 3);

    const react = byName(report.dependencies, 'react');
    assert.equal(react.count, 2);
    assert.equal(react.totalProjects, 3);
    assert.deepEqual(
      react.projects.map((p) => path.basename(p)).sort(),
      ['project-a', 'project-b']
    );

    const eslint = byName(report.dependencies, 'eslint');
    assert.equal(eslint.count, 2);

    const vue = byName(report.dependencies, 'vue');
    assert.equal(vue.count, 1);

    // node_modules-internal / hidden-dir deps must never appear anywhere.
    assert.equal(byName(report.dependencies, 'should-not-appear'), undefined);
    assert.equal(byName(report.dependencies, 'should-not-appear-either'), undefined);
    assert.equal(byName(report.dependencies, 'also-should-not-appear'), undefined);
  });

  test('dependency rows are sorted by count desc, name asc on ties', () => {
    const report = buildReport([ROOT1], scanRoots([ROOT1]));
    // react:2, eslint:2 (tie -> alpha), lodash:1, jest:1, vue:1 (tie -> alpha)
    const names = report.dependencies.map((r) => r.name);
    assert.deepEqual(names, ['eslint', 'react', 'jest', 'lodash', 'vue']);
  });

  test('practice-file recurrence across root1', () => {
    const report = buildReport([ROOT1], scanRoots([ROOT1]));
    const changelog = byName(report.practices, 'CHANGELOG.md');
    assert.equal(changelog.count, 2);
    assert.equal(changelog.totalProjects, 3);

    assert.equal(byName(report.practices, 'DECISIONS.md').count, 1);
    assert.equal(byName(report.practices, 'AGENTS.md').count, 1);
    assert.equal(byName(report.practices, 'docs/adr').count, 1);
    assert.equal(byName(report.practices, 'CLAUDE.md').count, 1);
  });

  test('script recurrence across root1', () => {
    const report = buildReport([ROOT1], scanRoots([ROOT1]));
    assert.equal(byName(report.scripts, 'build').count, 2);
    assert.equal(byName(report.scripts, 'test').count, 1);
    assert.equal(byName(report.scripts, 'dev').count, 1);
  });

  test('multi-root scan raises totalProjects and merges the shared "react" dependency', () => {
    const report = scan([ROOT1, ROOT2]);
    assert.equal(report.projectsScanned, 4);
    const react = byName(report.dependencies, 'react');
    assert.equal(react.count, 3);
    assert.equal(react.totalProjects, 4);
    // project-d's .claude/CLAUDE.md folds into the same canonical CLAUDE.md row
    assert.equal(byName(report.practices, 'CLAUDE.md').count, 2);
  });

  test('tally() denominator is always the full project set, even for zero-hit projects', () => {
    // project-c has no CHANGELOG.md; the denominator for CHANGELOG.md must
    // still be all 3 projects, not just the 2 that had it.
    const report = buildReport([ROOT1], scanRoots([ROOT1]));
    for (const row of report.practices) {
      assert.equal(row.totalProjects, 3);
    }
    for (const row of report.dependencies) {
      assert.equal(row.totalProjects, 3);
    }
  });

  test('tally() on an empty project list returns empty rows, not a throw', () => {
    assert.deepEqual(tally([], 'dependencies'), []);
  });

  test('warning is null when every scanned project carries at least one signal', () => {
    const report = buildReport([ROOT1], scanRoots([ROOT1]));
    assert.equal(report.warning, null);
  });

  test('pointing at a non-project-parent root (its children have no signals) surfaces a distinct warning', () => {
    // FIXTURES's immediate children are root1/root2 themselves -- neither carries
    // a package.json or practice file at its own top level, mirroring the exact
    // "aimed at a single repo / its parent" misuse this safeguard targets.
    const report = scan([FIXTURES]);
    assert.equal(report.projectsScanned, 2);
    assert.deepEqual(report.dependencies, []);
    assert.ok(report.warning);
    assert.match(report.warning, /2 of 2 scanned dir\(s\) had no signals/);
    assert.match(report.warning, /parent-of-projects folder/);
  });
});

// ---------------------------------------------------------------------------
// CLI smoke test
// ---------------------------------------------------------------------------

describe('CLI', () => {
  test('--json emits a parseable report with the expected shape', () => {
    const out = execFileSync('node', [SCRIPT, ROOT1, ROOT2, '--json'], { encoding: 'utf8' });
    const report = JSON.parse(out);
    assert.equal(report.projectsScanned, 4);
    assert.ok(Array.isArray(report.dependencies));
    assert.ok(Array.isArray(report.practices));
    assert.ok(Array.isArray(report.scripts));
    assert.ok(byName(report.dependencies, 'react').count >= 2);
  });

  test('without --json prints a human-readable summary', () => {
    const out = execFileSync('node', [SCRIPT, ROOT1], { encoding: 'utf8' });
    assert.match(out, /Scanned 3 project\(s\)/);
    assert.match(out, /Dependencies/);
    assert.match(out, /Practice files/);
    assert.match(out, /Scripts/);
  });

  test('no roots given exits non-zero with a usage message stating root semantics', () => {
    let stderr = '';
    try {
      execFileSync('node', [SCRIPT], { encoding: 'utf8' });
      assert.fail('expected non-zero exit');
    } catch (err) {
      stderr = err.stderr;
    }
    assert.match(stderr, /parent-of-projects-dir/);
    assert.match(stderr, /IMMEDIATE CHILD/);
  });

  test('a mis-aimed root (children carry no signals) prints a distinct warning', () => {
    const out = execFileSync('node', [SCRIPT, FIXTURES], { encoding: 'utf8' });
    assert.match(out, /Warning: 2 of 2 scanned dir\(s\) had no signals/);
  });

  test('--json includes the same warning field', () => {
    const out = execFileSync('node', [SCRIPT, FIXTURES, '--json'], { encoding: 'utf8' });
    const report = JSON.parse(out);
    assert.match(report.warning, /parent-of-projects folder/);
  });
});
