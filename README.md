# Metrology

The goal of this repo is to untangle every unit of measurement there is. It's
a growing knowledge base that records what each unit is, what it's built from,
how its definition has changed over time, and how it relates to the other
units.

## Why

Metrology is the science of measurement, and its current state is messier than
it looks. On paper the world has one system: the International System of Units
(SI), with seven base units. Since the 2019 redefinition, each of those is
defined by fixing the value of a physical constant. Even the kilogram is now
defined through the Planck constant, so it no longer depends on a metal
cylinder in a vault outside Paris. In practice, many other systems are still in
use alongside SI:

- **Imperial and US customary units** share names but not sizes. A US gallon
  and an imperial gallon are different volumes. The pound can mean a mass or a
  force, depending on the context. In 1999, NASA lost the Mars Climate Orbiter
  because one piece of software reported impulse in pound-force seconds and
  another read the values as newton-seconds.
- **CGS units** split into several incompatible variants (Gaussian,
  electrostatic, electromagnetic) and are still standard in parts of physics
  and astronomy.
- **SI-accepted non-SI units** such as the litre, the hour, the electronvolt
  and the astronomical unit sit officially alongside SI without being part of
  it.
- **Natural units** (Planck, atomic, and others) set chosen constants to 1,
  which hides dimensions that SI keeps explicit.
- **Domain-specific units** survive because no one field controls the others:
  nautical miles and knots, parsecs and light-years, grays and sieverts, bits
  and bytes.
- **Contested conventions** remain even inside SI. One example is whether the
  radian is dimensionless, which is why torque and energy share units.

Joseph Newton's YouTube series *Cursed Units* covers this mess in detail: why
feet, miles, furlongs and rods have the lengths they do, how the ale gallon and
the wine gallon split apart, and how two units with the same dimension can mean
completely different things. This repo has the same goal in structured form.
Each unit is one file that records its dimension, the units it's derived from,
every formal definition it has had (with sources), its etymology, and, where
deserved, its cursedness. Notes connecting several units, such as two scales
that are easy to confuse or a shared history, go in separate relationship
files.

## How it works

Each unit is a YAML file, and the units together form a directed acyclic graph
of derivations. A validation script checks the data, including the dimensional
arithmetic. A build step then turns it into a Graphviz diagram and a JSON graph
for interactive viewing. The project grows in batches; see
[`PROGRESS.md`](PROGRESS.md) for what's done and what's next.

## Requirements

- Python ≥ 3.11
- [uv](https://docs.astral.sh/uv/) (installs PyYAML and jsonschema from `uv.lock` on first run)
- [Graphviz](https://graphviz.org/) — the `dot` command must be on your `PATH` to render the SVG

## Usage

Run from the project root:

```bash
# Validate all data against the schemas and integrity checks
uv run scripts/validate.py

# Regenerate output/graph.dot, output/graph.svg, output/graph.json
uv run scripts/build_graph.py
```

Always validate before building, and before committing.

## Layout

```
data/
  units/            one YAML file per unit (filename stem == id)
  relationships/    notes linking two or more units
schema/
  unit.schema.json
  relationship.schema.json
scripts/
  validate.py       schema + integrity checks
  build_graph.py    generates everything in output/
output/             generated — never edit by hand
PROGRESS.md         log of completed batches and what's next
```

## Data format

### Units (`data/units/<id>.yaml`)

```yaml
id: newton
name: Newton
symbols: [N]
system: SI-derived
domain: mechanics
dimension: { length: 1, mass: 1, time: -2, current: 0, temperature: 0, amount: 0, luminous_intensity: 0 }
derived_from:
  - { id: kilogram, power: 1 }
  - { id: metre, power: 1 }
  - { id: second, power: -2 }
equation: "N = kg·m/s²"
definitions:
  - era: "1946–present"
    value: "The force which gives a mass of one kilogram an acceleration of one metre per second squared."
    basis: coherent-derived
    current: true
    source: "CIPM (1946), Resolution 2; BIPM SI Brochure, 9th ed. (2019)."
notes:
  etymology: "Named after Isaac Newton, in recognition of his work on classical mechanics."
  cursedness: null
status: verified          # draft | verified
sources: ["BIPM SI Brochure, 9th ed. (2019)"]
```

- **`system`** — one of `SI-base`, `SI-derived`, `SI-accepted`, `CGS`,
  `imperial`, `us-customary`, `natural-planck`, `domain-specific`.
- **`dimension`** — integer exponents over the seven SI base quantities.
- **`derived_from`** — the component units and their powers. These become the
  graph's edges. A component may repeat, as in the radian's `metre^1` and
  `metre^-1`, and the build merges repeats into one edge. Leave it empty only
  for units defined directly from physical constants.
- **`definitions`** — the unit's formal definitions in chronological order.
  Exactly one must have `current: true`.

### Relationships (`data/relationships/<id>.yaml`)

Relationships hold notes that connect several units and don't fit in any one
unit's file. For example, `kelvin-celsius` explains why the two scales have
the same degree size but different zero points.

```yaml
id: kelvin-celsius
units: [kelvin, celsius]
kind: historical-connection
note: |
  ...
source: "BIPM SI Brochure, 9th ed. (2019), sec. 2.3.4 and Annex."
```

`kind` is one of `dimensional-coincidence`, `historical-connection`,
`context-differentiated`, `commonly-confused`, `derivation-story`.

## Validation

`validate.py` goes beyond JSON Schema and checks:

- every file's `id` matches its filename
- every `derived_from` and relationship reference points to an existing unit
- SI base units have no `derived_from`, and every other unit has one. The only
  exceptions are units defined directly from physical constants (`SI-base`,
  `natural-planck`). Dimensionless ratios like the radian still list their
  components, for example `metre^1` and `metre^-1`
- each unit has exactly one current definition, and every definition has a source
- **dimensional arithmetic**: the sum of each component's dimension times its
  power equals the unit's stated `dimension`
- the `derived_from` graph contains no cycles

## Output

`build_graph.py` arranges units in **levels**. Level 0 holds the units with
no components, which are defined directly from physical constants. Every other
unit sits one level below the deepest unit it's built from. For example, the
watt is built from the joule (level 2) and the second (level 0), so it's on
level 3. Each unit is therefore as high as it can be while every unit it
depends on stays above it. The SVG and the web viewer use the same levels.

`build_graph.py` writes:

- `output/graph.dot` / `output/graph.svg`: a top-down Graphviz diagram, one row per level, with
  nodes colored by system. Solid edges are derivations, labeled with their
  power. Dashed edges are relationships.
- `output/graph.json`: a `{nodes, links}` graph, with each unit's `level`, for viewers
  such as the one in `site/`

## Web viewer

`site/index.html` is an interactive D3 viewer for `graph.json`. Click a unit
to see its equation, dimension, components, dependents and full definition
history.

Build and preview it locally:

```bash
uv run scripts/build_graph.py
uv run scripts/build_site.py                  # assembles _site/ (generated, git-ignored)
uv run python -m http.server -d _site 8000    # then open http://localhost:8000
```

On every push to `main`, `.github/workflows/pages.yml` rebuilds everything
from `data/` and deploys `_site/` to GitHub Pages. The page itself is never
committed, so it always matches the data. The build is pinned for
reproducibility:

- Python dependencies come from `uv.lock` (`uv sync --locked`).
- D3 is pinned to 7.9.0 and loaded with a subresource-integrity hash.
- The workflow fails, and nothing is deployed, if `validate.py` finds errors.

To enable it once, go to **Settings → Pages → Build and deployment** and set
**Source** to **GitHub Actions**.

## Adding units

1. Create `data/units/<id>.yaml`, plus any relationship files under
   `data/relationships/`.
2. Run `uv run scripts/validate.py` and fix any errors.
3. Run `uv run scripts/build_graph.py`.
4. Update `PROGRESS.md`.
