import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  StoreError,
  createEntry,
  readEntry,
  readEntryRaw,
  listEntries,
  updateEntry,
  validateEntry,
  archiveEntry,
  reactivateEntry,
  entryPath,
  resolvePackDir,
  defaultPackDir,
} from '../bin/scout-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = path.join(__dirname, '..', 'schema', 'corpus', 'v1');

let packDir;

beforeEach(() => {
  packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-store-test-'));
});

afterEach(() => {
  fs.rmSync(packDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Pack dir resolution
// ---------------------------------------------------------------------------

describe('resolvePackDir', () => {
  test('defaults to ~/.scout/pack', () => {
    const old = process.env.SCOUT_PACK;
    delete process.env.SCOUT_PACK;
    try {
      assert.equal(resolvePackDir({}), defaultPackDir());
      assert.ok(resolvePackDir({}).endsWith(path.join('.scout', 'pack')));
    } finally {
      if (old !== undefined) process.env.SCOUT_PACK = old;
    }
  });

  test('--pack flag wins over env', () => {
    const old = process.env.SCOUT_PACK;
    process.env.SCOUT_PACK = '/from/env';
    try {
      assert.equal(resolvePackDir({ pack: '/from/flag' }), path.resolve('/from/flag'));
    } finally {
      if (old === undefined) delete process.env.SCOUT_PACK;
      else process.env.SCOUT_PACK = old;
    }
  });

  test('SCOUT_PACK env var used when no --pack flag', () => {
    const old = process.env.SCOUT_PACK;
    process.env.SCOUT_PACK = '/from/env';
    try {
      assert.equal(resolvePackDir({}), path.resolve('/from/env'));
    } finally {
      if (old === undefined) delete process.env.SCOUT_PACK;
      else process.env.SCOUT_PACK = old;
    }
  });
});

// ---------------------------------------------------------------------------
// Corpus: every frozen v1 fixture must load and validate
// ---------------------------------------------------------------------------

describe('schema/corpus/v1', () => {
  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith('.json'));
  assert.ok(files.length > 0, 'corpus directory must not be empty');

  for (const file of files) {
    test(`${file} loads and validates`, () => {
      const raw = fs.readFileSync(path.join(CORPUS_DIR, file), 'utf8');
      const entry = JSON.parse(raw);
      const { valid, errors } = validateEntry(entry);
      assert.ok(valid, `${file} should validate; errors: ${JSON.stringify(errors)}`);
    });
  }

  test('unknown-future-field-entry.json keeps its unrecognized fields and still validates', () => {
    const raw = fs.readFileSync(path.join(CORPUS_DIR, 'unknown-future-field-entry.json'), 'utf8');
    const entry = JSON.parse(raw);
    assert.ok('x_future' in entry);
    assert.ok('x_future_license_hint' in entry);
    const { valid } = validateEntry(entry);
    assert.ok(valid);
  });
});

// ---------------------------------------------------------------------------
// create: validation, duplicate refusal
// ---------------------------------------------------------------------------

describe('createEntry', () => {
  const stepData = {
    id: 'test-step',
    type: 'step',
    title: 'A test step',
    instruction: 'Do the thing.',
    phase: 'ongoing',
  };

  const packData = {
    id: 'test-pack',
    type: 'pack',
    title: 'A test pack',
    url: 'https://example.com',
    install: 'npm i example',
    summary: 'An example package for testing.',
    surfaces_when: ['the project needs an example'],
    ambient_line: 'Example — does example things.',
  };

  test('creates a valid step entry and writes it to disk', () => {
    const entry = createEntry(packDir, stepData);
    assert.equal(entry.id, 'test-step');
    assert.equal(entry.schema, 1);
    assert.equal(entry.status, 'active');
    assert.equal(entry.dismissals, 0);
    assert.ok(fs.existsSync(entryPath(packDir, 'test-step')));
    const onDisk = JSON.parse(fs.readFileSync(entryPath(packDir, 'test-step'), 'utf8'));
    assert.equal(onDisk.id, 'test-step');
  });

  test('creates a valid pack entry', () => {
    const entry = createEntry(packDir, packData);
    assert.equal(entry.type, 'pack');
    const { valid } = validateEntry(entry);
    assert.ok(valid);
  });

  test('refuses duplicate id without overwriting', () => {
    createEntry(packDir, stepData);
    const before = fs.readFileSync(entryPath(packDir, 'test-step'), 'utf8');
    assert.throws(
      () => createEntry(packDir, { ...stepData, title: 'A different title' }),
      (err) => err instanceof StoreError && err.code === 'EEXISTS'
    );
    const after = fs.readFileSync(entryPath(packDir, 'test-step'), 'utf8');
    assert.equal(before, after, 'duplicate create attempt must not modify the existing file');
  });

  test('refuses (without writing) an entry that fails validation', () => {
    assert.throws(
      () => createEntry(packDir, { id: 'bad-entry', type: 'pack', title: 'Missing required pack fields' }),
      (err) => err instanceof StoreError && err.code === 'EVALIDATE'
    );
    assert.ok(!fs.existsSync(entryPath(packDir, 'bad-entry')));
  });

  test('rejects malformed id shape via schema pattern', () => {
    assert.throws(
      () => createEntry(packDir, { ...stepData, id: 'Not_A_Valid_Slug' }),
      (err) => err instanceof StoreError && err.code === 'EVALIDATE'
    );
  });
});

// ---------------------------------------------------------------------------
// read: never rewrites; malformed JSON refusal
// ---------------------------------------------------------------------------

describe('read path', () => {
  test('readEntry never rewrites the file it reads', () => {
    const entry = createEntry(packDir, {
      id: 'read-only-check',
      type: 'step',
      title: 'Check',
      instruction: 'x',
      phase: 'ongoing',
    });
    const p = entryPath(packDir, entry.id);
    const before = fs.readFileSync(p, 'utf8');
    const beforeMtime = fs.statSync(p).mtimeMs;
    readEntry(packDir, entry.id);
    readEntry(packDir, entry.id);
    const after = fs.readFileSync(p, 'utf8');
    assert.equal(before, after);
    assert.equal(fs.statSync(p).mtimeMs, beforeMtime);
  });

  test('refuses malformed JSON, naming the file, and never overwrites it', () => {
    const p = entryPath(packDir, 'broken');
    fs.writeFileSync(p, '{ "id": "broken", not valid json', 'utf8');
    const before = fs.readFileSync(p, 'utf8');
    assert.throws(
      () => readEntry(packDir, 'broken'),
      (err) => err instanceof StoreError && err.code === 'EMALFORMED' && err.message.includes(p)
    );
    const after = fs.readFileSync(p, 'utf8');
    assert.equal(before, after, 'malformed file must be left untouched');
  });

  test('missing entry raises a clear ENOENT-coded error', () => {
    assert.throws(
      () => readEntry(packDir, 'does-not-exist'),
      (err) => err instanceof StoreError && err.code === 'ENOENT'
    );
  });

  test('refuses path-traversal ids instead of escaping the pack dir', () => {
    // A sibling file "outside" the pack dir that a traversal id could reach.
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-store-outside-'));
    const outsideFile = path.join(outsideDir, 'secret.json');
    fs.writeFileSync(
      outsideFile,
      JSON.stringify({ schema: 1, id: 'secret', type: 'step', title: 't', instruction: 'x', phase: 'ongoing' }),
      'utf8'
    );
    const nestedPack = path.join(outsideDir, 'pack');
    fs.mkdirSync(nestedPack, { recursive: true });
    try {
      for (const badId of ['../secret', '../../secret', '/etc/passwd', 'a/../../secret']) {
        assert.throws(
          () => readEntry(nestedPack, badId),
          (err) => err instanceof StoreError,
          `readEntry should refuse id ${JSON.stringify(badId)}`
        );
      }
      // The outside file must be untouched and unread-through regardless.
      assert.ok(fs.existsSync(outsideFile));
    } finally {
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// update: unknown-field round-trip is the headline binding rule
// ---------------------------------------------------------------------------

describe('updateEntry — tolerant reader round-trip', () => {
  test('unknown fields survive an update untouched', () => {
    const p = entryPath(packDir, 'shadcn-ui');
    const original = JSON.parse(
      fs.readFileSync(path.join(CORPUS_DIR, 'unknown-future-field-entry.json'), 'utf8')
    );
    fs.mkdirSync(packDir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(original, null, 2) + '\n', 'utf8');

    const updated = updateEntry(packDir, 'shadcn-ui', { notes: 'updated notes' });

    assert.equal(updated.notes, 'updated notes');
    assert.equal(updated.x_future, original.x_future);
    assert.deepEqual(updated.x_future_license_hint, original.x_future_license_hint);

    const onDisk = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert.equal(onDisk.x_future, original.x_future);
    assert.deepEqual(onDisk.x_future_license_hint, original.x_future_license_hint);
    // every original key must still be present after the round trip
    for (const key of Object.keys(original)) {
      assert.ok(Object.prototype.hasOwnProperty.call(onDisk, key), `missing key after update: ${key}`);
    }
  });

  test('refuses to write an update that would make the entry invalid', () => {
    createEntry(packDir, {
      id: 'valid-step',
      type: 'step',
      title: 'Valid',
      instruction: 'x',
      phase: 'ongoing',
    });
    assert.throws(
      () => updateEntry(packDir, 'valid-step', { phase: 'not-a-real-phase' }),
      (err) => err instanceof StoreError && err.code === 'EVALIDATE'
    );
    const onDisk = readEntry(packDir, 'valid-step');
    assert.equal(onDisk.phase, 'ongoing', 'invalid update must not be persisted');
  });

  test('update on a malformed file refuses and names the file', () => {
    const p = entryPath(packDir, 'broken2');
    fs.mkdirSync(packDir, { recursive: true });
    fs.writeFileSync(p, '{not json', 'utf8');
    assert.throws(
      () => updateEntry(packDir, 'broken2', { title: 'x' }),
      (err) => err instanceof StoreError && err.code === 'EMALFORMED'
    );
  });

  test('refuses path-traversal ids instead of writing outside the pack dir', () => {
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-store-outside-'));
    const outsideFile = path.join(outsideDir, 'victim.json');
    const originalContents = JSON.stringify({
      schema: 1,
      id: 'victim',
      type: 'step',
      title: 'Victim',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-01',
      verified: '2026-07-01',
      dismissals: 0,
      instruction: 'do it',
      phase: 'ongoing',
    });
    fs.writeFileSync(outsideFile, originalContents, 'utf8');
    const nestedPack = path.join(outsideDir, 'nested', 'pack');
    fs.mkdirSync(nestedPack, { recursive: true });
    try {
      for (const badId of ['../victim', '../../victim', '/etc/passwd']) {
        assert.throws(
          () => updateEntry(nestedPack, badId, { title: 'PWNED-OUTSIDE-PACK' }),
          (err) => err instanceof StoreError,
          `updateEntry should refuse id ${JSON.stringify(badId)}`
        );
      }
      // The file outside the pack dir must be byte-identical — no escaped write.
      assert.equal(fs.readFileSync(outsideFile, 'utf8'), originalContents);
    } finally {
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  test('archive/reactivate also refuse path-traversal ids (both delegate to updateEntry)', () => {
    assert.throws(
      () => archiveEntry(packDir, '../escape'),
      (err) => err instanceof StoreError
    );
    assert.throws(
      () => reactivateEntry(packDir, '../../escape'),
      (err) => err instanceof StoreError
    );
  });
});

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe('listEntries', () => {
  test('filters by type and status', () => {
    createEntry(packDir, {
      id: 'step-one',
      type: 'step',
      title: 'Step One',
      instruction: 'x',
      phase: 'ongoing',
    });
    createEntry(packDir, {
      id: 'pack-one',
      type: 'pack',
      title: 'Pack One',
      url: 'https://example.com',
      install: 'npm i one',
      summary: 'summary',
      surfaces_when: ['x'],
      ambient_line: 'one',
    });
    updateEntry(packDir, 'pack-one', { status: 'archived' });

    const all = listEntries(packDir, {});
    assert.equal(all.entries.length, 2);

    const steps = listEntries(packDir, { type: 'step' });
    assert.equal(steps.entries.length, 1);
    assert.equal(steps.entries[0].id, 'step-one');

    const archived = listEntries(packDir, { status: 'archived' });
    assert.equal(archived.entries.length, 1);
    assert.equal(archived.entries[0].id, 'pack-one');
  });

  test('returns empty list (not an error) for a nonexistent pack dir', () => {
    const nonexistent = path.join(packDir, 'does-not-exist-yet');
    const { entries, warnings } = listEntries(nonexistent, {});
    assert.deepEqual(entries, []);
    assert.deepEqual(warnings, []);
  });

  test('skips malformed files with a warning instead of throwing', () => {
    createEntry(packDir, {
      id: 'good-one',
      type: 'step',
      title: 'Good',
      instruction: 'x',
      phase: 'ongoing',
    });
    fs.writeFileSync(entryPath(packDir, 'zz-broken'), 'not json at all', 'utf8');
    const { entries, warnings } = listEntries(packDir, {});
    assert.equal(entries.length, 1);
    assert.equal(entries[0].id, 'good-one');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /zz-broken\.json/);
  });
});

// ---------------------------------------------------------------------------
// archive / reactivate: history preservation
// ---------------------------------------------------------------------------

describe('archive / reactivate', () => {
  test('archive flips status and sets superseded_by, preserving history fields', () => {
    const created = createEntry(packDir, {
      id: 'old-lib',
      type: 'pack',
      title: 'Old Lib',
      url: 'https://example.com/old',
      install: 'npm i old-lib',
      summary: 'summary',
      surfaces_when: ['x'],
      ambient_line: 'old',
      notes: 'kept for history',
      dismissals: 2,
    });

    const archived = archiveEntry(packDir, 'old-lib', { supersededBy: 'new-lib' });

    assert.equal(archived.status, 'archived');
    assert.equal(archived.superseded_by, 'new-lib');
    // history fields untouched
    assert.equal(archived.added, created.added);
    assert.equal(archived.verified, created.verified);
    assert.equal(archived.dismissals, created.dismissals);
    assert.equal(archived.notes, created.notes);
    assert.equal(archived.id, created.id);
    assert.equal(archived.title, created.title);
    assert.equal(archived.summary, created.summary);
  });

  test('archive without --superseded-by leaves superseded_by untouched', () => {
    createEntry(packDir, {
      id: 'lone-lib',
      type: 'pack',
      title: 'Lone Lib',
      url: 'https://example.com',
      install: 'npm i lone-lib',
      summary: 's',
      surfaces_when: ['x'],
      ambient_line: 'lone',
    });
    const archived = archiveEntry(packDir, 'lone-lib', {});
    assert.equal(archived.status, 'archived');
    assert.equal(archived.superseded_by, null);
  });

  test('reactivate flips status back to active, clears superseded_by, preserves history', () => {
    createEntry(packDir, {
      id: 'comeback-lib',
      type: 'pack',
      title: 'Comeback Lib',
      url: 'https://example.com',
      install: 'npm i comeback-lib',
      summary: 's',
      surfaces_when: ['x'],
      ambient_line: 'comeback',
      dismissals: 5,
      notes: 'archived once, brought back',
    });
    archiveEntry(packDir, 'comeback-lib', { supersededBy: 'other-lib' });
    const reactivated = reactivateEntry(packDir, 'comeback-lib');

    assert.equal(reactivated.status, 'active');
    assert.equal(reactivated.superseded_by, null);
    assert.equal(reactivated.dismissals, 5, 'dismissal history must survive archive+reactivate');
    assert.equal(reactivated.notes, 'archived once, brought back');
  });

  test('archive/reactivate round trip validates at every step', () => {
    createEntry(packDir, {
      id: 'roundtrip-step',
      type: 'step',
      title: 'Roundtrip',
      instruction: 'x',
      phase: 'wrap',
    });
    const archived = archiveEntry(packDir, 'roundtrip-step');
    assert.ok(validateEntry(archived).valid);
    const reactivated = reactivateEntry(packDir, 'roundtrip-step');
    assert.ok(validateEntry(reactivated).valid);
  });
});

// ---------------------------------------------------------------------------
// validateEntry — direct unit coverage of the conditional pack/step rules
// ---------------------------------------------------------------------------

describe('validateEntry', () => {
  test('rejects a pack entry missing required pack-only fields', () => {
    const { valid, errors } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'pack',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
    });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('ambient_line')));
  });

  test('rejects a step entry that leaks a pack-only field', () => {
    const { valid, errors } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'step',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      instruction: 'do it',
      phase: 'ongoing',
      ambient_line: 'should not be here',
    });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('ambient_line')));
  });

  test('rejects bad id pattern, bad status enum, and bad date format', () => {
    const base = {
      schema: 1,
      id: 'ok-id',
      type: 'step',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      instruction: 'do it',
      phase: 'ongoing',
    };
    assert.equal(validateEntry({ ...base, id: 'BadId' }).valid, false);
    assert.equal(validateEntry({ ...base, status: 'deleted' }).valid, false);
    assert.equal(validateEntry({ ...base, added: '2026-13-40' }).valid, false);
  });

  test('rejects a step entry with a null instruction (own-type field must be non-null)', () => {
    const { valid, errors } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'step',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      instruction: null,
      phase: 'ongoing',
    });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('instruction')));
  });

  test('rejects a step entry with a null phase (own-type field must be non-null)', () => {
    const { valid, errors } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'step',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      instruction: 'do it',
      phase: null,
    });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('phase')));
  });

  test('rejects a pack entry with a null surfaces_when (own-type field must be non-null)', () => {
    const { valid, errors } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'pack',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      url: 'https://example.com',
      install: 'npm i x',
      summary: 'a summary',
      surfaces_when: null,
      ambient_line: 'X — does things.',
    });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('surfaces_when')));
  });

  test('rejects a pack entry with a null ambient_line (own-type field must be non-null)', () => {
    const { valid, errors } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'pack',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      url: 'https://example.com',
      install: 'npm i x',
      summary: 'a summary',
      surfaces_when: ['x'],
      ambient_line: null,
    });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('ambient_line')));
  });

  test('degenerate step (instruction AND phase both null) is invalid', () => {
    const { valid } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'step',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      instruction: null,
      phase: null,
    });
    assert.equal(valid, false);
  });

  test('degenerate pack (url/install/summary/surfaces_when/ambient_line all null) is invalid', () => {
    const { valid } = validateEntry({
      schema: 1,
      id: 'x',
      type: 'pack',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      url: null,
      repo: null,
      stack: null,
      install: null,
      summary: null,
      surfaces_when: null,
      ambient_line: null,
    });
    assert.equal(valid, false);
  });

  test('tolerates unknown fields (additionalProperties)', () => {
    const { valid } = validateEntry({
      schema: 1,
      id: 'ok-id',
      type: 'step',
      title: 'X',
      status: 'active',
      superseded_by: null,
      notes: null,
      added: '2026-07-17',
      verified: '2026-07-17',
      dismissals: 0,
      instruction: 'do it',
      phase: 'ongoing',
      some_field_from_the_future: { nested: true },
    });
    assert.equal(valid, true);
  });
});

// ---------------------------------------------------------------------------
// migrate-on-read scaffold
// ---------------------------------------------------------------------------

describe('readEntryRaw + migration', () => {
  test('readEntryRaw does not migrate (returns exactly what is on disk)', () => {
    const p = entryPath(packDir, 'raw-check');
    fs.mkdirSync(packDir, { recursive: true });
    const onDisk = { schema: 1, id: 'raw-check', type: 'step', title: 't' };
    fs.writeFileSync(p, JSON.stringify(onDisk), 'utf8');
    const raw = readEntryRaw(p);
    assert.deepEqual(raw, onDisk);
  });
});
