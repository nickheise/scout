#!/usr/bin/env node
// scout-block.mjs — idempotent managed-section writer for CLAUDE.md/AGENTS.md
// (docs/plan.md §2 task 2.2, docs/research/file-format-patterns.md §B).
//
// Implements the full §B spec:
//   1. Sentinel markers carrying a sync-<hash> of the generated body.
//   2. Whole-body rewrite each run; byte-compare first so unchanged runs are
//      true no-ops (no write syscall at all).
//   3. Hash verification: if the body currently sitting between the markers
//      doesn't hash to the value recorded in the begin marker, a human edited
//      it since Scout last wrote it — refuse and show a diff instead of
//      silently clobbering (the thing expo's mergeContents left as a TODO).
//   4. Corruption defense: begin-without-end, end-without-begin, multiple
//      begins, multiple ends -> refuse with a clear message. Never append a
//      duplicate block (the nvm anti-pattern).
//   5. First insert appends at EOF; every byte outside the markers — before
//      the block and after it — is preserved untouched, never reformatted.
//   6. `remove` deletes the block (markers included) cleanly.
//
// CRLF contract: marker *detection* is newline-convention agnostic — a line
// ending in '\r\n' still matches the begin/end marker patterns (the '\r' is
// stripped before matching). The file's dominant newline convention (as read)
// is detected once and used for every line we emit, so a CRLF file is never
// silently rewritten to LF (or vice versa) merely because Scout touched it.
//
// Zero npm dependencies: plain Node >= 18 built-ins only.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export class BlockError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'BlockError';
    this.code = code;
  }
}

const MARKER_VERSION = 'v1';
const BEGIN_RE = /^<!-- >>> scout:begin v1 sync-([0-9a-f]{12}) \(managed by scout — edits inside will be overwritten\) -->$/;
const END_LINE = '<!-- <<< scout:end -->';

function hashBody(body) {
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex').slice(0, 12);
}

/**
 * Normalize a block body to Scout's own internal contract: strip trailing
 * whitespace, guarantee exactly one trailing newline. This is a normalization
 * *we* control (Scout is the sole writer of the region between the markers),
 * distinct from rule 5's "preserve everything outside the markers verbatim"
 * — that rule is about content the block writer does not own.
 */
function normalizeBody(body) {
  return body.replace(/\s+$/, '') + '\n';
}

function beginLine(hash) {
  return `<!-- >>> scout:begin ${MARKER_VERSION} sync-${hash} (managed by scout — edits inside will be overwritten) -->`;
}

/**
 * Detect the dominant newline convention of `content`: '\r\n' if the first
 * line break found is CRLF, else '\n'. Content with no line breaks at all
 * defaults to '\n'. Used so CRLF files are never silently converted to LF
 * (or vice versa) just because Scout wrote to them.
 */
function detectEol(content) {
  const i = content.indexOf('\n');
  if (i > 0 && content[i - 1] === '\r') return '\r\n';
  return '\n';
}

function toLF(content) {
  return content.replace(/\r\n/g, '\n');
}

function fromLF(content, eol) {
  return eol === '\n' ? content : content.replace(/\n/g, eol);
}

/**
 * Scan file content for begin/end marker lines. Returns:
 *   { begins: [{ index, hash }], ends: [index] }
 * `index` is the 0-based line number in the `lines` split. Detection is
 * strictly line-based (a marker must occupy its own line) — deliberately
 * stricter than a bare substring grep (the nvm anti-pattern, §B.7). A
 * trailing '\r' (CRLF line endings) is stripped before matching so marker
 * detection works regardless of the file's newline convention.
 */
function scanMarkers(lines) {
  const begins = [];
  const ends = [];
  lines.forEach((line, index) => {
    const clean = line.endsWith('\r') ? line.slice(0, -1) : line;
    const m = BEGIN_RE.exec(clean);
    if (m) begins.push({ index, hash: m[1] });
    if (clean === END_LINE) ends.push(index);
  });
  return { begins, ends };
}

/**
 * Classify the current marker state in `content`. Returns one of:
 *   { state: 'absent' }
 *   { state: 'ok', beginIndex, endIndex, hash }
 *   { state: 'corrupt', reason: 'begin-without-end' | 'end-without-begin' |
 *             'multiple-begin' | 'multiple-end' | 'markers-reversed',
 *     detail: string }
 */
export function detectBlock(content) {
  const lines = content.length === 0 ? [] : content.split('\n');
  const { begins, ends } = scanMarkers(lines);

  if (begins.length === 0 && ends.length === 0) return { state: 'absent' };

  if (begins.length > 1) {
    return {
      state: 'corrupt',
      reason: 'multiple-begin',
      detail: `found ${begins.length} "scout:begin" markers (lines ${begins.map((b) => b.index + 1).join(', ')}); there must be exactly one.`,
    };
  }
  if (ends.length > 1) {
    return {
      state: 'corrupt',
      reason: 'multiple-end',
      detail: `found ${ends.length} "scout:end" markers (lines ${ends.map((i) => i + 1).join(', ')}); there must be exactly one.`,
    };
  }
  if (begins.length === 1 && ends.length === 0) {
    return {
      state: 'corrupt',
      reason: 'begin-without-end',
      detail: `found "scout:begin" at line ${begins[0].index + 1} with no matching "scout:end".`,
    };
  }
  if (begins.length === 0 && ends.length === 1) {
    return {
      state: 'corrupt',
      reason: 'end-without-begin',
      detail: `found "scout:end" at line ${ends[0] + 1} with no matching "scout:begin".`,
    };
  }
  // begins.length === 1 && ends.length === 1
  if (begins[0].index > ends[0]) {
    return {
      state: 'corrupt',
      reason: 'markers-reversed',
      detail: `"scout:end" at line ${ends[0] + 1} appears before "scout:begin" at line ${begins[0].index + 1}.`,
    };
  }
  return { state: 'ok', beginIndex: begins[0].index, endIndex: ends[0], hash: begins[0].hash };
}

function corruptMessage(file, detected) {
  return (
    `scout-block: refusing to write ${file} — the managed block's markers are ` +
    `corrupted (${detected.reason}). ${detected.detail}\n` +
    'Fix the markers by hand (or remove the stray one) and re-run, or delete ' +
    'the block manually if you no longer want it. Refusing rather than ' +
    'guessing, so nothing gets duplicated or silently dropped.'
  );
}

/**
 * Write `data` to `filePath` durably: write to a sibling temp file, then
 * fs.renameSync() over the target. Rename is atomic on the same filesystem,
 * so a crash/power-loss/ENOSPC between the two steps leaves either the old
 * file or the new one fully intact — never a truncated half-write. Preserves
 * the original file's mode when overwriting an existing file. Translates
 * EACCES/EPERM/EROFS into a clean BlockError instead of a raw stack trace.
 */
function permissionRefusal(filePath, code) {
  return new BlockError(
    `scout-block: cannot write ${filePath} — permission denied; check file permissions.`,
    code
  );
}

function atomicWriteFileSync(filePath, data) {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  let mode;

  if (fs.existsSync(resolved)) {
    try {
      fs.accessSync(resolved, fs.constants.W_OK);
    } catch {
      throw permissionRefusal(filePath, 'EACCES');
    }
    try {
      mode = fs.statSync(resolved).mode;
    } catch {
      mode = undefined;
    }
  }

  const tmpPath = path.join(dir, `.${path.basename(resolved)}.scout-tmp-${process.pid}-${Date.now()}`);
  try {
    fs.writeFileSync(tmpPath, data, 'utf8');
    if (mode !== undefined) {
      try {
        fs.chmodSync(tmpPath, mode);
      } catch {
        // best-effort; not fatal if chmod fails
      }
    }
    fs.renameSync(tmpPath, resolved);
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // tmp file may not have been created yet; ignore
    }
    if (err && (err.code === 'EACCES' || err.code === 'EPERM' || err.code === 'EROFS')) {
      throw permissionRefusal(filePath, err.code);
    }
    throw err;
  }
}

function simpleDiff(oldBody, newBody) {
  const oldLines = oldBody.split('\n');
  const newLines = newBody.split('\n');
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  const removed = oldLines.filter((l) => !newSet.has(l));
  const added = newLines.filter((l) => !oldSet.has(l));
  const parts = [];
  for (const l of removed) parts.push(`  - ${l}`);
  for (const l of added) parts.push(`  + ${l}`);
  if (parts.length === 0) return '  (bodies differ only in whitespace/line-ending)';
  return parts.join('\n');
}

/**
 * Write (insert or update) the managed block in `filePath` with `rawBody`.
 * Returns one of:
 *   { action: 'created' }            — file didn't exist, now does
 *   { action: 'inserted' }           — first insert into an existing file
 *   { action: 'updated' }            — existing scout-written block replaced
 *   { action: 'noop' }               — content already current, nothing written
 * Throws BlockError (never writes) on:
 *   - corrupted markers (any of the four+ cases above)
 *   - a body that was hand-edited since Scout last wrote it, unless `force`
 */
export function writeBlock(filePath, rawBody, opts = {}) {
  const newBody = normalizeBody(rawBody);
  const newHash = hashBody(newBody);

  const exists = fs.existsSync(filePath);
  const rawContent = exists ? fs.readFileSync(filePath, 'utf8') : '';
  // Detect the file's own newline convention and do all line-based work on
  // an internally-normalized (LF-only) copy, so CRLF marker lines are
  // matched exactly like LF ones. The convention is restored on the final
  // string right before it's written — the file is never silently
  // converted from one convention to the other.
  const eol = rawContent.length > 0 ? detectEol(rawContent) : '\n';
  const content = toLF(rawContent);

  const detected = detectBlock(content);

  if (detected.state === 'corrupt') {
    throw new BlockError(corruptMessage(filePath, detected), 'ECORRUPT');
  }

  if (detected.state === 'absent') {
    let out = content;
    if (out.length > 0 && !out.endsWith('\n')) out += '\n';
    if (out.length > 0) out += '\n'; // blank-line separator before the block
    out += beginLine(newHash) + '\n' + newBody + END_LINE + '\n';
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
    atomicWriteFileSync(filePath, fromLF(out, eol));
    return { action: exists ? 'inserted' : 'created' };
  }

  // detected.state === 'ok'
  const lines = content.split('\n');
  const currentBody = lines.slice(detected.beginIndex + 1, detected.endIndex).join('\n') + '\n';
  const actualHash = hashBody(currentBody);

  if (actualHash !== detected.hash && !opts.force) {
    throw new BlockError(
      [
        `scout-block: refusing to overwrite ${filePath} — its scout-managed block ` +
          `was edited by hand since Scout last wrote it (recorded sync-${detected.hash}, ` +
          `current content hashes to sync-${actualHash}).`,
        'Diff (lines only on one side; not a minimal edit script):',
        simpleDiff(currentBody, newBody),
        '',
        'Move any custom text outside the markers (nothing there is ever ' +
          'touched), or re-run with an explicit instruction to replace the ' +
          'body anyway.',
      ].join('\n'),
      'EUSEREDIT'
    );
  }

  if (currentBody === newBody && !opts.force) {
    return { action: 'noop' };
  }

  const before = lines.slice(0, detected.beginIndex).join('\n');
  const after = lines.slice(detected.endIndex + 1).join('\n');
  const newBlock = beginLine(newHash) + '\n' + newBody + END_LINE;
  const out = (before.length > 0 ? before + '\n' : '') + newBlock + (after.length > 0 ? '\n' + after : '\n');
  atomicWriteFileSync(filePath, fromLF(out, eol));
  return { action: 'updated' };
}

/**
 * Remove the managed block (markers included) from `filePath`. No-op if the
 * file doesn't exist or carries no block. Throws BlockError on corrupted
 * markers (same refusal as write — never guess which lines to delete).
 */
export function removeBlock(filePath) {
  if (!fs.existsSync(filePath)) {
    return { action: 'noop', reason: 'file does not exist' };
  }
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const eol = rawContent.length > 0 ? detectEol(rawContent) : '\n';
  const content = toLF(rawContent);
  const detected = detectBlock(content);

  if (detected.state === 'corrupt') {
    throw new BlockError(corruptMessage(filePath, detected), 'ECORRUPT');
  }
  if (detected.state === 'absent') {
    return { action: 'noop', reason: 'no block present' };
  }

  const lines = content.split('\n');
  const before = lines.slice(0, detected.beginIndex);
  const after = lines.slice(detected.endIndex + 1);
  // Drop a single blank separator line directly before the block, if present
  // (the one write() adds on first insert), so removal is clean rather than
  // leaving a growing gap on repeated insert/remove cycles.
  if (before.length > 0 && before[before.length - 1] === '') before.pop();
  const out = [...before, ...after].join('\n');
  atomicWriteFileSync(filePath, fromLF(out, eol));
  return { action: 'removed' };
}

/**
 * Read-only status check: 'absent' | 'ok' | 'corrupt:<reason>'. Never writes.
 */
export function checkBlock(filePath) {
  if (!fs.existsSync(filePath)) return { state: 'absent' };
  const content = fs.readFileSync(filePath, 'utf8');
  return detectBlock(content);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function usage() {
  return [
    'usage: scout-block.mjs write <file> [--force]   (body via stdin)',
    '       scout-block.mjs remove <file>',
    '       scout-block.mjs status <file>',
    '',
    'write:  upserts the scout-managed block in <file> with the body piped',
    "        on stdin. Byte-identical re-runs are a no-op. Refuses (exit 1)",
    '        if the block was hand-edited since the last scout write, unless',
    '        --force is passed.',
    'remove: deletes the block (markers included) from <file>. No-op if the',
    '        file or block is absent.',
    'status: prints one of: absent | ok | corrupt:<reason>. Read-only.',
  ].join('\n');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function main() {
  const [command, file, ...rest] = process.argv.slice(2);
  const force = rest.includes('--force');

  if (!command || command === '--help' || command === '-h') {
    console.log(usage());
    process.exit(command ? 0 : 1);
    return;
  }

  if (!file) {
    fail(`scout-block: "${command}" requires a <file> argument.\n\n${usage()}`);
    return;
  }

  try {
    switch (command) {
      case 'write': {
        const body = readStdin();
        const result = writeBlock(file, body, { force });
        console.log(`${result.action}: ${file}`);
        break;
      }
      case 'remove': {
        const result = removeBlock(file);
        console.log(`${result.action}: ${file}${result.reason ? ` (${result.reason})` : ''}`);
        break;
      }
      case 'status': {
        const result = checkBlock(file);
        if (result.state === 'corrupt') console.log(`corrupt:${result.reason} — ${result.detail}`);
        else console.log(result.state);
        break;
      }
      default:
        fail(`scout-block: unknown command "${command}".\n\n${usage()}`);
    }
  } catch (err) {
    if (err instanceof BlockError) {
      fail(err.message);
    } else {
      throw err;
    }
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}
