#!/usr/bin/env node
// scout-note.mjs — the field-notes channel (docs/research/field-reports.md,
// DECISIONS.md D-018 — R6 Phase A).
//
// One JSONL file of skill-mechanics deviation notes, machine-local by
// design: default ~/.scout/field-notes.jsonl (SCOUT_FIELD_NOTES overrides —
// a test/ops escape hatch). Deliberately DECOUPLED from the pack dir: a
// Tier 1 pack syncs to a git remote the user owns, and field notes carry
// error text and paths that must never ride along to a remote. Notes are
// internal triage material for the maintainer's own machines only —
// nothing here is ever collected, published, or transmitted (Phase B, if
// it ever ships, is courier-pattern and document-only first).
//
// Division of labor (agent-as-brain, code-as-choreography): the running
// skill decides WHETHER a run deviated (the trigger contract in
// references/field-notes.md — closed enum, max one note per run) and
// writes the judgment fields; this script owns everything deterministic —
// validation against the closed enums, version/date/platform stamping
// (read from plugin.json at append time, never guessed by the model), and
// the append itself. A note the model half-remembers to stamp is exactly
// the staleness-filtering failure D-018 exists to prevent.
//
// House rules inherited from scout-store.mjs:
//   - tolerant reader: `list` skips malformed lines with a stderr warning,
//     never rewrites the file; unknown fields on a note ride along.
//   - append-only: no command edits or deletes an existing line.
//   - malformed input is refused with a message; the file is not touched.
//
// Zero npm dependencies: plain Node >= 18 built-ins only.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_MANIFEST = path.join(__dirname, '..', '.claude-plugin', 'plugin.json');

export const NOTE_SCHEMA_VERSION = 1;

/** Closed enum — the trigger contract (references/field-notes.md). */
export const TRIGGERS = ['step-failed', 'undocumented-environment', 'user-corrected'];

/** Closed enum — the note author's worth-acting-on self-assessment. */
export const CONFIDENCE = ['low', 'medium', 'high'];

/** Judgment fields the skill must supply. */
const REQUIRED = ['skill', 'trigger', 'what_happened', 'did_instead', 'worked'];

/** Optional judgment fields (anything else unknown rides along untouched). */
const OPTIONAL = ['step', 'docs_said', 'proposed_change', 'confidence', 'context'];

export function defaultNotesPath() {
  return path.join(os.homedir(), '.scout', 'field-notes.jsonl');
}

export function resolveNotesPath() {
  if (process.env.SCOUT_FIELD_NOTES) return path.resolve(process.env.SCOUT_FIELD_NOTES);
  return defaultNotesPath();
}

/** Read the installed plugin version at append time — never guessed. */
export function pluginVersion() {
  try {
    const manifest = JSON.parse(fs.readFileSync(PLUGIN_MANIFEST, 'utf8'));
    return typeof manifest.version === 'string' ? manifest.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

export class NoteError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoteError';
  }
}

/**
 * Validate the skill-supplied fields and return the full stamped note.
 * Stamped fields (schema, date, plugin_version, platform) always win over
 * caller-supplied values — a note's provenance is this script's job.
 */
export function buildNote(input, today = new Date().toISOString().slice(0, 10)) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new NoteError('a note must be a single JSON object');
  }
  for (const field of REQUIRED) {
    if (!(field in input)) throw new NoteError(`missing required field "${field}"`);
  }
  if (!TRIGGERS.includes(input.trigger)) {
    throw new NoteError(`trigger must be one of: ${TRIGGERS.join(', ')} (got ${JSON.stringify(input.trigger)})`);
  }
  if (typeof input.worked !== 'boolean') {
    throw new NoteError('"worked" must be a boolean');
  }
  if ('confidence' in input && !CONFIDENCE.includes(input.confidence)) {
    throw new NoteError(`confidence must be one of: ${CONFIDENCE.join(', ')} (got ${JSON.stringify(input.confidence)})`);
  }
  for (const field of ['skill', 'what_happened', 'did_instead']) {
    if (typeof input[field] !== 'string' || input[field].trim() === '') {
      throw new NoteError(`"${field}" must be a non-empty string`);
    }
  }
  return {
    schema: NOTE_SCHEMA_VERSION,
    date: today,
    plugin_version: pluginVersion(),
    platform: process.platform,
    ...input,
    // re-assert stamped fields so caller values can never shadow them
    ...{ schema: NOTE_SCHEMA_VERSION, date: today, plugin_version: pluginVersion(), platform: process.platform },
  };
}

/** Append one validated note. Creates the parent dir on first write. */
export function appendNote(input, notesPath = resolveNotesPath()) {
  const note = buildNote(input);
  fs.mkdirSync(path.dirname(notesPath), { recursive: true });
  fs.appendFileSync(notesPath, JSON.stringify(note) + '\n', 'utf8');
  return { note, notesPath };
}

/** Tolerant reader: malformed lines are skipped (warned to stderr), never rewritten. */
export function listNotes(notesPath = resolveNotesPath()) {
  if (!fs.existsSync(notesPath)) return [];
  const lines = fs.readFileSync(notesPath, 'utf8').split('\n').filter((l) => l.trim() !== '');
  const notes = [];
  lines.forEach((line, i) => {
    try {
      notes.push(JSON.parse(line));
    } catch {
      process.stderr.write(`scout-note: skipping malformed line ${i + 1} in ${notesPath}\n`);
    }
  });
  return notes;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `usage: scout-note.mjs <command>

  append          read one JSON note object from stdin, validate, stamp
                  (schema/date/plugin_version/platform), and append it to
                  the notes file. Prints the stored note and path.
  list [--json]   print all notes (tolerant reader; --json prints an array)
  path            print the notes file path and exit

Notes file: ~/.scout/field-notes.jsonl (SCOUT_FIELD_NOTES overrides).
Skill-supplied fields — required: skill, trigger (${TRIGGERS.join('|')}),
what_happened, did_instead, worked (boolean); optional: step, docs_said,
proposed_change, confidence (${CONFIDENCE.join('|')}), context.`;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main(argv) {
  const [command, ...rest] = argv;
  const notesPath = resolveNotesPath();

  if (command === 'append') {
    const raw = readStdin().trim();
    if (raw === '') {
      process.stderr.write('scout-note: append expects one JSON object on stdin\n');
      return 1;
    }
    let input;
    try {
      input = JSON.parse(raw);
    } catch (err) {
      process.stderr.write(`scout-note: stdin is not valid JSON: ${err.message}\n`);
      return 1;
    }
    try {
      const { note } = appendNote(input, notesPath);
      process.stdout.write(`noted → ${notesPath}\n${JSON.stringify(note)}\n`);
      return 0;
    } catch (err) {
      if (err instanceof NoteError) {
        process.stderr.write(`scout-note: ${err.message}\n`);
        return 1;
      }
      throw err;
    }
  }

  if (command === 'list') {
    const notes = listNotes(notesPath);
    if (rest.includes('--json')) {
      process.stdout.write(JSON.stringify(notes, null, 2) + '\n');
    } else if (notes.length === 0) {
      process.stdout.write(`no field notes at ${notesPath}\n`);
    } else {
      for (const n of notes) {
        process.stdout.write(
          `${n.date}  v${n.plugin_version}  ${n.skill}${n.step ? `/${n.step}` : ''}  [${n.trigger}]  ${n.what_happened}\n`
        );
      }
    }
    return 0;
  }

  if (command === 'path') {
    process.stdout.write(notesPath + '\n');
    return 0;
  }

  process.stderr.write(USAGE + '\n');
  return command === undefined || command === 'help' ? 0 : 1;
}

if (process.argv[1] === __filename) {
  process.exit(main(process.argv.slice(2)));
}
