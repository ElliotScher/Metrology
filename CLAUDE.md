# Metrology

An ongoing, never-finished project to document every unit of measurement
that exists — starting from SI base units and working outward to derived
and domain-specific units — as a directed acyclic graph (DAG) of
definitions, history, and relationships.

## Structure

- `data/units/<id>.yaml` — one file per unit. The only hand-edited content
  for units.
- `data/relationships/<id>.yaml` — cross-unit notes that don't belong to
  any single unit (e.g. hertz vs. becquerel, the CGS electrostatic/
  electromagnetic split). See `schema/relationship.schema.json`.
- `schema/*.schema.json` — JSON Schema for both file types.
- `scripts/validate.py` — schema conformance, referential integrity,
  dimensional-arithmetic, and cycle checks. Run before every commit.
- `scripts/build_graph.py` — regenerates `output/graph.dot`,
  `output/graph.svg`, and `output/graph.json` from `data/`. Never
  hand-edit anything in `output/`.
- `PROGRESS.md` — what's been covered and what's queued next. Read this
  first in any new session; this project has no other memory across
  sessions.

## Dev environment

```
cd ~/Documents/Development/Personal/Metrology
nix develop path:~/Documents/NixHub/dev/Personal/Metrology
python scripts/validate.py && python scripts/build_graph.py
```

## The graph is a DAG, not a tree

A derived unit can have multiple components (the newton is built from the
kilogram, the metre, *and* the second), so nodes can have multiple
parents — that rules out a tree. The invariant that matters is
**acyclicity**: `derived_from` edges run component → derived, and
`validate.py` rejects any cycle in that relation, since a cycle would mean
some unit is transitively derived from itself.

## How to add a unit

1. Create `data/units/<id>.yaml` (`id` = lowercase, hyphenated filename
   stem, must match the file's own `id` field).
2. Fill in `system`, `domain`, `dimension` (all 7 base-dimension keys),
   `derived_from` (list of `{id, power}` objects — empty only for genuine
   SI-base units), and `equation` (or `null` for a base unit).
3. Fill in `definitions` as a chronological list — **exactly one** entry
   needs `current: true`. Every entry needs its own `source`. Most units
   only have one entry; units that have been formally redefined (the
   metre, the kilogram, the second, the ampere, the kelvin, the mole...)
   should have one entry per era.
4. Fill in `notes` (`etymology`, and `cursedness` for anything
   historically weird — `null` otherwise), `status` (`draft` until
   confident it's accurate, then `verified`), and a top-level `sources`
   list for general references.
5. If this unit has an interesting relationship with another unit that
   doesn't belong inside either file, add
   `data/relationships/<a>-<b>.yaml` instead (or in addition).
6. Run `python scripts/validate.py`. Fix anything it flags.
7. Run `python scripts/build_graph.py` and spot-check `output/graph.svg`.
8. Update `PROGRESS.md` with what was added and what's still queued.

## Batch order (see `PROGRESS.md` for current status)

SI base (done) → core SI derived (done) → SI-accepted non-SI units
(litre, hour, eV) → CGS → imperial/US customary (with real `cursedness`
notes) → natural/Planck units → domain-specific batches (photometry,
radiology, astronomy, information theory, nautical), roughly 10–20 units
per batch.
