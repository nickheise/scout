# Reserved field names — Scout entry schema

Protobuf-style field registry (docs/research/file-format-patterns.md §A.5):
every field name ever used in the Scout entry format is listed here, forever,
whether it's in the current schema or not. **A retired name is never reused
for a different meaning — not in schema 1, not in schema 2, not ever.** If a
field's purpose changes, it gets a new name and the old one moves to the
Retired section below with a pointer to its replacement.

This registry is append-only. Do not edit the "meaning" of an already-listed
field to describe new semantics — add a new field instead (accretion-only
evolution, file-format-patterns.md §A.2).

## Active fields (schema 1)

### Shared core (present on every entry)

| Field | Meaning |
|---|---|
| `schema` | Schema version integer. `1` in this version. Not semver; bumped only for true semantic breaks, and readers for every prior version are kept forever (§A.9). |
| `id` | Stable slug identifying the entry. Assigned once at creation, never changed. |
| `type` | Discriminator: `"pack"` or `"step"`. Determines which pack-only/step-only fields apply. |
| `title` | Display name. |
| `status` | Lifecycle state: `"active"` or `"archived"`. |
| `superseded_by` | id of the successor entry when archived in favor of something else; `null` otherwise. |
| `notes` | User's own free-text notes: why saved, caveats, overlap distinctions. |
| `added` | ISO date the entry was first captured. |
| `verified` | ISO date of the last verification of the source (lazy verification). |
| `dismissals` | Count of times a report for this entry was ignored in a similar context. |

### Pack-only fields (required when `type: "pack"`; null/absent when `type: "step"`)

| Field | Meaning |
|---|---|
| `url` | Source URL. |
| `repo` | Repository URL, when distinct from `url`. Optional even on pack entries. |
| `stack` | Recorded stack/ecosystem tags (e.g. `["react"]`). Informational only — never a hard filter. |
| `install` | Install string, e.g. `"npm i dialkit"`. |
| `summary` | 2-3 sentence summary of what the entry is and what it's good at. |
| `surfaces_when` | Machine-side match conditions generated at ingest; what the surfacing gate matches project work against. |
| `ambient_line` | The one-liner that earns this entry a slot in the compiled manifest. |

### Step-only fields (required when `type: "step"`; null/absent when `type: "pack"`)

| Field | Meaning |
|---|---|
| `instruction` | Imperative practice text. |
| `phase` | When the step executes: `"init"` \| `"ongoing"` \| `"milestone"` \| `"wrap"`. |
| `automation` | Script/skill path if the step is automated. Optional even on step entries. |
| `produces` | Artifact created/maintained by the step, e.g. `"CHANGELOG.md"`. Optional even on step entries. |

## Retired fields

*(none yet — this section exists so the never-reuse rule has a place to
land. When a field is retired, move its row here with the schema version it
was retired in, its original meaning, and (if applicable) the name of the
field that replaced it. Its exact name must never be assigned a new meaning
in any future schema version, even a much later one.)*

| Field | Retired in | Original meaning | Replaced by |
|---|---|---|---|
| — | — | — | — |

## The never-reuse rule

Once a field name has appeared in a shipped version of this schema, that
name is permanently attached to the meaning documented here (or in the
Retired table), even after the field itself is no longer required or
written by current code. Reusing a retired name for a different meaning
would silently corrupt every old entry file still carrying the original
semantics — the tolerant reader has no way to tell "old `foo`" from "new
`foo`" apart, since schema 1 entries are read forever (§A.7, §A.9). If a
concept needs to change shape, it gets a brand-new field name, and the
schema-writer is expected to add its row to the Active table above in the
same change.
