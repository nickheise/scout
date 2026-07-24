// test/note.test.mjs — unit + CLI tests for bin/scout-note.mjs (D-018,
// docs/research/field-reports.md — R6 Phase A).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  NOTE_SCHEMA_VERSION,
  TRIGGERS,
  buildNote,
  appendNote,
  listNotes,
  NoteError,
} from '../bin/scout-note.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const NOTE_BIN = path.join(REPO_ROOT, 'bin', 'scout-note.mjs');

function tmpNotesPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'scout-note-test-')), 'field-notes.jsonl');
}

const VALID = {
  skill: 'start',
  step: '4.4 write through the block writer',
  trigger: 'step-failed',
  what_happened: 'block writer refused on CRLF endings',
  docs_said: 'the writer is idempotent',
  did_instead: 'user converted the file to LF; re-run wrote cleanly',
  worked: true,
  proposed_change: 'name CRLF in the refusal message',
  confidence: 'high',
};

test('buildNote stamps schema, date, plugin_version, platform — and they win over caller values', () => {
  const note = buildNote({ ...VALID, schema: 99, plugin_version: 'lies', platform: 'win95', date: '1999-01-01' }, '2026-07-24');
  assert.equal(note.schema, NOTE_SCHEMA_VERSION);
  assert.equal(note.date, '2026-07-24');
  assert.equal(note.platform, process.platform);
  // plugin_version comes from the real manifest, not the caller
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(note.plugin_version, manifest.version);
});

test('buildNote refuses missing required fields, bad enums, non-boolean worked', () => {
  for (const field of ['skill', 'trigger', 'what_happened', 'did_instead', 'worked']) {
    const bad = { ...VALID };
    delete bad[field];
    assert.throws(() => buildNote(bad), NoteError, `missing ${field} must throw`);
  }
  assert.throws(() => buildNote({ ...VALID, trigger: 'felt-off' }), NoteError);
  assert.throws(() => buildNote({ ...VALID, worked: 'yes' }), NoteError);
  assert.throws(() => buildNote({ ...VALID, confidence: 'certain' }), NoteError);
  assert.throws(() => buildNote({ ...VALID, skill: '  ' }), NoteError);
  assert.throws(() => buildNote([VALID]), NoteError);
});

test('every documented trigger is accepted; unknown extra fields ride along', () => {
  for (const trigger of TRIGGERS) {
    const note = buildNote({ ...VALID, trigger, future_field: 'kept' });
    assert.equal(note.trigger, trigger);
    assert.equal(note.future_field, 'kept');
  }
});

test('appendNote creates the parent dir, appends (never clobbers), and listNotes round-trips', () => {
  const notesPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'scout-note-test-')), 'deep', 'field-notes.jsonl');
  appendNote(VALID, notesPath);
  appendNote({ ...VALID, skill: 'setup', trigger: 'user-corrected' }, notesPath);
  const notes = listNotes(notesPath);
  assert.equal(notes.length, 2);
  assert.equal(notes[0].skill, 'start');
  assert.equal(notes[1].trigger, 'user-corrected');
});

test('listNotes is a tolerant reader: malformed lines are skipped, file never rewritten', () => {
  const notesPath = tmpNotesPath();
  appendNote(VALID, notesPath);
  fs.appendFileSync(notesPath, '{not json\n');
  appendNote({ ...VALID, skill: 'survey' }, notesPath);
  const before = fs.readFileSync(notesPath, 'utf8');
  const notes = listNotes(notesPath);
  assert.equal(notes.length, 2);
  assert.equal(fs.readFileSync(notesPath, 'utf8'), before, 'reading never rewrites');
});

test('listNotes on a missing file is an empty list, not an error', () => {
  assert.deepEqual(listNotes(path.join(os.tmpdir(), 'scout-note-nowhere', 'nope.jsonl')), []);
});

test('CLI: append reads stdin, honors SCOUT_FIELD_NOTES, and list round-trips', () => {
  const notesPath = tmpNotesPath();
  const env = { ...process.env, SCOUT_FIELD_NOTES: notesPath };
  const out = execFileSync('node', [NOTE_BIN, 'append'], {
    encoding: 'utf8',
    input: JSON.stringify(VALID),
    env,
  });
  assert.match(out, /noted → /);
  const listed = JSON.parse(execFileSync('node', [NOTE_BIN, 'list', '--json'], { encoding: 'utf8', env }));
  assert.equal(listed.length, 1);
  assert.equal(listed[0].skill, 'start');
  assert.equal(listed[0].schema, NOTE_SCHEMA_VERSION);
});

test('CLI: invalid input exits 1 with a message and writes nothing', () => {
  const notesPath = tmpNotesPath();
  const env = { ...process.env, SCOUT_FIELD_NOTES: notesPath };
  assert.throws(
    () => execFileSync('node', [NOTE_BIN, 'append'], { encoding: 'utf8', input: '{"skill":"x"}', env, stdio: 'pipe' }),
    /missing required field/
  );
  assert.ok(!fs.existsSync(notesPath), 'nothing written on refusal');
});

test('CLI: path prints the resolved notes file', () => {
  const notesPath = tmpNotesPath();
  const out = execFileSync('node', [NOTE_BIN, 'path'], {
    encoding: 'utf8',
    env: { ...process.env, SCOUT_FIELD_NOTES: notesPath },
  });
  assert.equal(out.trim(), notesPath);
});
