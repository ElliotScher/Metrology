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

1. **Logarithmic units**: neper, bel, decibel. They're the last of the SI
   Brochure's Table 8, but they're logarithms of ratios, not multiples of
   anything, so `factor` can't describe them and the analysis tab would get
   them wrong. They need their own field (and a decision on what their
   `derived_from` should be) first.
2. **CGS**: dyne, erg, gauss, oersted, maxwell, franklin/statcoulomb,
   biot/abampere, barye — including the franklin/biot ↔ speed-of-light
   story as a `data/relationships/` entry.
3. **More customary units**: nautical (nautical mile, knot, cable,
   Admiralty mile), the other barrels (US liquid, beer, dry), the US survey
   mile and acre, the perch as an area, the firkin, the hogshead, and other
   pre-1824 English gallons as history.
4. **Natural/Planck units**: Planck length, Planck mass, Planck time,
   Planck charge, Planck temperature. These are in `natural-planck`, so they
   may have an empty `derived_from`. Record which units their constants
   (*c*, *G*, *ħ*, *k*, *ε₀*) are stated in with `defined_via`.
   (`circular_via` was removed on 2026-10-16, so any loops go in the
   cursedness notes.)
5. **Domain-specific batches**: photometry, radiology (curie, rad, rem,
   röntgen — the units the becquerel, gray and sievert replaced), astronomy
   (parsec, light-year, Hubble constant), information theory (bit, byte,
   nat).

Each future batch: ~10–20 units. Run `validate.py` and `build_graph.py` at
the end, preview with `build_site.py`, update this file, then push to `main`
to deploy.

## 2026-10-16

No new units. Added a **Dimensional analysis** tab and removed circular
definitions from the graph.

**Dimensional analysis tab**
- Tabs in the header switch between Graph and Dimensional analysis. The tab
  lives at `#analysis`, and `#analysis?from=…&to=…` links straight to a
  conversion.
- Three columns: a **From** unit on the left, a **To** unit on the right, and
  the chain of steps between them in the middle. Each arrow is labelled with
  what it does: a prefix (`× 1000`, "k = 10³"), a substitution by a unit's
  `equation` ("definition of the joule", noting any units that cancel), or a
  fold back up into the target ("these combine into the volt").
- When the two units measure different things, the route includes one
  **extra quantity**, drawn in red: W → J goes `W = J/s`, then `× s`; J → N
  goes `J = N·m`, then `÷ m`. The route search expands both sides and picks
  the shortest chain. It prefers writing the extra quantity as a named unit
  (s, m, A), and falls back to base units (s²) when none fits.
- Below the chain: the conversion as one equation (`1 W × 1 s = 1 J`), a
  sentence saying what it means ("power × time = energy"), and what each unit
  measures, with its current definition and a link to it in the graph.
  Caveats are included: torque vs. energy, Hz vs. rad/s, rad and sr being
  dimensionless, and lm vs. cd.
- The multiplication is rendered as in the factor-label method. Each arrow's
  label is the conversion factor it multiplies by, as a stacked fraction
  (`10³ J / 1 kJ`, `N·m / J`). Under the chain, the whole product is written
  out, `1 kJ × (10³ J / 1 kJ) × (N·m / J) = 1000 N·m`, with every unit that
  cancels struck through, so only the target's units are left. Powers apply
  to whole fractions, as in `(1000 m / 1 km)²`, and partial cancellation
  (s² ÷ s) leaves the remainder unstruck.
- Leave To empty to break a unit down into SI base units. The To card then
  suggests named units of the same kind.
- Inputs accept `*`/`·`, `/`, `^n` or superscripts, parentheses, a leading
  number, SI prefixes (on the gram, not the kilogram) and full names like
  `kilojoules`. Unknown units get "did you mean" suggestions.
- °C ↔ K applies the 273.15 offset when both sides are plain temperatures.
  Inside compound units, °C is a temperature difference.
- The code is in `site/analysis.js`. `index.html` exposes its helpers and the
  `graph.json` promise on `window.Metrology`.

**Circular definitions removed**
- Searched for sources on the loops the graph drew (ampere ↔ coulomb,
  kilogram → newton → joule, candela ↔ lumen, and the second ↔ hertz loop
  added briefly today). No source discusses them. The closest is Mari,
  Goodwin, Jacobson & Pendrill (IEC TC 1), "A terminological analysis of the
  definitions of the base units in the revised SI" (*Measurement*, 2019; also
  the IEC report to the CCU, 2019). It argues that all seven 2019 definitions
  read circularly as worded, because each unit is defined by a constant
  stated in that unit. It also says the definitions are still sound.
- Removed `circular_via` from the data, the schema, `validate.py`,
  `build_graph.py` (DOT and JSON) and the site: the red loop edges, the
  "Circular definitions" button, the ring diagrams and the legend row. The
  intro no longer mentions red loops. The red colour tokens are renamed
  `--warn` and now only mark the extra-quantity step and errors.
- The wording quirk is now a sentence in the cursedness notes of the second,
  ampere, kilogram and candela, citing Mari et al. That paper is also added
  to their `sources`.
- The second got its 2019 constant-fixing definition as current; the 1967
  wording is now history (1967–2019). Levels are unchanged.

## 2026-10-16 (later)

15 new units, bringing the total to 41. The SI now has all 22 derived units
with special names, and every unit the SI Brochure accepts for use with the
SI except the three logarithmic ones.

**SI derived (3)**: becquerel (`1/s`), gray and sievert (both `J/kg`). Each
has its CGPM resolution, etymology and a note on the unit it replaced
(curie, rad, rem).

**SI-accepted (12)**, from the SI Brochure's Table 8:
- Time: minute (60 s), hour (60 min), day (24 h). Each is built from the one
  below it, so h → s goes through minutes.
- Angle: degree (π/180 rad), arcminute (1/60°), arcsecond (1/60′). Symbols
  `°`, `′`, `″`, plus `deg`, `arcmin` and `arcsec`.
- Hectare (10⁴ m²), litre (10⁻³ m³, symbols `L` and `l`), tonne (10³ kg).
- Dalton (`Da`, `u`), electronvolt and astronomical unit. The eV and the au
  are exact. The dalton's factor is the CODATA 2022 value, since it is still
  measured.

**Relationships**: `hertz-becquerel` (both s⁻¹, never interchanged) and
`gray-sievert` (both J/kg; the sievert is weighted for harm). The hertz's
cursedness note now points to the first instead of saying it's queued.

**New `factor` field.** Non-coherent units need a number as well as
components: the hour is `minute^1` with `factor: 60`. The schema allows it,
`validate.py` rejects it on SI base and derived units, and `build_graph.py`
exports it in `graph.json`.

**Dimensional analysis tab**
- Each step multiplies by the unit's factor, and the fraction shows it:
  `(60 s / 1 min)`, `(1 m³ / 1000 L)`, `(1 ′ / 60 ″)`. Checked against
  h → s, kW·h → MJ, 90° → rad, arcsec → rad, mL → cm³, ha → km², t → g,
  Da → kg, MeV → J, au → km, km/h → m/s, L/min and kat → mol/h.
- No SI prefixes on the minute, hour, day, degree, arcminute, arcsecond,
  hectare or astronomical unit (so `mh` is an error, not a millihour).
  Prefixes work on the litre, tonne, electronvolt and dalton (`mL`, `kt`,
  `MeV`, `kDa`).
- When the route needs an extra quantity, SI units are preferred over
  accepted ones on a tie.
- Added the "absorbed dose / specific energy" quantity (L²·T⁻²) with a
  caveat that Gy and Sv share it. The frequency caveat now mentions the Bq.
- New words: `liter(s)`, `hr`, `hrs`, `mins`, `degrees`, `tonnes`, `ev`.

Levels are unchanged: still 9, with the henry, tesla and lux on level 8.

## 2026-10-16 (evening)

76 imperial and US customary units, bringing the total to 117, plus lineage
highlighting on the graph.

**Units.** Every customary unit is built from another one, down to the SI
through a single exact link: the inch is 0.0254 m, the pound 0.453 592 37 kg,
the litre carries the imperial gallon, and so on. Most have their history and a
cursedness note.
- Length (16): thou, barleycorn, inch, hand, foot, yard, fathom, rod, chain,
  link, furlong, mile, league, the point and pica, and the US survey foot.
  It has definitions to 2022 and since its deprecation.
- Area (5): acre (1 furlong × 1 chain), rood (1 furlong × 1 rod), section,
  township and circular mil.
- US volume (18): gallon (231 in³) down through quart, pint, cup, gill, fluid
  ounce, tablespoon, teaspoon, fluid dram and minim. Also the oil barrel; the
  dry bushel (Winchester, 2150.42 in³), peck, quart and pint; the cord,
  acre-foot and board foot.
- Imperial volume (9): gallon (4.546 09 L, with its 1824 and 1963
  definitions), quart, pint, gill, fluid ounce, fluid drachm, minim, peck and
  bushel.
- Mass (16): the avoirdupois pound, grain, ounce, dram, stone and quarter;
  the long and short hundredweight and ton; the troy pennyweight, ounce and
  pound; the apothecaries' scruple and dram; and the slug.
- Force, energy, power, pressure (8): pound-force (lb × 9.806 65 m/s²),
  poundal, kip, psi, inch of mercury, Btu (IT), therm and horsepower.
- Temperature (2): degree Fahrenheit (offset from the Rankine, as °C is from
  the K) and Rankine (5/9 K).
- Also the fortnight and the foot-candle.

Checked with web searches: the imperial gallon's 1824/1963/1985 definitions,
the Winchester bushel (1696–97 statute, 1836 US recognition), the 1886
American printer's point (0.013 837 in), and the Horses Act 1540 for the hand.

**Relationships (5)**: `us-imperial-gallon`, `pound-pound-force` (with the Mars
Climate Orbiter), `tons` (long ton, tonne, short ton), `foot-survey-foot`,
`fahrenheit-celsius`.

**Graph: lineage highlighting.** Hovering over a unit (when none is selected)
or clicking one fades every unrelated unit and link. The units it's built
from, transitively, and the links between them turn cyan; the units built
from it turn magenta. The arrows get matching markers, and the legend has a
"Selected unit" key. The colours are new tokens `--lineage-up` and
`--lineage-down`, picked to stay clear of every system colour in both themes.
Search dimming is separate (`dimmed` vs `faded`), so the two combine.

**Dimensional analysis tab**
- Multi-word symbols work: `US gal`, `imp fl oz`, `oz t`, `ac-ft`, `bd ft`.
  Every symbol now displays as the unit's main symbol, so `l` shows as `L` and
  cancels against it.
- Ambiguous symbols ask which you mean, with buttons: `gal`, `qt`, `pt` (also
  the typographic point), `gi`, `fl oz`, `fl dr`, `dr`, `minim`, `bu`, `pk`,
  `cwt`, `ton`, and the words gallon, pint and quart.
- SI prefixes only go on SI and SI-accepted units, so `kft` is an error.
- Temperature readings convert between any of K, °C, °F and °R, stepping
  °F → °R → K and °C → K, and meeting at the first shared scale (°F → °R
  takes one step). Inside compound units, °F is a difference: J/°F = 1.8 J/K.
- New examples: 98.6 °F → °C, mi/h → m/s, imp gal → US gal.

**Other**
- `system` convention: units the UK and US have shared since the 1959
  international yard and pound (inch, foot, mile, pound, ounce…) are
  `imperial`. `us-customary` is only for units the US alone uses, or that
  differ there (US gallon, short ton, slug…).
- Site favicon (`site/favicon.svg`): a small four-node graph.
- `README.md` documents the `factor` field and its validation rule, the
  `system` convention above, and lineage highlighting.

Levels: 11 now (0–10), at most 23 units on a level.

