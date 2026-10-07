# Progress

## 2026-09-23 — Session 1: pipeline proof

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
   Planck charge, Planck temperature.
5. **Domain-specific batches**: photometry, radiology (gray, sievert,
   becquerel — including the hertz/becquerel relationship), astronomy
   (parsec, light-year, Hubble constant), information theory (bit, byte,
   nat), nautical (nautical mile, knot).

Each future batch: ~10–20 units, run `validate.py` + `build_graph.py`
at the end, update this file.
