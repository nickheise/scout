// test/block.test.mjs — idempotency suite for bin/scout-block.mjs
// (docs/plan.md §4 task 2.2 acceptance: "idempotency suite: fresh insert,
// update, no-op, user-edited body, four corruption cases, removal").

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { writeBlock, removeBlock, checkBlock, detectBlock, BlockError } from '../bin/scout-block.mjs';

function tmpFile(initialContent) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-block-test-'));
  const file = path.join(dir, 'CLAUDE.md');
  if (initialContent !== undefined) fs.writeFileSync(file, initialContent, 'utf8');
  return file;
}

// ---------------------------------------------------------------------------
// Fresh insert
// ---------------------------------------------------------------------------

test('fresh insert into a nonexistent file creates it with the block', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-block-test-'));
  const file = path.join(dir, 'CLAUDE.md');
  const result = writeBlock(file, 'hello world\n');
  assert.equal(result.action, 'created');
  const content = fs.readFileSync(file, 'utf8');
  assert.match(content, /^<!-- >>> scout:begin v1 sync-[0-9a-f]{12} \(managed by scout — edits inside will be overwritten\) -->\nhello world\n<!-- <<< scout:end -->\n$/);
});

test('fresh insert into an existing file appends at EOF and preserves prior bytes', () => {
  const file = tmpFile('# My Project\n\nSome existing content.\n');
  const result = writeBlock(file, '## Scout pack\n\n- item one\n');
  assert.equal(result.action, 'inserted');
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(content.startsWith('# My Project\n\nSome existing content.\n'));
  assert.match(content, /scout:begin v1 sync-[0-9a-f]{12}/);
  assert.match(content, /- item one/);
  assert.ok(content.trim().endsWith('<!-- <<< scout:end -->'));
});

test('fresh insert into a file with no trailing newline still separates cleanly', () => {
  const file = tmpFile('no trailing newline here');
  writeBlock(file, 'body\n');
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(content.startsWith('no trailing newline here\n\n<!-- >>>'));
});

// ---------------------------------------------------------------------------
// No-op
// ---------------------------------------------------------------------------

test('re-running write() with byte-identical body is a true no-op (file untouched)', () => {
  const file = tmpFile('preamble\n');
  writeBlock(file, '## Scout pack\n\n- a\n- b\n');
  const before = fs.readFileSync(file, 'utf8');
  const mtimeBefore = fs.statSync(file).mtimeMs;
  const result = writeBlock(file, '## Scout pack\n\n- a\n- b\n');
  assert.equal(result.action, 'noop');
  const after = fs.readFileSync(file, 'utf8');
  assert.equal(after, before);
  // mtime should not advance since we must not even open the file for writing
  assert.equal(fs.statSync(file).mtimeMs, mtimeBefore);
});

test('no-op is insensitive to trailing-whitespace-only differences in the piped body', () => {
  const file = tmpFile('preamble\n');
  writeBlock(file, 'line one\nline two\n');
  const result = writeBlock(file, 'line one\nline two\n\n\n'); // extra trailing blank lines
  assert.equal(result.action, 'noop');
});

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

test('update: a legitimately-changed body (hash still matches recorded) is replaced in place', () => {
  const file = tmpFile('preamble\n\ntrailer text\n');
  writeBlock(file, '## Scout pack\n\n- a\n');
  const result = writeBlock(file, '## Scout pack\n\n- a\n- b\n');
  assert.equal(result.action, 'updated');
  const content = fs.readFileSync(file, 'utf8');
  assert.match(content, /- a\n- b/);
});

test('update preserves content before and after the block verbatim', () => {
  const file = tmpFile('# Title\n\nBefore text.\n');
  writeBlock(file, 'v1 body\n');
  // Append trailer content after the block, outside the markers.
  fs.appendFileSync(file, '\nAfter text, never touched.\n');
  writeBlock(file, 'v2 body\n');
  const content = fs.readFileSync(file, 'utf8');
  assert.match(content, /^# Title\n\nBefore text\./);
  assert.match(content, /After text, never touched\.\n?$/);
  assert.match(content, /v2 body/);
  assert.ok(!content.includes('v1 body'));
});

// ---------------------------------------------------------------------------
// User-edited body (warn, don't clobber)
// ---------------------------------------------------------------------------

test('write() refuses when the block body was hand-edited since the last scout write', () => {
  const file = tmpFile('preamble\n');
  writeBlock(file, '## Scout pack\n\n- a\n');
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, content.replace('- a', '- a\n- USER ADDED THIS BY HAND'), 'utf8');

  assert.throws(
    () => writeBlock(file, '## Scout pack\n\n- a\n- b\n'),
    (err) => {
      assert.ok(err instanceof BlockError);
      assert.equal(err.code, 'EUSEREDIT');
      assert.match(err.message, /edited by hand/);
      return true;
    }
  );
  // Refusal must not have written anything.
  const after = fs.readFileSync(file, 'utf8');
  assert.match(after, /USER ADDED THIS BY HAND/);
});

test('write(..., { force: true }) overrides the user-edit refusal explicitly', () => {
  const file = tmpFile('preamble\n');
  writeBlock(file, '## Scout pack\n\n- a\n');
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, content.replace('- a', '- a\n- USER ADDED THIS'), 'utf8');

  const result = writeBlock(file, '## Scout pack\n\n- a\n- b\n', { force: true });
  assert.equal(result.action, 'updated');
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(!after.includes('USER ADDED THIS'));
  assert.match(after, /- b/);
});

// ---------------------------------------------------------------------------
// Four corruption cases
// ---------------------------------------------------------------------------

const BEGIN = '<!-- >>> scout:begin v1 sync-abcdef123456 (managed by scout — edits inside will be overwritten) -->';
const END = '<!-- <<< scout:end -->';

test('corruption: begin-without-end refuses without writing', () => {
  const file = tmpFile(`${BEGIN}\nstuff\n`);
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(
    () => writeBlock(file, 'new body\n'),
    (err) => {
      assert.ok(err instanceof BlockError);
      assert.equal(err.code, 'ECORRUPT');
      assert.match(err.message, /begin-without-end/);
      return true;
    }
  );
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('corruption: end-without-begin refuses without writing', () => {
  const file = tmpFile(`stuff\n${END}\n`);
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(
    () => writeBlock(file, 'new body\n'),
    (err) => {
      assert.equal(err.code, 'ECORRUPT');
      assert.match(err.message, /end-without-begin/);
      return true;
    }
  );
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('corruption: multiple begin markers refuses without writing (never appends a duplicate)', () => {
  const file = tmpFile(`${BEGIN}\na\n${BEGIN}\nb\n${END}\n`);
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(
    () => writeBlock(file, 'new body\n'),
    (err) => {
      assert.equal(err.code, 'ECORRUPT');
      assert.match(err.message, /multiple-begin/);
      return true;
    }
  );
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('corruption: multiple end markers refuses without writing', () => {
  const file = tmpFile(`${BEGIN}\na\n${END}\n${END}\n`);
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(
    () => writeBlock(file, 'new body\n'),
    (err) => {
      assert.equal(err.code, 'ECORRUPT');
      assert.match(err.message, /multiple-end/);
      return true;
    }
  );
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('corruption is also refused by remove() and checkBlock(), never guessed past', () => {
  const file = tmpFile(`${BEGIN}\na\n`);
  assert.throws(() => removeBlock(file), (err) => err.code === 'ECORRUPT');
  const status = checkBlock(file);
  assert.equal(status.state, 'corrupt');
  assert.equal(status.reason, 'begin-without-end');
});

// ---------------------------------------------------------------------------
// Removal
// ---------------------------------------------------------------------------

test('remove() deletes the block including markers and preserves surrounding content', () => {
  const file = tmpFile('Before.\n');
  writeBlock(file, 'block body\n');
  fs.appendFileSync(file, 'After, preserved.\n');
  const result = removeBlock(file);
  assert.equal(result.action, 'removed');
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(!content.includes('scout:begin'));
  assert.ok(!content.includes('scout:end'));
  assert.ok(!content.includes('block body'));
  assert.match(content, /^Before\.\n/);
  assert.match(content, /After, preserved\.\n?$/);
});

test('remove() is a no-op when the file does not exist', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-block-test-'));
  const file = path.join(dir, 'nonexistent.md');
  const result = removeBlock(file);
  assert.equal(result.action, 'noop');
  assert.ok(!fs.existsSync(file));
});

test('remove() is a no-op when the file exists but carries no block', () => {
  const file = tmpFile('just some text\n');
  const before = fs.readFileSync(file, 'utf8');
  const result = removeBlock(file);
  assert.equal(result.action, 'noop');
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

// ---------------------------------------------------------------------------
// detectBlock() / checkBlock() direct coverage
// ---------------------------------------------------------------------------

test('detectBlock() reports "absent" for content with no markers at all', () => {
  assert.equal(detectBlock('nothing here').state, 'absent');
  assert.equal(detectBlock('').state, 'absent');
});

test('checkBlock() on a valid block reports "ok" without writing anything', () => {
  const file = tmpFile('pre\n');
  writeBlock(file, 'body\n');
  const before = fs.readFileSync(file, 'utf8');
  const status = checkBlock(file);
  assert.equal(status.state, 'ok');
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

// ---------------------------------------------------------------------------
// CRLF line endings (git core.autocrlf=true / Windows-editor scenario)
// ---------------------------------------------------------------------------

function toCRLF(content) {
  return content.replace(/\n/g, '\r\n');
}

test('CRLF file: a same-body re-run is a true no-op, never a duplicate block', () => {
  const file = tmpFile('preamble\n');
  writeBlock(file, '## Scout pack\n\n- a\n- b\n');

  // Simulate the file having been converted to CRLF since (git core.autocrlf,
  // a Windows editor, etc).
  const crlfContent = toCRLF(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, crlfContent, 'utf8');

  const status = checkBlock(file);
  assert.equal(status.state, 'ok');

  const result = writeBlock(file, '## Scout pack\n\n- a\n- b\n');
  assert.equal(result.action, 'noop');

  const after = fs.readFileSync(file, 'utf8');
  const beginCount = (after.match(/scout:begin/g) || []).length;
  const endCount = (after.match(/scout:end/g) || []).length;
  assert.equal(beginCount, 1);
  assert.equal(endCount, 1);
  // Re-run must not have touched the file at all (true no-op), so the CRLF
  // convention introduced above survives untouched.
  assert.equal(after, crlfContent);
});

test('CRLF file: a legitimate body change updates in place without duplicating markers and keeps CRLF', () => {
  const file = tmpFile('preamble\n');
  writeBlock(file, '## Scout pack\n\n- a\n');
  fs.writeFileSync(file, toCRLF(fs.readFileSync(file, 'utf8')), 'utf8');

  const result = writeBlock(file, '## Scout pack\n\n- a\n- b\n');
  assert.equal(result.action, 'updated');

  const after = fs.readFileSync(file, 'utf8');
  assert.equal((after.match(/scout:begin/g) || []).length, 1);
  assert.equal((after.match(/scout:end/g) || []).length, 1);
  assert.match(after, /- a\r\n- b\r\n/);
  // File-wide newline convention is preserved, not silently flipped to LF.
  assert.ok(!/[^\r]\n/.test(after), 'expected every line break to remain CRLF');
});

test('CRLF file: remove() deletes the block cleanly and preserves the CRLF convention', () => {
  const file = tmpFile('Before.\n');
  writeBlock(file, 'block body\n');
  fs.appendFileSync(file, 'After, preserved.\n');
  fs.writeFileSync(file, toCRLF(fs.readFileSync(file, 'utf8')), 'utf8');

  const result = removeBlock(file);
  assert.equal(result.action, 'removed');
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(!content.includes('scout:begin'));
  assert.ok(!content.includes('scout:end'));
  assert.match(content, /^Before\.\r\n/);
  assert.match(content, /After, preserved\.\r?\n?$/);
});

test('detectBlock() matches markers on CRLF content directly (defense in depth for checkBlock)', () => {
  const lfContent = `${BEGIN}\nbody\n${END}\n`;
  const crlfContent = toCRLF(lfContent);
  const status = detectBlock(crlfContent);
  assert.equal(status.state, 'ok');
});

// ---------------------------------------------------------------------------
// Atomic write (temp file + rename)
// ---------------------------------------------------------------------------

test('write() leaves no leftover temp files behind in the target directory', () => {
  const file = tmpFile('preamble\n');
  writeBlock(file, 'body one\n');
  writeBlock(file, 'body two\n'); // update path
  removeBlock(file); // remove path re-inserted then removed
  const dir = path.dirname(file);
  const leftovers = fs.readdirSync(dir).filter((f) => f.includes('.scout-tmp-'));
  assert.deepEqual(leftovers, []);
});

// ---------------------------------------------------------------------------
// Permission errors (clean refusal, not a raw stack trace)
// ---------------------------------------------------------------------------

test('write() on a read-only file throws a clean BlockError instead of a raw EACCES stack', () => {
  const file = tmpFile('preamble\n');
  fs.chmodSync(file, 0o444);
  try {
    assert.throws(
      () => writeBlock(file, 'body\n'),
      (err) => {
        assert.ok(err instanceof BlockError);
        assert.match(err.message, /permission denied/);
        return true;
      }
    );
  } finally {
    fs.chmodSync(file, 0o644); // allow tmp-dir cleanup
  }
});
