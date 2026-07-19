// Ingestion acceptance harness — automatable half (task 1.6).
//
// This suite checks the *shape* of fixtures/seed-pack/: schema validity,
// id hygiene, and the pack/step field rules from PRD §6. It does NOT judge
// prompt quality (wording, summary fidelity, overlap-note accuracy) — that
// is inherently a live, human-in-the-loop check and is covered by the
// documented golden-draft procedure in test/ingestion-acceptance.md.
//
// Reuses the same validateEntry() the store itself uses (bin/scout-store.mjs)
// rather than re-implementing JSON Schema validation, so this suite and the
// runtime tolerant reader can never silently drift apart.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateEntry } from '../bin/scout-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PACK_DIR = path.join(__dirname, '..', 'fixtures', 'seed-pack');

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VALID_PHASES = ['init', 'ongoing', 'milestone', 'wrap'];
const AMBIENT_LINE_MAX = 120;

// The two meta-repo seeds (PRD §6, plan §4 task 1.6): skills collections,
// not npm packages. Each must record that framing somewhere in its prose
// (summary/notes) so the distinction survives re-ingestion, not just the
// hand-authored fixture.
const META_REPO_IDS = ['emilkowalski-skills', 'mattpocock-skills'];
const SKILLS_COLLECTION_RE = /skills[\s-]+collection/i;

function loadSeedPack() {
  const files = fs
    .readdirSync(SEED_PACK_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(SEED_PACK_DIR, file), 'utf8');
    return { file, entry: JSON.parse(raw) };
  });
}

const seeds = loadSeedPack();

describe('seed pack — fixture presence', () => {
  test('fixtures/seed-pack/ is not empty', () => {
    assert.ok(seeds.length > 0, 'expected at least one seed fixture');
  });

  test('exactly nine seed entries (PRD §6: five pack, four step)', () => {
    assert.equal(seeds.length, 9, `expected 9 seed fixtures, found ${seeds.length}`);
  });
});

describe('seed pack — schema validation', () => {
  for (const { file, entry } of seeds) {
    test(`${file} validates against schema/entry.v1.json`, () => {
      const { valid, errors } = validateEntry(entry);
      assert.ok(valid, `${file} failed validation:\n  ${errors.join('\n  ')}`);
    });
  }
});

describe('seed pack — id hygiene', () => {
  for (const { file, entry } of seeds) {
    test(`${file}: id "${entry.id}" is kebab-case`, () => {
      assert.match(
        entry.id,
        KEBAB_CASE,
        `id "${entry.id}" must be lowercase, digits, and single hyphens only (no leading/trailing/double hyphens)`
      );
    });

    test(`${file}: id matches its filename stem`, () => {
      const stem = file.replace(/\.json$/, '');
      assert.equal(entry.id, stem, `id "${entry.id}" should match filename "${stem}.json"`);
    });
  }

  test('all ids are unique', () => {
    const ids = seeds.map(({ entry }) => entry.id);
    const seen = new Set();
    const dupes = new Set();
    for (const id of ids) {
      if (seen.has(id)) dupes.add(id);
      seen.add(id);
    }
    assert.equal(dupes.size, 0, `duplicate ids: ${[...dupes].join(', ')}`);
  });
});

describe('seed pack — pack-entry field rules', () => {
  const packSeeds = seeds.filter(({ entry }) => entry.type === 'pack');

  test('at least one pack entry exists to test', () => {
    assert.ok(packSeeds.length > 0);
  });

  for (const { file, entry } of packSeeds) {
    test(`${file}: surfaces_when is a non-empty array`, () => {
      assert.ok(Array.isArray(entry.surfaces_when), `${file}: surfaces_when must be an array`);
      assert.ok(entry.surfaces_when.length > 0, `${file}: surfaces_when must not be empty`);
      for (const [i, condition] of entry.surfaces_when.entries()) {
        assert.equal(typeof condition, 'string', `${file}: surfaces_when[${i}] must be a string`);
        assert.ok(condition.trim().length > 0, `${file}: surfaces_when[${i}] must not be blank`);
      }
    });

    test(`${file}: ambient_line is non-empty and <= ${AMBIENT_LINE_MAX} chars`, () => {
      assert.equal(typeof entry.ambient_line, 'string', `${file}: ambient_line must be a string`);
      assert.ok(entry.ambient_line.trim().length > 0, `${file}: ambient_line must not be blank`);
      assert.ok(
        entry.ambient_line.length <= AMBIENT_LINE_MAX,
        `${file}: ambient_line is ${entry.ambient_line.length} chars, over the ${AMBIENT_LINE_MAX}-char cap`
      );
    });

    test(`${file}: step-only fields are absent/null on a pack entry`, () => {
      for (const field of ['instruction', 'phase', 'automation', 'produces']) {
        assert.equal(
          entry[field] ?? null,
          null,
          `${file}: pack entry must not set step-only field "${field}"`
        );
      }
    });
  }
});

describe('seed pack — step-entry field rules', () => {
  const stepSeeds = seeds.filter(({ entry }) => entry.type === 'step');

  test('at least one step entry exists to test', () => {
    assert.ok(stepSeeds.length > 0);
  });

  for (const { file, entry } of stepSeeds) {
    test(`${file}: phase is one of ${VALID_PHASES.join('|')}`, () => {
      assert.ok(
        VALID_PHASES.includes(entry.phase),
        `${file}: phase "${entry.phase}" is not one of ${VALID_PHASES.join(', ')}`
      );
    });

    test(`${file}: instruction is a non-empty string`, () => {
      assert.equal(typeof entry.instruction, 'string', `${file}: instruction must be a string`);
      assert.ok(entry.instruction.trim().length > 0, `${file}: instruction must not be blank`);
    });

    test(`${file}: pack-only fields are absent/null on a step entry`, () => {
      for (const field of ['url', 'repo', 'stack', 'install', 'summary', 'surfaces_when', 'ambient_line']) {
        assert.equal(
          entry[field] ?? null,
          null,
          `${file}: step entry must not set pack-only field "${field}"`
        );
      }
    });
  }
});

describe('seed pack — meta-repo surface (skills collections, not npm packages)', () => {
  for (const id of META_REPO_IDS) {
    test(`${id} is present among the seeds`, () => {
      const found = seeds.find(({ entry }) => entry.id === id);
      assert.ok(found, `expected a seed fixture with id "${id}"`);
    });
  }

  const found = seeds.filter(({ entry }) => META_REPO_IDS.includes(entry.id));

  for (const { file, entry } of found) {
    test(`${file}: records a skills-collection surface`, () => {
      const prose = [entry.summary, entry.notes].filter(Boolean).join(' \n ');
      assert.match(
        prose,
        SKILLS_COLLECTION_RE,
        `${file}: expected summary/notes to name this as a skills collection (not an npm package)`
      );
    });

    test(`${file}: is typed "pack" (an analyzed link, not a step)`, () => {
      assert.equal(entry.type, 'pack');
    });
  }
});
