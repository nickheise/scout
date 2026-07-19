#!/usr/bin/env node
// scout-store.mjs — choreography over a pack folder (docs/plan.md §2, §3).
//
// One JSON file per entry, filename = `${id}.json`, inside a "pack dir"
// (default ~/.scout/pack, overridable via --pack or SCOUT_PACK). This module
// is both a CLI (see main() at the bottom) and a library of exported
// functions for reuse by other scripts (compile, MCP server, etc).
//
// Binding rules this file implements (docs/research/file-format-patterns.md §A):
//   - tolerant reader: unknown fields are never dropped, and round-trip
//     byte-faithfully across read-modify-write (we merge patches onto the
//     parsed object rather than serializing from a fixed struct, so any key
//     we don't know about rides along untouched).
//   - opening/reading a file NEVER rewrites it. Every "read" path below is
//     pure I/O-in, no I/O-out.
//   - migrate-on-read scaffold: MIGRATIONS is keyed by target schema int;
//     applied lazily in memory only. Identity for v1 (nothing to migrate to
//     yet — v1 IS the current version).
//   - malformed JSON is refused with an error naming the file; the file is
//     never touched (no write attempted) when this happens.
//
// Zero npm dependencies: plain Node >= 18 built-ins only.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_PATH = path.join(__dirname, '..', 'schema', 'entry.v1.json');

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class StoreError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'StoreError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Pack dir resolution
// ---------------------------------------------------------------------------

export function defaultPackDir() {
  return path.join(os.homedir(), '.scout', 'pack');
}

/**
 * Resolution order: explicit --pack flag > SCOUT_PACK env var > default.
 * `opts.pack` is whatever the caller already parsed from --pack, if any.
 */
export function resolvePackDir(opts = {}) {
  if (opts.pack) return path.resolve(opts.pack);
  if (process.env.SCOUT_PACK) return path.resolve(process.env.SCOUT_PACK);
  return defaultPackDir();
}

function ensurePackDir(packDir) {
  fs.mkdirSync(packDir, { recursive: true });
}

export function entryPath(packDir, id) {
  return path.join(packDir, `${id}.json`);
}

// Same shape as schema/entry.v1.json's own `id` pattern. Ids can arrive here
// from user text, model output, or the courier reactivation phrase (D-011),
// so any operation that turns a caller-supplied id straight into a file path
// must refuse anything that isn't already a well-formed slug — otherwise
// `../../etc/passwd`-style ids can walk entryPath() outside the pack dir.
// createEntry() is exempt: it fully validates the assembled entry (this same
// pattern, via the schema) before writeEntryFile() ever runs, so a bad id
// there is refused as EVALIDATE, never reaches the filesystem.
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function assertValidId(id) {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new StoreError(
      `Invalid entry id: ${JSON.stringify(id)}. Ids must match ${ID_PATTERN} — refusing to touch the filesystem.`,
      'EINVALID'
    );
  }
}

// ---------------------------------------------------------------------------
// Migrate-on-read scaffold (file-format-patterns.md §A.7, §A.9)
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA = 1;

// Keyed by the *target* schema version a migration produces. MIGRATIONS[1]
// is the identity step for entries already at v1 (the baseline — there is
// nothing to migrate from yet). When schema 2 ships, add MIGRATIONS[2] here
// and every prior-version reader keeps working forever (§A.9): the loop
// below walks a v1 file through MIGRATIONS[2], MIGRATIONS[3], ... up to
// CURRENT_SCHEMA, all in memory, never touching disk.
export const MIGRATIONS = {
  1: (entry) => entry, // identity — v1 is the floor, nothing precedes it
};

/**
 * Lazily migrate a parsed entry object to CURRENT_SCHEMA, in memory only.
 * Never writes anything. Unknown fields ride along untouched because we
 * pass the same object reference through each step unless a migration
 * function chooses to copy it.
 */
export function migrateInMemory(entry) {
  const version = entry && entry.schema;
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new StoreError(
      `entry has missing or non-integer "schema" field (got ${JSON.stringify(version)})`,
      'EBADSCHEMA'
    );
  }
  let v = version;
  let migrated = entry;
  while (v < CURRENT_SCHEMA) {
    const step = MIGRATIONS[v + 1];
    if (!step) {
      throw new StoreError(
        `no migration registered to bring schema ${v} forward to ${v + 1}`,
        'ENOMIGRATION'
      );
    }
    migrated = step(migrated);
    v += 1;
  }
  return migrated;
}

// ---------------------------------------------------------------------------
// Raw file I/O — read side never writes; malformed JSON is refused, named,
// and the file is never touched.
// ---------------------------------------------------------------------------

/**
 * Read and JSON.parse a single entry file. Throws StoreError with a message
 * naming the file on malformed JSON or a missing file. Does NOT migrate and
 * does NOT write anything — pure read.
 */
export function readEntryRaw(filePath) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new StoreError(`No such entry file: ${filePath}`, 'ENOENT');
    }
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new StoreError(
      `Malformed JSON in ${filePath}: ${err.message}. Refusing to read or touch this file.`,
      'EMALFORMED'
    );
  }
}

/**
 * Read an entry by id: raw parse + in-memory migration. Never writes.
 */
export function readEntry(packDir, id) {
  assertValidId(id);
  const p = entryPath(packDir, id);
  const raw = readEntryRaw(p);
  return migrateInMemory(raw);
}

/**
 * Atomic write: write to a sibling temp file then rename over the target,
 * so a crash mid-write never leaves a corrupt/partial JSON file behind.
 */
function writeEntryFile(packDir, id, entry) {
  ensurePackDir(packDir);
  const target = entryPath(packDir, id);
  const tmp = path.join(
    packDir,
    `.${id}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`
  );
  const text = JSON.stringify(entry, null, 2) + '\n';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, target);
}

// ---------------------------------------------------------------------------
// Validator — small, hand-rolled, built for the JSON-Schema subset actually
// used by schema/entry.v1.json (type, const, enum, pattern, minLength,
// minItems, items, format:"date", required, properties, allOf/if/then).
// NOT a general JSON Schema engine. additionalProperties is intentionally
// never enforced here (schema says additionalProperties: true everywhere —
// unknown fields are tolerated on purpose, §A.6).
// ---------------------------------------------------------------------------

let _schemaCache = null;
function loadSchema() {
  if (_schemaCache) return _schemaCache;
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  _schemaCache = JSON.parse(raw);
  return _schemaCache;
}

function isValidDateString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function typeMatches(schemaType, value) {
  const types = Array.isArray(schemaType) ? schemaType : [schemaType];
  return types.some((t) => {
    switch (t) {
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'string':
        return typeof value === 'string';
      case 'integer':
        return Number.isInteger(value);
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'null':
        return value === null;
      default:
        return true;
    }
  });
}

/**
 * Validate `data` against a JSON-Schema-ish node. Pushes human-readable
 * strings into `errors`. `label` is a dotted path used in messages.
 */
function validateNode(schemaNode, data, errors, label) {
  if (!schemaNode || typeof schemaNode !== 'object') return;

  if (schemaNode.const !== undefined && data !== schemaNode.const) {
    errors.push(`${label}: expected constant ${JSON.stringify(schemaNode.const)}, got ${JSON.stringify(data)}`);
  }

  if (schemaNode.enum && !schemaNode.enum.includes(data)) {
    errors.push(`${label}: expected one of ${JSON.stringify(schemaNode.enum)}, got ${JSON.stringify(data)}`);
  }

  if (schemaNode.type && !typeMatches(schemaNode.type, data)) {
    errors.push(`${label}: expected type ${JSON.stringify(schemaNode.type)}, got ${JSON.stringify(data)}`);
  }

  if (schemaNode.anyOf) {
    const matches = schemaNode.anyOf.some((sub) => {
      const scratch = [];
      validateNode(sub, data, scratch, label);
      return scratch.length === 0;
    });
    if (!matches) {
      errors.push(`${label}: value ${JSON.stringify(data)} did not match any allowed shape`);
    }
  }

  if (typeof data === 'string') {
    if (schemaNode.pattern && !new RegExp(schemaNode.pattern).test(data)) {
      errors.push(`${label}: "${data}" does not match pattern ${schemaNode.pattern}`);
    }
    if (schemaNode.minLength !== undefined && data.length < schemaNode.minLength) {
      errors.push(`${label}: string shorter than minLength ${schemaNode.minLength}`);
    }
    if (schemaNode.format === 'date' && !isValidDateString(data)) {
      errors.push(`${label}: "${data}" is not a valid ISO date (YYYY-MM-DD)`);
    }
  }

  if (Array.isArray(data)) {
    if (schemaNode.minItems !== undefined && data.length < schemaNode.minItems) {
      errors.push(`${label}: array shorter than minItems ${schemaNode.minItems}`);
    }
    if (schemaNode.items) {
      data.forEach((item, i) => validateNode(schemaNode.items, item, errors, `${label}[${i}]`));
    }
  }

  if (schemaNode.required && data && typeof data === 'object' && !Array.isArray(data)) {
    for (const key of schemaNode.required) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        errors.push(`${label}: missing required field "${key}"`);
      }
    }
  }

  if (schemaNode.properties && data && typeof data === 'object' && !Array.isArray(data)) {
    for (const key of Object.keys(schemaNode.properties)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        validateNode(schemaNode.properties[key], data[key], errors, key);
      }
    }
  }

  if (schemaNode.allOf) {
    for (const sub of schemaNode.allOf) {
      if (sub.if) {
        const scratch = [];
        validateNode(sub.if, data, scratch, label);
        const matches = scratch.length === 0;
        if (matches && sub.then) {
          validateNode(sub.then, data, errors, label);
        } else if (!matches && sub.else) {
          validateNode(sub.else, data, errors, label);
        }
      } else {
        validateNode(sub, data, errors, label);
      }
    }
  }
}

/**
 * Validate a parsed (already-migrated) entry object against
 * schema/entry.v1.json. Tolerates unknown fields on purpose. Returns
 * { valid: boolean, errors: string[] }.
 */
export function validateEntry(entry) {
  const schema = loadSchema();
  const errors = [];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return { valid: false, errors: ['entry must be a JSON object'] };
  }
  validateNode(schema, entry, errors, 'entry');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Core CRUD
// ---------------------------------------------------------------------------

const CREATE_DEFAULTS = () => ({
  schema: 1,
  status: 'active',
  superseded_by: null,
  notes: null,
  dismissals: 0,
});

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Create a new entry. `data` is the caller-supplied fields (id/type/title
 * required, plus whatever pack-only/step-only fields the type demands).
 * Fields with schema-documented defaults (schema, status, superseded_by,
 * notes, dismissals) and the capture dates (added, verified) are filled in
 * automatically when the caller omits them. Refuses to create a duplicate
 * id (existing file is never overwritten). Refuses (without writing) if the
 * assembled entry fails schema validation.
 */
export function createEntry(packDir, data) {
  if (!data || typeof data !== 'object') {
    throw new StoreError('create requires an entry object', 'EINVALID');
  }
  if (!data.id || typeof data.id !== 'string') {
    throw new StoreError('create requires a string "id"', 'EINVALID');
  }
  const p = entryPath(packDir, data.id);
  if (fs.existsSync(p)) {
    throw new StoreError(`Entry already exists: ${data.id} (${p}). Refusing to overwrite.`, 'EEXISTS');
  }

  const today = todayDateString();
  const entry = {
    ...CREATE_DEFAULTS(),
    added: today,
    verified: today,
    ...data,
  };

  const { valid, errors } = validateEntry(entry);
  if (!valid) {
    throw new StoreError(`Refusing to create invalid entry "${data.id}":\n  ${errors.join('\n  ')}`, 'EVALIDATE');
  }

  writeEntryFile(packDir, entry.id, entry);
  return entry;
}

/**
 * List entries in a pack dir, optionally filtered by type/status. Reads
 * only — never writes. Malformed files are skipped with a warning rather
 * than aborting the whole listing (tolerant-reader spirit); the caller can
 * inspect `warnings` to see what was skipped.
 */
export function listEntries(packDir, filters = {}) {
  const entries = [];
  const warnings = [];
  let files = [];
  try {
    files = fs.readdirSync(packDir).filter((f) => f.endsWith('.json'));
  } catch (err) {
    if (err.code === 'ENOENT') return { entries, warnings };
    throw err;
  }
  for (const file of files) {
    const p = path.join(packDir, file);
    let entry;
    try {
      entry = migrateInMemory(readEntryRaw(p));
    } catch (err) {
      warnings.push(`${file}: ${err.message}`);
      continue;
    }
    if (filters.type && entry.type !== filters.type) continue;
    if (filters.status && entry.status !== filters.status) continue;
    entries.push(entry);
  }
  entries.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { entries, warnings };
}

/**
 * Merge a patch onto an existing entry (read-modify-write). Unknown fields
 * already on disk are preserved untouched because we spread the parsed
 * object and lay the patch on top — we never construct a fresh object from
 * a fixed field list. Refuses (without writing) if the merged result fails
 * validation.
 */
export function updateEntry(packDir, id, patch) {
  assertValidId(id);
  const p = entryPath(packDir, id);
  const current = migrateInMemory(readEntryRaw(p)); // throws clearly on malformed/missing
  const merged = { ...current, ...patch };

  const { valid, errors } = validateEntry(merged);
  if (!valid) {
    throw new StoreError(`Refusing to write invalid update to "${id}":\n  ${errors.join('\n  ')}`, 'EVALIDATE');
  }

  writeEntryFile(packDir, id, merged);
  return merged;
}

/**
 * Archive an entry: status -> "archived", optionally recording
 * superseded_by. All other fields (history: added, verified, dismissals,
 * notes, ...) are preserved untouched.
 */
export function archiveEntry(packDir, id, { supersededBy = undefined } = {}) {
  const patch = { status: 'archived' };
  if (supersededBy !== undefined) patch.superseded_by = supersededBy;
  return updateEntry(packDir, id, patch);
}

/**
 * Reactivate an archived entry: status -> "active". superseded_by resets to
 * null (schema.entry.v1.json: superseded_by is "null when there is no
 * successor, including on active entries" — an active entry cannot still
 * point at a successor). All other history fields are preserved untouched.
 */
export function reactivateEntry(packDir, id) {
  return updateEntry(packDir, id, { status: 'active', superseded_by: null });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const flags = { set: [] };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--json') flags.json = true;
    else if (arg === '--all') flags.all = true;
    else if (arg === '--pack') flags.pack = rest[++i];
    else if (arg === '--type') flags.type = rest[++i];
    else if (arg === '--status') flags.status = rest[++i];
    else if (arg === '--superseded-by') flags.supersededBy = rest[++i];
    else if (arg === '--set') flags.set.push(rest[++i]);
    else if (arg === '--file') flags.file = rest[++i];
    else positional.push(arg);
  }
  return { command, positional, flags };
}

function coerceSetValue(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // plain string
  }
}

function applySetFlags(base, setFlags) {
  const out = { ...base };
  for (const kv of setFlags) {
    const idx = kv.indexOf('=');
    if (idx === -1) {
      throw new StoreError(`--set expects key=value, got "${kv}"`, 'EINVALID');
    }
    const key = kv.slice(0, idx);
    const value = kv.slice(idx + 1);
    out[key] = coerceSetValue(value);
  }
  return out;
}

function readStdinIfPiped() {
  if (process.stdin.isTTY) return null;
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return null;
  }
}

function printTable(entries) {
  if (entries.length === 0) {
    console.log('(no entries)');
    return;
  }
  const cols = ['id', 'type', 'status', 'title'];
  const widths = cols.map((c) =>
    Math.max(c.length, ...entries.map((e) => String(e[c] ?? '').length))
  );
  const fmt = (row) => cols.map((c, i) => String(row[c] ?? '').padEnd(widths[i])).join('  ');
  console.log(fmt(Object.fromEntries(cols.map((c) => [c, c]))));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const e of entries) console.log(fmt(e));
}

function fail(message, code = 1) {
  console.error(`scout-store: ${message}`);
  process.exit(code);
}

function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));
  const packDir = resolvePackDir(flags);

  try {
    switch (command) {
      case 'create': {
        let base = {};
        const stdinText = flags.file ? fs.readFileSync(flags.file, 'utf8') : readStdinIfPiped();
        if (stdinText) {
          try {
            base = JSON.parse(stdinText);
          } catch (err) {
            fail(`malformed JSON on stdin/--file: ${err.message}`);
            return;
          }
        }
        const data = applySetFlags(base, flags.set);
        const entry = createEntry(packDir, data);
        console.log(`created ${entry.id} -> ${entryPath(packDir, entry.id)}`);
        break;
      }

      case 'read': {
        const [id] = positional;
        if (!id) return fail('read requires <id>');
        const entry = readEntry(packDir, id);
        console.log(JSON.stringify(entry, null, 2));
        break;
      }

      case 'list': {
        const { entries, warnings } = listEntries(packDir, { type: flags.type, status: flags.status });
        for (const w of warnings) console.error(`scout-store: warning: skipped ${w}`);
        if (flags.json) console.log(JSON.stringify(entries, null, 2));
        else printTable(entries);
        break;
      }

      case 'update': {
        const [id] = positional;
        if (!id) return fail('update requires <id>');
        let patch = {};
        const stdinText = flags.file ? fs.readFileSync(flags.file, 'utf8') : readStdinIfPiped();
        if (stdinText) {
          try {
            patch = JSON.parse(stdinText);
          } catch (err) {
            fail(`malformed JSON on stdin/--file: ${err.message}`);
            return;
          }
        }
        patch = applySetFlags(patch, flags.set);
        const entry = updateEntry(packDir, id, patch);
        console.log(`updated ${entry.id}`);
        break;
      }

      case 'validate': {
        if (flags.all || (!positional[0] && !flags.all)) {
          const { entries, warnings } = listEntries(packDir, {});
          let ok = true;
          for (const w of warnings) {
            console.error(`FAIL (unreadable): ${w}`);
            ok = false;
          }
          for (const entry of entries) {
            const { valid, errors } = validateEntry(entry);
            if (valid) {
              console.log(`OK    ${entry.id}`);
            } else {
              ok = false;
              console.log(`FAIL  ${entry.id}`);
              for (const e of errors) console.log(`        ${e}`);
            }
          }
          if (!ok) process.exit(1);
        } else {
          const id = positional[0];
          const entry = readEntry(packDir, id);
          const { valid, errors } = validateEntry(entry);
          if (valid) {
            console.log(`OK    ${id}`);
          } else {
            console.log(`FAIL  ${id}`);
            for (const e of errors) console.log(`        ${e}`);
            process.exit(1);
          }
        }
        break;
      }

      case 'archive': {
        const [id] = positional;
        if (!id) return fail('archive requires <id>');
        const entry = archiveEntry(packDir, id, { supersededBy: flags.supersededBy });
        console.log(`archived ${entry.id}${flags.supersededBy ? ` (superseded by ${flags.supersededBy})` : ''}`);
        break;
      }

      case 'reactivate': {
        const [id] = positional;
        if (!id) return fail('reactivate requires <id>');
        const entry = reactivateEntry(packDir, id);
        console.log(`reactivated ${entry.id}`);
        break;
      }

      default:
        console.error(
          [
            'usage: scout-store.mjs <command> [args] [--pack <dir>]',
            '',
            'commands:',
            '  create               (entry JSON via stdin/--file, or --set key=value)',
            '  read <id>            [--json]',
            '  list                 [--type pack|step] [--status active|archived] [--json]',
            '  update <id>          (patch via stdin/--file, or --set key=value)',
            '  validate [<id>|--all]',
            '  archive <id>         [--superseded-by <id2>]',
            '  reactivate <id>',
          ].join('\n')
        );
        process.exit(command ? 1 : 0);
    }
  } catch (err) {
    if (err instanceof StoreError) {
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
