# File-format patterns: schema evolution & managed blocks — researched 2026-07-18

Distilled from primary sources (Kubernetes api_changes, protobuf, Avro,
Hickey's Spec-ulation, conda/ansible/salt/expo/nvm implementations). These
are binding build rules for Scout's store and CLAUDE.md writer.

## A. Schema-versioned JSON store (one file per entry, read old forever)

1. Every file carries integer `schema` as its first field (already in PRD).
   Integers, not semver. Optionally pair with a `$schema` URL later.
2. **Accretion only**: new optional fields with defaults; never rename,
   remove, re-type, or change semantics of an existing field — including
   default-value semantics (K8s rule).
3. Every added field has a defined default so old files resolve
   deterministically (Avro's reader rule).
4. "Rename" = add the new field, read the old one forever (K8s dual-field).
5. Never reuse a retired field name; keep a `reserved` list in the schema
   doc (protobuf).
6. **Tolerant reader + unknown-field preservation**: ignore unrecognized
   keys on read but round-trip them untouched on write (proto3 behavior;
   K8s CRD pruning is the anti-pattern). Practically: retain an extras map,
   or patch files rather than serialize-from-struct.
7. **Migrate on read, lazily, in memory; upgrade on write only.** Opening a
   file never rewrites it (also PRD §5.1: updates never migrate user data).
8. Requirements may only be relaxed, never tightened (required→optional ok).
9. Reserve the version bump for true semantic breaks; when bumped, keep
   readers for all prior versions forever.
10. **Corpus tests**: frozen sample files for every schema version ever
    shipped; CI asserts current code reads them all.

## B. Idempotent managed block in CLAUDE.md / AGENTS.md

Survey: conda init (regex rewrite between `>>>`/`<<<` markers; silently
clobbers user edits; duplicate-append corruption when end marker deleted),
ansible blockinfile (marker template, `state: absent` removal, no-op when
identical), salt blockreplace (**fails by default on missing markers** — the
only one that refuses instead of duplicating), expo mergeContents
(`@generated begin <tag> … sync-<sha1>` checksummed sentinel — but the check
is a literal TODO), nvm (bare substring grep, append-only — cannot ever
update; the anti-pattern).

Scout's spec (better than the field):

1. Markers:
   `<!-- >>> scout:begin v1 (managed by scout — edits inside will be overwritten) -->`
   … `<!-- <<< scout:end -->`, with `sync-<hash>` of the generated body in
   the begin marker.
2. Rewrite the whole body wholesale each run; byte-compare first so
   unchanged runs are no-ops.
3. **Actually verify the hash** (do expo's TODO): if current body hash ≠
   recorded hash, the user edited inside — warn and show a diff before
   replacing, never silently clobber.
4. Corruption defense (where conda fails): begin-without-end,
   end-without-begin, or multiple begins → refuse with a clear message,
   salt-style; never append a duplicate.
5. Placement: append at EOF on first insert; preserve everything outside the
   markers byte-for-byte including trailing-newline state.
6. Clean removal path: delete block including markers (uninstall / `start`
   overlay opt-out).
7. Never use the nvm pattern (substring grep, append-only).
