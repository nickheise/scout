#!/usr/bin/env node
// scout-scan.mjs — the history-scan gatherer (docs/plan.md §4 task 4.2a,
// PRD §5.5 "setup — first-ever onboarding + the history scan").
//
// Same split as the planning hook (scout-hook-plan.mjs): this script
// GATHERS deterministically, the host agent JUDGES. It never proposes,
// ranks against a pack, phrases a pitch, or decides what's "aspirational"
// vs "already practiced" — it counts what's on disk and hands back plain
// recurrence data with evidence paths. The setup/survey skill applies the
// gate-and-confirm treatment (top 5-7 by recurrence, evidence attached,
// nothing auto-committed — PRD §5.5 point 3) on top of this output.
//
// CLI: scan <root-dir> [more roots...] [--json]
//
//   For each given root, its IMMEDIATE children (depth-limited to one level
//   — a root is a parent-of-projects folder like ~/Documents/GitHub, not a
//   project itself) that are plain directories become "project dirs". Per
//   project dir, gather three signal categories, reading only the named
//   files below (no directory contents beyond them, no network):
//     (a) dependency names — the union of package.json's "dependencies" and
//         "devDependencies" keys.
//     (b) practice-file presence — CHANGELOG.md, DECISIONS.md, docs/adr
//         (dir), CLAUDE.md (.claude/CLAUDE.md or top-level), AGENTS.md.
//     (c) package.json script names — the keys of "scripts".
//   Output is three recurrence-sorted tables (dependencies/practices/
//   scripts), each row carrying { name, count, totalProjects, projects }
//   where `projects` is the evidence: the list of project paths where that
//   signal was found. totalProjects is always the full project count for
//   the whole scan (not just projects that happened to have a package.json)
//   so "4 of 6 repos" always has the right denominator (PRD §5.5).
//
// Traversal safety: never follows symlinks (a symlinked directory anywhere
// under a root is skipped outright, so scan roots the user confirmed can
// never quietly pull in a tree outside them); skips node_modules/.git and
// any dot-directory when enumerating a root's immediate children (defensive
// — a root is meant to be a parent of projects, but if one is accidentally
// pointed at a project itself, that project's own internals must never be
// mistaken for sibling projects). Malformed/missing package.json degrades
// to "no deps/scripts found" for that project rather than aborting the scan
// (tolerant-reader spirit, same posture as scout-store.mjs).
//
// Zero npm dependencies: plain Node >= 18 built-ins only.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Small stat helpers (never throw — a missing/unreadable path is just "no")
// ---------------------------------------------------------------------------

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Practice-file definitions (PRD §5.5's named list)
// ---------------------------------------------------------------------------

export const PRACTICE_FILES = [
  { name: 'CHANGELOG.md', find: (dir) => isFile(path.join(dir, 'CHANGELOG.md')) },
  { name: 'DECISIONS.md', find: (dir) => isFile(path.join(dir, 'DECISIONS.md')) },
  { name: 'docs/adr', find: (dir) => isDir(path.join(dir, 'docs', 'adr')) },
  {
    name: 'CLAUDE.md',
    find: (dir) => isFile(path.join(dir, '.claude', 'CLAUDE.md')) || isFile(path.join(dir, 'CLAUDE.md')),
  },
  { name: 'AGENTS.md', find: (dir) => isFile(path.join(dir, 'AGENTS.md')) },
];

const SKIP_CHILD_NAMES = new Set(['node_modules', '.git']);

// ---------------------------------------------------------------------------
// Root -> project-dir enumeration (depth-limited to one level)
// ---------------------------------------------------------------------------

/**
 * List a root's immediate child directories that are eligible to be treated
 * as "project dirs". Never follows symlinks (Dirent's isDirectory()/
 * isSymbolicLink() are based on the raw readdir entry, not a stat of the
 * link target, so a symlinked directory reports isDirectory()===false and
 * is excluded by the first check alone — the explicit isSymbolicLink() guard
 * is defense-in-depth, not load-bearing). Skips node_modules/.git and any
 * dot-directory. Missing root degrades to an empty list, not a throw.
 */
export function listProjectDirs(root) {
  const abs = path.resolve(root);
  let dirents;
  try {
    dirents = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return [];
  }
  const dirs = [];
  for (const d of dirents) {
    if (d.isSymbolicLink()) continue;
    if (!d.isDirectory()) continue;
    if (SKIP_CHILD_NAMES.has(d.name)) continue;
    if (d.name.startsWith('.')) continue;
    dirs.push(path.join(abs, d.name));
  }
  return dirs;
}

// ---------------------------------------------------------------------------
// Per-project gathering
// ---------------------------------------------------------------------------

/**
 * Read and parse a project's top-level package.json. Returns null when
 * absent or malformed — never throws, matching the tolerant-reader posture
 * used across the codebase (a bad package.json degrades that one project to
 * "no dependency/script data", it doesn't abort the whole scan).
 */
export function readPackageJson(projectDir) {
  const p = path.join(projectDir, 'package.json');
  if (!isFile(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/** Union of "dependencies" + "devDependencies" keys, de-duplicated. */
export function dependencyNames(pkg) {
  if (!pkg || typeof pkg !== 'object') return [];
  const deps = pkg.dependencies && typeof pkg.dependencies === 'object' ? pkg.dependencies : {};
  const devDeps = pkg.devDependencies && typeof pkg.devDependencies === 'object' ? pkg.devDependencies : {};
  return Array.from(new Set([...Object.keys(deps), ...Object.keys(devDeps)]));
}

/** Keys of package.json's "scripts" object. */
export function scriptNames(pkg) {
  if (!pkg || typeof pkg !== 'object') return [];
  const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  return Object.keys(scripts);
}

/** Canonical practice-file names present in a project dir. */
export function practiceFileNames(projectDir) {
  return PRACTICE_FILES.filter((p) => p.find(projectDir)).map((p) => p.name);
}

/**
 * Gather all three signal categories for one project dir. Never throws.
 */
export function scanProject(projectDir) {
  const pkg = readPackageJson(projectDir);
  return {
    path: projectDir,
    dependencies: dependencyNames(pkg),
    scripts: scriptNames(pkg),
    practices: practiceFileNames(projectDir),
  };
}

/**
 * Scan every immediate child project dir under each given root. Dedupes by
 * resolved absolute path, so overlapping/duplicate roots never double-count
 * a project.
 */
export function scanRoots(roots) {
  const seen = new Set();
  const projects = [];
  for (const root of roots) {
    for (const dir of listProjectDirs(root)) {
      const resolved = path.resolve(dir);
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      projects.push(scanProject(resolved));
    }
  }
  return projects;
}

// ---------------------------------------------------------------------------
// Recurrence tallying
// ---------------------------------------------------------------------------

/**
 * Turn scanned projects into a recurrence-sorted table for one signal
 * category ('dependencies' | 'scripts' | 'practices'). Sorted by count
 * descending, name ascending as a tiebreak — deterministic output, no ties
 * left to object-key iteration order. totalProjects is the full scanned
 * project count (the right denominator for "4 of 6 repos", not just the
 * projects that happened to carry that signal at all).
 */
export function tally(projects, category) {
  const byName = new Map();
  for (const project of projects) {
    for (const name of project[category]) {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(project.path);
    }
  }
  const rows = Array.from(byName.entries()).map(([name, paths]) => ({
    name,
    count: paths.length,
    totalProjects: projects.length,
    projects: paths,
  }));
  rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return rows;
}

/** True when a scanned project carried none of the three signal categories. */
function hasNoSignals(project) {
  return project.dependencies.length === 0 && project.scripts.length === 0 && project.practices.length === 0;
}

/**
 * Assemble the full report object for a set of roots + their scanned
 * projects. Carries a distinct `warning` (null when everything looks
 * ordinary) when one or more "project dirs" came back with zero signals in
 * every category — the telltale sign a root was pointed at something other
 * than a parent-of-projects folder (a single repo, or that repo's parent),
 * since a root's immediate children are then read as sibling projects that
 * usually aren't (PRD §5.5; see docs/plan.md's history-scan safeguard note).
 * This never blocks or filters output — it's a hint alongside the same
 * data, not a correction of it.
 */
export function buildReport(roots, projects) {
  const zeroSignalCount = projects.filter(hasNoSignals).length;
  const warning =
    zeroSignalCount > 0
      ? `${zeroSignalCount} of ${projects.length} scanned dir(s) had no signals at all -- ` +
        `is this the parent-of-projects folder? scout-scan.mjs expects a root whose ` +
        `IMMEDIATE CHILDREN are projects (e.g. ~/Documents/GitHub), not a single repo ` +
        `or that repo's own parent.`
      : null;
  return {
    roots: roots.map((r) => path.resolve(r)),
    projectsScanned: projects.length,
    projects: projects.map((p) => p.path),
    dependencies: tally(projects, 'dependencies'),
    practices: tally(projects, 'practices'),
    scripts: tally(projects, 'scripts'),
    warning,
  };
}

/** Convenience: scan and tally in one call. */
export function scan(roots) {
  const projects = scanRoots(roots);
  return buildReport(roots, projects);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const roots = [];
  let json = false;
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else roots.push(arg);
  }
  return { roots, json };
}

function printTallyTable(title, rows) {
  console.log(`\n${title}`);
  if (rows.length === 0) {
    console.log('  (none found)');
    return;
  }
  for (const row of rows) {
    console.log(`  ${row.count}/${row.totalProjects}  ${row.name}`);
  }
}

function main() {
  const { roots, json } = parseArgs(process.argv.slice(2));
  if (roots.length === 0) {
    console.error('usage: scout-scan.mjs <parent-of-projects-dir> [more roots...] [--json]');
    console.error(
      "  Each root's IMMEDIATE CHILD directories are treated as projects -- point this at"
    );
    console.error('  e.g. ~/Documents/GitHub, not at a single repo or that repo\'s own parent.');
    process.exit(1);
  }

  const report = scan(roots);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Scanned ${report.projectsScanned} project(s) under: ${report.roots.join(', ')}`);
  printTallyTable('Dependencies', report.dependencies);
  printTallyTable('Practice files', report.practices);
  printTallyTable('Scripts', report.scripts);
  if (report.warning) {
    console.log(`\nWarning: ${report.warning}`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}
