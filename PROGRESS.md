# Progress

## 2026-09-23

Seeded the initial 26 units to prove the full pipeline end-to-end
(data entry → validation → graph build → SVG/D3 output):

- **7 SI base units**: metre, kilogram, second, ampere, kelvin, mole,
  candela. metre, kilogram, second, ampere, kelvin, and mole all carry
  multi-era `definitions` covering their pre- and post-2019-redefinition
  history (candela has two eras too, from the 1946 blackbody-radiator
  definition to the 1979 monochromatic-radiation definition).
- **19 SI derived units**: newton, joule, watt, pascal, hertz, coulomb,
  volt, ohm, farad, henry, weber, tesla, siemens, lumen, lux, katal,
  radian, steradian, celsius.
- **1 relationship**: `kelvin-celsius` (same-sized degree, offset zero
  point, historically conflated).

Ran `validate.py` (clean) and `build_graph.py` (produced `graph.dot`,
`graph.svg`, `graph.json`). **Not committed to git** — left as an
uncommitted working tree per instruction; review and commit manually.

Published an interactive D3 force-directed viewer of `output/graph.json`
as a Claude Artifact: https://claude.ai/artifact/Gsb6bFDqSD6esTvftJ1tCW
(private; republish the same way after future `build_graph.py` runs to
keep it in sync — it fetches `graph.json` as a supporting file rather
than embedding data, so any future regeneration just needs a redeploy).
*(Superseded on 2026-10-08 by the GitHub Pages site below.)*

## 2026-10-08

No new units. This round restructured the graph, added a public site and
recorded how the SI base units actually depend on each other.

**Data model**
- **Every non-root unit now has dependencies.** The radian (`m¹·m⁻¹`) and
  steradian (`m²·m⁻²`) had empty `derived_from` and now derive from the
  metre. `validate.py` rejects an empty `derived_from` unless the unit is in
  `SI-base` or `natural-planck`. `build_graph.py` merges a repeated component
  into one edge.
- **New `defined_via` field.** It lists the units a defining constant is
  stated in: metre → second (*c*), ampere → second (*e*), kilogram → metre and
  second (*h*), kelvin → joule (*k*), candela → hertz, watt and steradian
  (K_cd). It counts toward levels but isn't checked for dimensions.
- **New `circular_via` field.** It marks definitions stated in a unit built
  from the unit being defined: ampere ↔ coulomb, kilogram → newton → joule,
  and candela ↔ lumen. `validate.py` checks that each recorded loop closes.
  These links are left out of the level and cycle calculations.
- **Candela:** added the 2019 definition (K_cd = 683 lm/W) as current. The
  1979 wording is now history, for 1979–2019.
- **Notes:** added `cursedness` for the ampere, metre, kelvin and candela,
  and extended it for the kilogram. Each note explains which units the "base"
  unit actually depends on. The mole's note was rewritten to cover the
  Avogadro constant (a quantity in mol⁻¹, compared with the Avogadro number)
  and to describe the mole's dimension as a matter of convention.

**Levels**
- A unit's level is one more than the deepest unit it depends on, counting
  both `derived_from` and `defined_via`. Only the second and the mole are
  level 0, since their constants are stated only in terms of themselves.
  There are 9 levels in all, with the henry, tesla and lux on level 8.
- The Graphviz SVG pins each level to its own labelled row.

**Site** (https://metrology.live, deployed by GitHub Actions)
- `site/index.html` plus `scripts/build_site.py`, which assembles `_site/`.
  `.github/workflows/pages.yml` validates the data, builds the graph and
  deploys on every push to `main`. D3 is pinned with an integrity hash, and
  Python dependencies come from `uv.lock`.
- The force layout was replaced with a fixed layered layout: barycenter
  ordering, then placement from the top down. It renders the same way on
  every load.
- An intro explains why the project exists and how to read the levels.
- Unit panels show the full definition history, "Derived from", "Defined
  via" and "Used by".
- Circular definitions are drawn as animated red loops. A "Circular
  definitions" button highlights them all, and each loop appears as a ring
  diagram in the panels of the units it includes.
- Custom domain: GoDaddy DNS uses the four GitHub Pages A records for `@`
  and a CNAME from `www` to `elliotscher.github.io`. Turn on Enforce HTTPS
  once GitHub issues the certificate.

**Docs:** added `README.md`, covering the project's purpose, the state of
the field, the data format, validation, levels, the site and the workflow.

## Next up (not started)

1. **SI-accepted non-SI units**: litre, hour, minute, day, tonne,
   electronvolt, astronomical unit, degree (of arc), hectare.
2. **CGS**: dyne, erg, gauss, oersted, maxwell, franklin/statcoulomb,
   biot/abampere, barye — including the franklin/biot ↔ speed-of-light
   story as a `data/relationships/` entry.
3. **Imperial / US customary**: foot, mile, gallon (imperial vs. US),
   pound-mass, pound-force, slug — with real `cursedness` notes tying
   back to the "Cursed Units" video series (feet/miles/furlongs/rods
   history, the ale-gallon/wine-gallon split, the Mars Climate Orbiter
   incident).
4. **Natural/Planck units**: Planck length, Planck mass, Planck time,
   Planck charge, Planck temperature. These are in `natural-planck`, so they
   may have an empty `derived_from`. Record which units their constants
   (*c*, *G*, *ħ*, *k*, *ε₀*) are stated in with `defined_via`, and add
   `circular_via` wherever those turn out to loop.
5. **Domain-specific batches**: photometry, radiology (gray, sievert,
   becquerel — including the hertz/becquerel relationship), astronomy
   (parsec, light-year, Hubble constant), information theory (bit, byte,
   nat), nautical (nautical mile, knot).

Each future batch: ~10–20 units. Run `validate.py` and `build_graph.py` at
the end, preview with `build_site.py`, update this file, then push to `main`
to deploy.
