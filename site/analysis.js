// Dimensional analysis tab: takes a From unit and a To unit and shows the
// chain of substitutions between them, using the derivation links and
// equations in graph.json. When the two measure different things, the chain
// includes one extra quantity to multiply or divide by (W × s → J). Loaded
// after the main script in index.html, which provides window.Metrology.
(function () {
  "use strict";

  var M = window.Metrology;
  var esc = M.esc, superscript = M.superscript, formatDimension = M.formatDimension, DIM_ORDER = M.DIM_ORDER;

  var PREFIXES = [
    ["Q", "quetta", 30], ["R", "ronna", 27], ["Y", "yotta", 24], ["Z", "zetta", 21], ["E", "exa", 18],
    ["P", "peta", 15], ["T", "tera", 12], ["G", "giga", 9], ["M", "mega", 6], ["k", "kilo", 3],
    ["h", "hecto", 2], ["da", "deca", 1], ["d", "deci", -1], ["c", "centi", -2], ["m", "milli", -3],
    ["µ", "micro", -6], ["u", "micro", -6], ["n", "nano", -9], ["p", "pico", -12], ["f", "femto", -15],
    ["a", "atto", -18], ["z", "zepto", -21], ["y", "yocto", -24], ["r", "ronto", -27], ["q", "quecto", -30]
  ].map(function (p) { return { sym: p[0], name: p[1], exp: p[2] }; });

  // Display order for base units, following the usual "kg·m²·s⁻²" convention.
  var BASE_ORDER = ["kilogram", "metre", "second", "ampere", "kelvin", "mole", "candela"];

  // What a dimension means. Keys use the dimension letters L M T I Θ N J.
  var LETTERS = { L: "length", M: "mass", T: "time", I: "current", "Θ": "temperature", N: "amount", J: "luminous_intensity" };
  var QUANTITY_LIST = [
    [{}, "dimensionless", "A pure number: the ratio of two quantities of the same kind.",
      "Plane angle (rad) and solid angle (sr) live here: a radian is a metre of arc per metre of radius, so the metres cancel. Whether angles deserve a dimension of their own is still argued over."],
    [{ L: 1 }, "length", "How far apart two points are."],
    [{ M: 1 }, "mass", "How much matter something has, measured by its inertia."],
    [{ T: 1 }, "time", "How long something lasts.",
      "An RC circuit's time constant τ = R·C comes out in seconds: ohms times farads."],
    [{ I: 1 }, "electric current", "How much charge flows past a point per unit time."],
    [{ "Θ": 1 }, "thermodynamic temperature", "How hot something is, measured from absolute zero.",
      "Temperature differences share this dimension: a change of 1 °C equals a change of 1 K."],
    [{ N: 1 }, "amount of substance", "How many elementary entities (atoms, molecules, …) there are, counted in moles."],
    [{ J: 1 }, "luminous intensity", "How bright a light source appears to the human eye in a given direction.",
      "Luminous flux (lm = cd·sr) has the same dimension, because the steradian is dimensionless. Dimensional analysis can't tell them apart."],
    [{ L: 2 }, "area", "How much surface something covers."],
    [{ L: 3 }, "volume", "How much space something occupies."],
    [{ L: -1 }, "wavenumber", "How many cycles fit in a unit of length."],
    [{ T: -1 }, "frequency", "How many times something happens per unit time.",
      "Angular velocity (rad/s) and radioactive activity share this dimension. That's why the SI keeps Hz for cycles per second and doesn't let it stand in for rad/s."],
    [{ L: 1, T: -1 }, "velocity", "How fast position changes."],
    [{ L: 1, T: -2 }, "acceleration", "How fast velocity changes."],
    [{ L: 3, T: -1 }, "volumetric flow rate", "How much volume passes per unit time."],
    [{ L: 2, T: -1 }, "kinematic viscosity / diffusivity", "How fast momentum or particles spread out through a medium."],
    [{ M: 1, L: -3 }, "density", "How much mass is packed into a unit of volume."],
    [{ M: 1, T: -1 }, "mass flow rate", "How much mass passes per unit time."],
    [{ M: 1, L: 1, T: -1 }, "momentum", "Mass in motion: mass times velocity."],
    [{ M: 1, L: 1, T: -2 }, "force", "A push or pull: what changes an object's momentum."],
    [{ M: 1, L: 2, T: -2 }, "energy", "The capacity to do work: force applied through a distance.",
      "Torque (N·m) has exactly the same dimension, but it is a force times a lever arm, not energy. The SI asks you to write torque in N·m and keep J for energy."],
    [{ M: 1, L: 2, T: -3 }, "power", "How fast energy is transferred or converted."],
    [{ M: 1, L: 2, T: -1 }, "action / angular momentum", "Energy times time; the Planck constant h is stated in these units (J·s)."],
    [{ M: 1, L: -1, T: -2 }, "pressure", "Force spread over an area.",
      "Stress and energy density (J/m³) share this dimension."],
    [{ M: 1, T: -2 }, "surface tension / stiffness", "Force per unit length, or energy per unit area."],
    [{ M: 1, T: -3 }, "irradiance / heat flux density", "Power arriving per unit area."],
    [{ M: 1, L: -1, T: -1 }, "dynamic viscosity", "How strongly a fluid resists flowing."],
    [{ I: 1, T: 1 }, "electric charge", "A quantity of electricity: current flowing for a time."],
    [{ M: 1, L: 2, T: -3, I: -1 }, "voltage", "Electric potential difference: the energy each unit of charge gains or loses."],
    [{ M: 1, L: 1, T: -3, I: -1 }, "electric field strength", "Voltage per unit distance, or force per unit charge."],
    [{ M: 1, L: 2, T: -3, I: -2 }, "electrical resistance", "How strongly something opposes current: voltage per unit current."],
    [{ M: -1, L: -2, T: 3, I: 2 }, "electrical conductance", "How easily current flows: current per unit voltage, the reciprocal of resistance."],
    [{ M: -1, L: -2, T: 4, I: 2 }, "capacitance", "How much charge is stored per unit voltage."],
    [{ M: 1, L: 2, T: -2, I: -2 }, "inductance", "How much magnetic flux a current produces, which sets how strongly the circuit resists changes in current."],
    [{ M: 1, L: 2, T: -2, I: -1 }, "magnetic flux", "How much magnetic field passes through a surface."],
    [{ M: 1, T: -2, I: -1 }, "magnetic flux density", "Magnetic flux per unit area: the strength of a magnetic field."],
    [{ I: 1, L: -1 }, "magnetic field strength", "Current per unit length, as in the field inside a solenoid."],
    [{ I: 1, L: -2 }, "current density", "Current flowing through a unit of cross-sectional area."],
    [{ J: 1, L: -2 }, "illuminance", "Luminous flux landing on a unit of area: how well lit a surface is.",
      "Luminance (cd/m²) has the same dimension, since the steradian in lm = cd·sr is dimensionless."],
    [{ J: 1, M: -1, L: -2, T: 3 }, "luminous efficacy", "Luminous flux produced per watt. The candela is defined by fixing this at 683 lm/W for 540 THz light."],
    [{ N: 1, T: -1 }, "catalytic activity", "How fast a catalyst converts substance: moles per second."],
    [{ N: 1, L: -3 }, "concentration", "Amount of substance per unit volume."],
    [{ M: 1, N: -1 }, "molar mass", "Mass per mole."],
    [{ N: -1 }, "per amount", "Something counted per mole. The Avogadro constant has this dimension."],
    [{ M: 1, L: 2, T: -2, N: -1 }, "molar energy", "Energy per mole."],
    [{ M: 1, L: 2, T: -2, "Θ": -1 }, "heat capacity / entropy", "Energy per kelvin. The Boltzmann constant k, which defines the kelvin, has this dimension."],
    [{ L: 2, T: -2, "Θ": -1 }, "specific heat capacity", "Energy per kelvin per unit mass."],
    [{ M: 1, L: 2, T: -2, "Θ": -1, N: -1 }, "molar heat capacity", "Energy per kelvin per mole; the gas constant R has this dimension."],
    [{ M: 1, L: 1, T: -3, "Θ": -1 }, "thermal conductivity", "How easily heat flows through a material."]
  ];

  function dimFromLetters(obj) {
    var dim = {};
    Object.keys(obj).forEach(function (letter) { dim[LETTERS[letter]] = obj[letter]; });
    return dim;
  }
  function dimKey(dim) {
    return DIM_ORDER.map(function (k) { return dim[k] || 0; }).join(",");
  }
  var QUANTITIES = {};
  QUANTITY_LIST.forEach(function (q) {
    QUANTITIES[dimKey(dimFromLetters(q[0]))] = { name: q[1], meaning: q[2], note: q[3] || null };
  });

  // ---------------------------------------------------------------- data ---

  var units = {}, comps = {}, bySymbol = {}, byWord = {};
  var ready = false;

  function lowerName(name) {
    return name.toLowerCase().replace("celsius", "Celsius");
  }

  function setup(data) {
    data.nodes.forEach(function (n) { units[n.id] = n; comps[n.id] = []; });
    data.links.forEach(function (l) {
      if (l.type === "derivation") comps[l.target].push({ id: l.source, power: l.power, powers: l.powers || [l.power] });
    });

    // A resolved unit token: a unit id, a power-of-ten scale (prefixes and the
    // gram), and how to display it.
    function add(map, key, id, exp, sym, name, prefixable) {
      if (!(key in map)) map[key] = { id: id, exp: exp, sym: sym, name: name, prefixable: prefixable };
    }
    data.nodes.forEach(function (n) {
      var prefixable = n.id !== "kilogram" && n.id !== "celsius";
      n.symbols.forEach(function (s) { add(bySymbol, s, n.id, 0, s, lowerName(n.name), prefixable); });
      [n.id, n.name.toLowerCase()].forEach(function (w) {
        add(byWord, w, n.id, 0, n.symbols[0], lowerName(n.name), prefixable);
        add(byWord, w + "s", n.id, 0, n.symbols[0], lowerName(n.name), prefixable);
      });
    });
    // The kilogram already carries a prefix, so other prefixes attach to the gram.
    if (units.kilogram) {
      add(bySymbol, "g", "kilogram", -3, "g", "gram", true);
      ["gram", "grams", "gramme", "grammes"].forEach(function (w) { add(byWord, w, "kilogram", -3, "g", "gram", true); });
    }
    var aliases = { meter: "metre", meters: "metre", amp: "ampere", amps: "ampere", ohm: "ohm",
      degc: "celsius", celsius: "celsius", "°c": "celsius", sec: "second", secs: "second" };
    Object.keys(aliases).forEach(function (w) {
      var n = units[aliases[w]];
      if (n) add(byWord, w, n.id, 0, n.symbols[0], lowerName(n.name), n.id !== "celsius");
    });
    if (units.ohm) add(bySymbol, "Ohm", "ohm", 0, "Ω", "ohm", true);

    ready = true;
  }

  function resolve(word) {
    if (bySymbol[word]) return bySymbol[word];
    var lw = word.toLowerCase();
    if (byWord[lw]) return byWord[lw];
    var i, p, rest;
    // Prefixed names: "kilojoule", "millimetres".
    for (i = 0; i < PREFIXES.length; i++) {
      p = PREFIXES[i];
      if (lw.indexOf(p.name) === 0 && lw.length > p.name.length) {
        rest = byWord[lw.slice(p.name.length)];
        if (rest && rest.prefixable) return prefixed(p, rest, p.name + rest.name);
      }
    }
    // Prefixed symbols: "kJ", "ms", "µF". Two-letter "da" is tried before "d".
    var sorted = PREFIXES.slice().sort(function (a, b) { return b.sym.length - a.sym.length; });
    for (i = 0; i < sorted.length; i++) {
      p = sorted[i];
      if (word.indexOf(p.sym) === 0 && word.length > p.sym.length) {
        rest = bySymbol[word.slice(p.sym.length)];
        if (rest && rest.prefixable) return prefixed(p, rest, p.name + rest.name);
      }
    }
    return null;
  }
  function prefixed(p, base, name) {
    var sym = (p.sym === "u" ? "µ" : p.sym) + base.sym;
    return { id: base.id, exp: base.exp + p.exp, sym: sym, name: name, prefixable: false };
  }

  function suggestionsFor(word) {
    var seen = {}, out = [];
    var lw = word.toLowerCase();
    Object.keys(units).forEach(function (id) {
      var n = units[id];
      var cands = n.symbols.concat([n.name.toLowerCase(), id]);
      var best = Math.min.apply(null, cands.map(function (c) { return editDistance(lw, c.toLowerCase()); }));
      if (best <= 2 || n.name.toLowerCase().indexOf(lw) === 0) {
        if (!seen[id]) { seen[id] = true; out.push({ id: id, d: best }); }
      }
    });
    return out.sort(function (a, b) { return a.d - b.d; }).slice(0, 5).map(function (o) { return o.id; });
  }
  function editDistance(a, b) {
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  // -------------------------------------------------------------- parser ---

  function ParseError(message, word) { this.message = message; this.word = word; }

  var SUPER_TO_ASCII = { "⁻": "-", "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

  function normalize(s) {
    return s
      .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, function (run) {
        return "^" + run.split("").map(function (c) { return SUPER_TO_ASCII[c]; }).join("");
      })
      .replace(/[·⋅•×∙]/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/→/g, "->")
      .replace(/℃/g, "°C")
      .replace(/° +C\b/g, "°C")
      .replace(/μ/g, "µ")
      .replace(/Ω/g, "Ω")
      .trim();
  }

  function tokenize(s) {
    var toks = [], i = 0, space = false, m;
    function prevIsAtomEnd() {
      var t = toks[toks.length - 1];
      return t && !space && (t.type === "ident" || t.type === ")");
    }
    while (i < s.length) {
      var rest = s.slice(i), c = s[i];
      if (/\s/.test(c)) { space = true; i++; continue; }
      if ((m = /^[A-Za-zΩµ°À-ɏ]+/.exec(rest))) {
        toks.push({ type: "ident", value: m[0] });
      } else if ((m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest))) {
        var signed = c === "-" || c === "+";
        if (prevIsAtomEnd() && /^[+-]?\d+$/.test(m[0])) {
          // "m2" or "s-2": a bare trailing exponent.
          toks.push({ type: "^" });
          toks.push({ type: "num", value: parseInt(m[0], 10) });
        } else if (signed && toks.length && toks[toks.length - 1].type !== "^" && toks[toks.length - 1].type !== "(" &&
                   toks[toks.length - 1].type !== "*" && toks[toks.length - 1].type !== "/") {
          throw new ParseError("Unexpected “" + c + "”. Use ^ for powers, like s^-2.");
        } else {
          toks.push({ type: "num", value: parseFloat(m[0]) });
        }
      } else if ("*/^()".indexOf(c) !== -1) {
        m = [c];
        toks.push({ type: c });
      } else {
        throw new ParseError("I don't know what “" + c + "” means here.");
      }
      i += m[0].length;
      space = false;
    }
    return toks;
  }

  // A parsed expression: a numeric value times a product of unit factors.
  function product(value, factors, hasNumber) { return { value: value, factors: factors, hasNumber: !!hasNumber }; }
  function combine(a, b, sign) {
    return product(a.value * Math.pow(b.value, sign),
      a.factors.concat(b.factors.map(function (f) { return Object.assign({}, f, { power: f.power * sign }); })),
      a.hasNumber || b.hasNumber);
  }
  function raise(a, n) {
    return product(Math.pow(a.value, n),
      a.factors.map(function (f) { return Object.assign({}, f, { power: f.power * n }); }),
      a.hasNumber);
  }

  function parseExpression(src) {
    var toks = tokenize(src), pos = 0;
    if (!toks.length) throw new ParseError("There's nothing to analyse on one side of the conversion.");
    function peek() { return toks[pos]; }
    function next() { return toks[pos++]; }

    function parseProduct() {
      var acc = parseTerm();
      for (;;) {
        var t = peek();
        if (!t || t.type === ")") return acc;
        if (t.type === "*") { next(); acc = combine(acc, parseTerm(), 1); }
        else if (t.type === "/") { next(); acc = combine(acc, parseTerm(), -1); }
        else if (t.type === "ident" || t.type === "num" || t.type === "(") acc = combine(acc, parseTerm(), 1);
        else throw new ParseError("Unexpected “" + t.type + "”.");
      }
    }
    function parseTerm() {
      var a = parseAtom();
      if (peek() && peek().type === "^") {
        next();
        var paren = peek() && peek().type === "(";
        if (paren) next();
        var t = next();
        if (!t || t.type !== "num" || !Number.isInteger(t.value)) throw new ParseError("Powers must be whole numbers, like m^2 or s^-1.");
        if (paren) {
          if (!peek() || peek().type !== ")") throw new ParseError("Missing “)” after the power.");
          next();
        }
        a = raise(a, t.value);
      }
      return a;
    }
    function parseAtom() {
      var t = next();
      if (!t) throw new ParseError("The expression ends too early.");
      if (t.type === "num") return product(t.value, [], true);
      if (t.type === "ident") {
        var u = resolve(t.value);
        if (!u) throw new ParseError("“" + t.value + "” isn't a unit in this dataset.", t.value);
        return product(1, [Object.assign({ power: 1 }, u)]);
      }
      if (t.type === "(") {
        var inner = parseProduct();
        if (!peek() || peek().type !== ")") throw new ParseError("Missing “)”.");
        next();
        return inner;
      }
      throw new ParseError("Unexpected “" + t.type + "”.");
    }

    var result = parseProduct();
    if (pos < toks.length) throw new ParseError("Unmatched “)”.");

    // Merge repeated factors (m·m → m²) and drop any that cancel out.
    var merged = [], bySym = {};
    result.factors.forEach(function (f) {
      if (bySym[f.sym]) bySym[f.sym].power += f.power;
      else { bySym[f.sym] = Object.assign({}, f); merged.push(bySym[f.sym]); }
    });
    result.factors = merged.filter(function (f) { return f.power !== 0; });
    return result;
  }

  // ----------------------------------------------------------- reduction ---

  function addPower(map, id, p) {
    map[id] = (map[id] || 0) + p;
    if (map[id] === 0) delete map[id];
  }

  function sortedIds(map) {
    return Object.keys(map).sort(function (a, b) {
      var ba = BASE_ORDER.indexOf(a), bb = BASE_ORDER.indexOf(b);
      if (ba === -1 && bb === -1) return units[b].level - units[a].level;
      if (ba === -1) return -1;
      if (bb === -1) return 1;
      return ba - bb;
    });
  }

  // ---------------------------------------------------------- formatting ---

  function pow10(e) { return "10" + superscript(e); }

  // value × 10^exp10 as a readable number: plain in an everyday range,
  // scientific notation outside it.
  function formatNumber(value, exp10) {
    if (value === 0) return "0";
    var x = value * Math.pow(10, exp10);
    if (Math.abs(x) >= 1e-4 && Math.abs(x) < 1e9) return String(Number(x.toPrecision(12)));
    var ev = Math.floor(Math.log10(Math.abs(value)));
    var mant = Number((value / Math.pow(10, ev)).toPrecision(10));
    if (Math.abs(mant) >= 10) { mant /= 10; ev += 1; }
    var e = ev + exp10;
    return (mant === 1 ? "" : mant === -1 ? "−" : String(mant) + " × ") + pow10(e);
  }

  // Slash form: positive powers on top, the rest underneath.
  function slashForm(items) {
    var num = [], den = [];
    items.forEach(function (it) {
      if (it.power > 0) num.push(it.label + (it.power === 1 ? "" : superscript(it.power)));
      else if (it.power < 0) den.push(it.label + (it.power === -1 ? "" : superscript(-it.power)));
    });
    var top = num.length ? num.join("·") : "1";
    if (!den.length) return num.length ? top : "1";
    return top + "/" + (den.length > 1 ? "(" + den.join("·") + ")" : den[0]);
  }

  function mapString(map) {
    return slashForm(sortedIds(map).map(function (id) { return { label: units[id].symbols[0], power: map[id] }; }));
  }

  function exprString(value, exp10, map) {
    var coef = value * Math.pow(10, exp10) === 1 ? "" : formatNumber(value, exp10) + " ";
    var u = Object.keys(map).length ? mapString(map) : "";
    return (coef + u).trim() || "1";
  }

  function factorsSymbol(parsed) {
    var u = parsed.factors.length ? slashForm(parsed.factors.map(function (f) { return { label: f.sym, power: f.power }; })) : "";
    var coef = parsed.value !== 1 || !u ? formatNumber(parsed.value, 0) : "";
    return (coef + (coef && u ? " " : "") + u) || "1";
  }

  function powerWord(p) {
    return p === 1 ? "" : p === 2 ? " squared" : p === 3 ? " cubed" : " to the power " + p;
  }
  function factorsName(parsed) {
    var num = [], den = [];
    parsed.factors.forEach(function (f) {
      if (f.power > 0) num.push(f.name + powerWord(f.power));
      else den.push(f.name + powerWord(-f.power));
    });
    var s = num.join(" ");
    if (den.length) s += (s ? " " : "") + "per " + den.join(" per ");
    if (parsed.value !== 1) s = formatNumber(parsed.value, 0) + " " + s;
    return s.trim() || "dimensionless number";
  }

  function quantityOf(dim) {
    return QUANTITIES[dimKey(dim)] || null;
  }
  function namedUnitsWith(dim) {
    var key = dimKey(dim);
    return Object.keys(units).filter(function (id) { return dimKey(units[id].dimension) === key; });
  }

  // --------------------------------------------------------------- route ---

  // The SI base unit for each dimension, used to write any leftover quantity
  // in base units when no named unit fits it.
  var BASE_FOR_DIM = { length: "metre", mass: "kilogram", time: "second", current: "ampere",
    temperature: "kelvin", amount: "mole", luminous_intensity: "candela" };

  function mulMap(a, b, sign) {
    var out = Object.assign({}, a);
    Object.keys(b).forEach(function (id) { addPower(out, id, b[id] * sign); });
    return out;
  }
  function mapKey(map) {
    return sortedIds(map).map(function (id) { return id + "^" + map[id]; }).join(" ");
  }
  function dimOf(map) {
    var dim = {};
    DIM_ORDER.forEach(function (k) { dim[k] = 0; });
    Object.keys(map).forEach(function (id) {
      DIM_ORDER.forEach(function (k) { dim[k] += (units[id].dimension[k] || 0) * map[id]; });
    });
    return dim;
  }
  function dimDiff(a, b) {
    var d = {};
    DIM_ORDER.forEach(function (k) { d[k] = (a[k] || 0) - (b[k] || 0); });
    return d;
  }
  var NO_DIM = dimKey({});

  // Every way of writing a unit expression, from as typed down to SI base
  // units, expanding the highest-level derived unit at each step. Prefixes
  // are pulled out first as an exact power of ten.
  function expansion(parsed) {
    var map = {}, exp10 = 0, prefixed = [];
    parsed.factors.forEach(function (f) {
      exp10 += f.exp * f.power;
      addPower(map, f.id, f.power);
      if (f.exp) prefixed.push(f);
    });
    var states = [{ map: Object.assign({}, map), via: null }];
    for (var guard = 0; guard < 100; guard++) {
      var cand = Object.keys(map).filter(function (id) { return comps[id].length; });
      if (!cand.length) break;
      cand.sort(function (a, b) { return units[b].level - units[a].level; });
      var id = cand[0], p = map[id], before = Object.keys(map), net = 0;
      delete map[id];
      comps[id].forEach(function (c) { addPower(map, c.id, c.power * p); net += Math.abs(c.power); });
      states.push({
        map: Object.assign({}, map),
        via: {
          id: id,
          power: p,
          dimensionless: net === 0,
          cancelled: before.filter(function (k) { return k !== id && !(k in map); })
        }
      });
    }
    return { parsed: parsed, value: parsed.value, exp10: exp10, prefixed: prefixed, states: states, dim: dimOf(states[0].map) };
  }

  // Ways to write the extra quantity a conversion needs: a named unit with
  // exactly that dimension (or one over it), then the SI base units.
  function extraCandidates(qdim) {
    if (dimKey(qdim) === NO_DIM) return [{}];
    var key = dimKey(qdim), negKey = dimKey(dimDiff({}, qdim)), out = [];
    Object.keys(units).forEach(function (id) {
      if (id === "celsius") return;
      var k = dimKey(units[id].dimension);
      var c = {};
      if (k === key) { c[id] = 1; out.push(c); }
      else if (k === negKey) { c[id] = -1; out.push(c); }
    });
    var base = {};
    DIM_ORDER.forEach(function (k) { if (qdim[k]) base[BASE_FOR_DIM[k]] = qdim[k]; });
    out.push(base);
    return out;
  }

  // The shortest route from S to T: expand S some steps, multiply by the
  // extra quantity if the dimensions differ, then fold back up into T. Both
  // fully expanded forms are in base units, so a route always exists.
  function findRoute(S, T) {
    var cands = extraCandidates(dimDiff(T.dim, S.dim));
    var tKeys = T.states.map(function (t) { return mapKey(t.map); });
    var best = null;
    cands.forEach(function (c) {
      S.states.forEach(function (s, i) {
        var j = tKeys.indexOf(mapKey(mulMap(s.map, c, 1)));
        if (j === -1) return;
        var cost = (i + j) * 10 + Object.keys(c).length;
        if (!best || cost < best.cost) best = { cost: cost, i: i, j: j, extra: c };
      });
    });
    return best;
  }

  // ---------------------------------------------------------- the chain ---

  function article(word) { return /^[aeiou]/i.test(word) ? "an " : "a "; }
  function quantityName(dim) { var q = quantityOf(dim); return q ? q.name : null; }

  function prefixReason(list) {
    return list.map(function (f) {
      var p = f.sym.slice(0, f.sym.length - units[f.id].symbols[0].length);
      var name = f.name.slice(0, f.name.length - lowerName(units[f.id].name).length);
      if (f.id === "kilogram") return f.sym + " = " + pow10(f.exp) + " kg";
      return p + " = " + pow10(f.exp) + " (" + name + ")";
    }).join(", ");
  }
  function scaleOp(e) {
    if (e === 0) return "× 1";
    return (e > 0 ? "× " : "÷ ") + formatNumber(1, Math.abs(e));
  }

  // value × 10^exp as text, with the unit expression after it.
  function amount(value, exp, expr) {
    var n = formatNumber(value, exp);
    if (!expr || expr === "1") return n;
    // "1/s" rather than "1 1/s"; "1000/s" rather than "1000 1/s".
    if (expr.indexOf("1/") === 0) return (n === "1" ? "1" : n) + expr.slice(1);
    return n + " " + expr;
  }

  // "measures energy", or "is dimensionless".
  function measures(qn) { return qn === "dimensionless" ? "is dimensionless" : "measures " + qn; }

  function typedSymbol(parsed) {
    return parsed.factors.length ? slashForm(parsed.factors.map(function (f) { return { label: f.sym, power: f.power }; })) : "1";
  }

  function stepWhy(via, collapsing) {
    var n = units[via.id], name = lowerName(n.name);
    var parts = [collapsing ? "these combine into the " + name : "definition of the " + name];
    if (via.dimensionless) parts.push("its metres cancel, so it drops out");
    if (via.id === "celsius") parts.push("as a temperature difference, 1 °C = 1 K");
    if (via.cancelled.length) {
      parts.push(via.cancelled.map(function (k) { return units[k].symbols[0]; }).join(" and ") +
        " cancel" + (via.cancelled.length === 1 ? "s" : ""));
    }
    return parts.join("; ");
  }

  // ------------------------------------------------------- conversion factors ---
  // Each step multiplies by a fraction equal to 1 (or, for the extra quantity,
  // by that quantity), as in the factor-label method:
  //   1 kJ × (10³ J / 1 kJ) × (N·m / J) = 1000 N·m
  // A side is { coef, toks: [{ sym, pow }] }; a fraction is { num, den, pow }.

  function side(coef, toks) { return { coef: coef || null, toks: toks || [] }; }
  function fraction(num, den, pow, swap) {
    return swap ? { num: den, den: num, pow: pow } : { num: num, den: den, pow: pow };
  }

  // u^p written out by its definition: (what it's built from) / u.
  function defFraction(id, p, collapse) {
    var num = [], den = [{ sym: units[id].symbols[0], pow: 1 }];
    comps[id].forEach(function (c) {
      c.powers.forEach(function (pw) {
        var t = { sym: units[c.id].symbols[0], pow: Math.abs(pw) };
        (pw > 0 ? num : den).push(t);
      });
    });
    return fraction(side(null, num), side(null, den), Math.abs(p), (p < 0) !== collapse);
  }

  // A prefixed unit written in its unprefixed unit: (10³ J) / (1 kJ).
  function prefixFraction(f, invert) {
    var num = side(formatNumber(1, f.exp), [{ sym: units[f.id].symbols[0], pow: 1 }]);
    var den = side("1", [{ sym: f.sym, pow: 1 }]);
    return fraction(num, den, Math.abs(f.power), (f.power < 0) !== invert);
  }

  function mapFraction(map, coef) {
    var num = [], den = [];
    sortedIds(map).forEach(function (id) {
      (map[id] > 0 ? num : den).push({ sym: units[id].symbols[0], pow: Math.abs(map[id]) });
    });
    return fraction(side(coef, num), side(null, den), 1, false);
  }

  // The amount you start from, as typed: 5 km/ms is (5 km) / (ms).
  function startFraction(parsed) {
    var num = [], den = [];
    parsed.factors.forEach(function (f) { (f.power > 0 ? num : den).push({ sym: f.sym, pow: Math.abs(f.power) }); });
    return fraction(side(formatNumber(parsed.value, 0), num), side(null, den), 1, false);
  }

  // Builds the list of nodes (amounts) and steps (labelled arrows) between them.
  function buildChain(S, T, route) {
    var value = S.value, exp = 0;
    var nodes = [amount(value, 0, typedSymbol(S.parsed))], steps = [];
    function push(step, expr) { steps.push(step); nodes.push(amount(value, exp, expr)); }

    if (S.prefixed.length) {
      exp = S.exp10;
      push({ op: scaleOp(S.exp10), why: prefixReason(S.prefixed),
        factors: S.prefixed.map(function (f) { return prefixFraction(f, false); }) }, mapString(S.states[0].map));
    }
    for (var i = 1; i <= route.i; i++) {
      var via = S.states[i].via;
      push({ op: units[via.id].equation || "", why: stepWhy(via, false),
        factors: [defFraction(via.id, via.power, false)] }, mapString(S.states[i].map));
    }
    var extraKeys = Object.keys(route.extra);
    if (extraKeys.length) {
      var allNeg = extraKeys.every(function (id) { return route.extra[id] < 0; });
      var shown = {};
      extraKeys.forEach(function (id) { shown[id] = allNeg ? -route.extra[id] : route.extra[id]; });
      var qdim = dimOf(route.extra), qn = quantityName(allNeg ? dimDiff({}, qdim) : qdim);
      var verb = allNeg ? "divide by " : "multiply by ";
      push({
        op: (allNeg ? "÷ " : "× ") + mapString(shown),
        why: verb + (qn ? article(qn) + qn : "something with dimension " + formatDimension(allNeg ? dimDiff({}, qdim) : qdim)),
        extra: true,
        factors: [mapFraction(route.extra, null)]
      }, mapString(T.states[route.j].map));
    }
    for (var j = route.j; j >= 1; j--) {
      var tv = T.states[j].via;
      push({ op: units[tv.id].equation || "", why: stepWhy(tv, true),
        factors: [defFraction(tv.id, tv.power, true)] }, mapString(T.states[j - 1].map));
    }
    if (T.prefixed.length) {
      exp -= T.exp10;
      push({ op: scaleOp(-T.exp10), why: prefixReason(T.prefixed),
        factors: T.prefixed.map(function (f) { return prefixFraction(f, true); }) }, typedSymbol(T.parsed));
    } else if (nodes.length > 1 || T.parsed.factors.length) {
      // Show the target exactly as typed.
      nodes[nodes.length - 1] = amount(value, exp, typedSymbol(T.parsed));
    }
    if (T.value !== 1) {
      value /= T.value;
      nodes[nodes.length - 1] = amount(value, exp, typedSymbol(T.parsed));
    }
    return { nodes: nodes, steps: steps, value: value, exp: exp, start: startFraction(S.parsed) };
  }

  // A temperature reading in °C ↔ K: the one conversion that adds an offset.
  function isPlain(parsed, id) {
    return parsed.factors.length === 1 && parsed.factors[0].id === id && parsed.factors[0].power === 1;
  }
  function celsiusChain(src, tgt) {
    var fromC = isPlain(src, "celsius"), toC = isPlain(tgt, "celsius");
    var v = src.value * Math.pow(10, src.factors[0].exp);
    var nodes = [amount(src.value, 0, src.factors[0].sym)], steps = [];
    var out;
    if (fromC && !toC) {
      out = v + 273.15;
      steps.push({ op: "+ 273.15", why: "same-sized degree, but 0 °C is 273.15 K" });
      nodes.push(String(Number(out.toPrecision(12))) + " K");
      if (tgt.factors[0].exp) {
        out /= Math.pow(10, tgt.factors[0].exp);
        steps.push({ op: scaleOp(-tgt.factors[0].exp), why: prefixReason(tgt.factors) });
        nodes.push(String(Number(out.toPrecision(12))) + " " + tgt.factors[0].sym);
      }
    } else if (!fromC && toC) {
      if (src.factors[0].exp) {
        steps.push({ op: scaleOp(src.factors[0].exp), why: prefixReason(src.factors) });
        nodes.push(String(Number(v.toPrecision(12))) + " K");
      }
      out = v - 273.15;
      steps.push({ op: "− 273.15", why: "same-sized degree, but 0 °C is 273.15 K" });
      nodes.push(String(Number(out.toPrecision(12))) + " °C");
    } else {
      out = v;
    }
    return { nodes: nodes, steps: steps, celsius: true };
  }

  // --------------------------------------------------------------- render ---

  function unitLink(id, label) {
    return '<button type="button" class="an-unit" data-id="' + esc(id) + '">' + esc(label || units[id].symbols[0]) + "</button>";
  }
  function fillButton(which, text, label) {
    return '<button type="button" class="an-example" data-fill="' + which + '" data-value="' + esc(text) + '">' + esc(label || text) + "</button>";
  }

  function tokHTML(t) {
    return '<span class="u' + (t.cancel ? " x" : "") + '">' + esc(t.sym) + (t.pow !== 1 ? "<sup>" + t.pow + "</sup>" : "") + "</span>";
  }
  function sideHTML(sd) {
    var parts = [];
    if (sd.coef) parts.push('<span class="fx-c">' + esc(sd.coef) + "</span>");
    if (sd.toks.length) parts.push(sd.toks.map(tokHTML).join('<span class="fx-dot">·</span>'));
    return parts.join(" ") || "1";
  }
  function fracHTML(fr) {
    var html = fr.den.toks.length || (fr.den.coef && fr.den.coef !== "1")
      ? '<span class="fx"><span class="fx-n">' + sideHTML(fr.num) + '</span><span class="fx-d">' + sideHTML(fr.den) + "</span></span>"
      : '<span class="fx-inline">' + sideHTML(fr.num) + "</span>";
    if (fr.pow !== 1) html = '<span class="fx-p">(</span>' + html + '<span class="fx-p">)</span><sup class="fx-pow">' + fr.pow + "</sup>";
    return html;
  }

  // Strike through every unit that cancels across the whole product.
  function markCancellations(fracs) {
    fracs.forEach(function (fr) {
      [fr.num, fr.den].forEach(function (sd) { sd.toks = sd.toks.map(function (t) { return { sym: t.sym, pow: t.pow }; }); });
    });
    var bySym = {};
    fracs.forEach(function (fr) {
      [[fr.num, 1], [fr.den, -1]].forEach(function (pair) {
        pair[0].toks.forEach(function (t) {
          var e = bySym[t.sym] = bySym[t.sym] || { num: [], den: [] };
          (pair[1] > 0 ? e.num : e.den).push({ tok: t, left: t.pow * fr.pow });
        });
      });
    });
    Object.keys(bySym).forEach(function (sym) {
      var n = bySym[sym].num, d = bySym[sym].den, i = 0, j = 0;
      while (i < n.length && j < d.length) {
        var m = Math.min(n[i].left, d[j].left);
        n[i].left -= m; d[j].left -= m;
        if (!n[i].left) { n[i].tok.cancel = true; i++; }
        if (!d[j].left) { d[j].tok.cancel = true; j++; }
      }
    });
  }

  function productHTML(chain) {
    var fracs = [chain.start];
    chain.steps.forEach(function (st) { (st.factors || []).forEach(function (f) { fracs.push(f); }); });
    fracs = fracs.map(function (f) { return { num: Object.assign({}, f.num), den: Object.assign({}, f.den), pow: f.pow }; });
    markCancellations(fracs);
    var html = fracHTML(fracs[0]);
    var k = 1;
    chain.steps.forEach(function (st) {
      (st.factors || []).forEach(function () {
        html += '<span class="fx-op' + (st.extra ? " extra" : "") + '">×</span>' + '<span class="fx-wrap' + (st.extra ? " extra" : "") + '">' + fracHTML(fracs[k++]) + "</span>";
      });
    });
    return html + '<span class="fx-op">=</span><span class="fx-result">' + esc(chain.nodes[chain.nodes.length - 1]) + "</span>";
  }

  function renderChain(chain, emptyText) {
    var html = '<div class="cv-node">' + esc(chain.nodes[0]) + "</div>";
    chain.steps.forEach(function (st, k) {
      html += '<div class="cv-step' + (st.extra ? " extra" : "") + '">' +
        '<span class="cv-op">' + (st.factors ? "× " + st.factors.map(fracHTML).join(" × ") : esc(st.op)) + "</span>" +
        '<span class="cv-arrow" aria-hidden="true"></span>' +
        '<span class="cv-why">' + esc(st.why) + "</span></div>";
      html += '<div class="cv-node' + (k === chain.steps.length - 1 ? " end" : "") + '">' + esc(chain.nodes[k + 1]) + "</div>";
    });
    if (!chain.steps.length) {
      html += '<p class="cv-empty">' + esc(emptyText || "These are already the same unit, so there's nothing to do.") + "</p>";
    }
    return html;
  }

  function endMeta(parsed, S) {
    var qn = quantityName(S.dim);
    return '<div class="cv-name">' + esc(factorsName(parsed)) + "</div>" +
      "<div>" + (qn ? '<span class="cv-qty">' + esc(qn) + "</span> " : "") +
      (qn === "dimensionless" ? "" : '<span class="cv-dim">' + esc(formatDimension(S.dim)) + "</span>") + "</div>";
  }

  function errorMeta(err, which) {
    var html = '<div class="cv-error">' + esc(err.message) + "</div>";
    if (err.word) {
      var sugg = suggestionsFor(err.word);
      if (sugg.length) {
        html += '<div class="an-examples">' + sugg.map(function (id) {
          return fillButton(which, units[id].symbols[0], units[id].symbols[0] + " · " + units[id].name);
        }).join("") + "</div>";
      }
    }
    return html;
  }

  function meaningLine(label, dim) {
    var q = quantityOf(dim);
    if (!q) {
      return "<p><strong>" + esc(label) + "</strong> has dimension " + esc(formatDimension(dim)) +
        ", a combination without a common name.</p>";
    }
    return "<p><strong>" + esc(label) + "</strong> " + (q.name === "dimensionless" ? "is" : "measures") +
      " <strong>" + esc(q.name) + "</strong>. " + esc(q.meaning) + "</p>";
  }

  function renderDetails(S, T, extra, chainSteps) {
    var html = "", notes = [], ids = [];
    function addNote(dim) { var q = quantityOf(dim); if (q && q.note && notes.indexOf(q.note) === -1) notes.push(q.note); }
    function addIds(map) { Object.keys(map).forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); }); }

    html += meaningLine(typedSymbol(S.parsed), S.dim);
    addNote(S.dim); addIds(S.states[0].map);
    if (extra && Object.keys(extra).length) {
      var qd = dimOf(extra);
      html += meaningLine(mapString(extra), qd);
      addIds(extra);
    }
    if (T) {
      html += meaningLine(typedSymbol(T.parsed), T.dim);
      addNote(T.dim); addIds(T.states[0].map);
    }
    notes.forEach(function (n) { html += '<p class="an-caveat">' + esc(n) + "</p>"; });
    if (chainSteps.some(function (s) { return /°C = 1 K/.test(s.why); })) {
      html += '<p class="an-caveat">Inside a compound unit, °C is read as a temperature difference, where 1 °C = 1 K. ' +
        "The 273.15 offset applies only when converting a single temperature reading.</p>";
    }
    if (ids.length) {
      html += '<ul class="an-named">';
      ids.forEach(function (id) {
        var n = units[id];
        html += "<li>" + unitLink(id) + ' <span class="an-named-name">' + esc(n.name) + "</span>";
        if (n.equation) html += ' <code class="an-eq">' + esc(n.equation) + "</code>";
        if (n.currentDefinition) html += '<p class="an-def">' + esc(n.currentDefinition) + "</p>";
        html += "</li>";
      });
      html += "</ul>";
    }
    return '<section class="pod"><h3 class="pod-title">What these units measure</h3><div class="pod-body">' + html + "</div></section>";
  }

  function summary(equation, sentence, product) {
    return '<div class="cv-summary">' + (product ? '<div class="cv-product">' + product + "</div>" : "") +
      '<div class="cv-equation">' + esc(equation) + '</div><p class="cv-sentence">' + sentence + "</p></div>";
  }

  // ---------------------------------------------------------------- update ---

  var fromInput = document.getElementById("cv-from");
  var toInput = document.getElementById("cv-to");
  var fromMeta = document.getElementById("cv-from-meta");
  var toMeta = document.getElementById("cv-to-meta");
  var chainEl = document.getElementById("cv-chain");
  var detailsEl = document.getElementById("cv-details");
  var examplesEl = document.getElementById("an-examples");
  var datalist = document.getElementById("cv-units");

  var EXAMPLES = [["kJ", "N·m"], ["W", "J"], ["W/A", "V"], ["Ω·F", "s"], ["J", "N"], ["N", "Pa"], ["25 °C", "K"], ["T·m²", "Wb"], ["kg·m²/s²", ""]];

  function tryParse(text) {
    if (!text.trim()) return { empty: true };
    try { return { parsed: parseExpression(normalize(text)) }; }
    catch (err) {
      if (err instanceof ParseError) return { error: err };
      throw err;
    }
  }

  function update(writeHash) {
    if (writeHash) {
      var q = "from=" + encodeURIComponent(fromInput.value) + (toInput.value ? "&to=" + encodeURIComponent(toInput.value) : "");
      try { history.replaceState(null, "", "#analysis?" + q); } catch (e) { /* ignore */ }
    }
    if (!ready) return;
    var a = tryParse(fromInput.value), b = tryParse(toInput.value);
    fromInput.classList.toggle("invalid", !!a.error);
    toInput.classList.toggle("invalid", !!b.error);
    chainEl.innerHTML = "";
    detailsEl.innerHTML = "";

    var S = a.parsed ? expansion(a.parsed) : null;
    var T = b.parsed ? expansion(b.parsed) : null;
    fromMeta.innerHTML = a.error ? errorMeta(a.error, "from") : S ? endMeta(a.parsed, S) : "";
    if (b.error) toMeta.innerHTML = errorMeta(b.error, "to");
    else if (T) toMeta.innerHTML = endMeta(b.parsed, T);
    else if (S) {
      var same = Object.keys(units).filter(function (id) {
        return id !== "celsius" && dimKey(units[id].dimension) === dimKey(S.dim) && !isPlain(S.parsed, id);
      });
      toMeta.innerHTML = '<div class="cv-name">Empty: the steps break the unit down into SI base units.</div>' +
        (same.length && dimKey(S.dim) !== NO_DIM ? '<div class="cv-name">Same kind of quantity:</div><div class="an-examples">' +
          same.map(function (id) { return fillButton("to", units[id].symbols[0], units[id].symbols[0] + " · " + units[id].name); }).join("") + "</div>" : "");
    } else toMeta.innerHTML = "";

    if (!S) {
      chainEl.innerHTML = '<p class="cv-empty">' + (a.error ? "Fix the From unit to see the steps." : "Type a unit in From, or pick an example above.") + "</p>";
      return;
    }
    if (b.error) {
      chainEl.innerHTML = '<p class="cv-empty">Fix the To unit to see the steps.</p>';
      return;
    }

    var src = S.parsed, chain, route = null, sentence, equation, emptyText;
    var tempPair = T && (isPlain(src, "celsius") || isPlain(src, "kelvin")) && (isPlain(T.parsed, "celsius") || isPlain(T.parsed, "kelvin")) &&
      (isPlain(src, "celsius") !== isPlain(T.parsed, "celsius")) && T.value === 1;

    if (tempPair) {
      chain = celsiusChain(src, T.parsed);
      equation = chain.nodes[0] + " = " + chain.nodes[chain.nodes.length - 1];
      sentence = "The degree Celsius and the kelvin are the same size; only their zero points differ. " +
        "For a temperature <em>difference</em> there's no offset: a change of 1 °C is a change of 1 K.";
    } else if (!T) {
      // No target: break the source all the way down.
      var last = S.states.length - 1;
      var baseParsed = { factors: [], value: 1 };
      var Tbase = { parsed: baseParsed, value: 1, exp10: 0, prefixed: [], states: [{ map: S.states[last].map, via: null }], dim: S.dim };
      route = { i: last, j: 0, extra: {} };
      chain = buildChain(S, Tbase, route);
      chain.nodes[chain.nodes.length - 1] = amount(chain.value, chain.exp, mapString(S.states[last].map) || "1");
      var qn = quantityName(S.dim);
      sentence = esc(typedSymbol(src)) + (qn ? " " + esc(measures(qn)) + ". " : " has dimension " + esc(formatDimension(S.dim)) + ". ");
      if (chain.steps.length) {
        equation = chain.nodes[0] + " = " + chain.nodes[chain.nodes.length - 1];
        sentence += "Written in SI base units it is " + esc(mapString(S.states[last].map) || "a plain number") + ".";
      } else {
        equation = chain.nodes[0];
        sentence += "It's already written in SI base units. Pick a To unit to convert it.";
        emptyText = "Already in SI base units.";
      }
    } else {
      route = findRoute(S, T);
      chain = buildChain(S, T, route);
      var sSym = typedSymbol(src), tSym = typedSymbol(T.parsed);
      var qs = quantityName(S.dim), qt = quantityName(T.dim);
      var extraKeys = Object.keys(route.extra);
      if (!extraKeys.length) {
        equation = chain.nodes[0] + " = " + chain.nodes[chain.nodes.length - 1];
        var factor = formatNumber(chain.value / src.value, chain.exp);
        sentence = (qs === "dimensionless" ? "Both are dimensionless" : "Both measure " + (qs ? esc(qs) : "the same dimension, " + esc(formatDimension(S.dim)))) +
          ", so converting only takes a number. " +
          (factor === "1" ? "They're exactly the same size." : "Multiply by " + esc(factor) + ".");
      } else {
        var extraStep = chain.steps.filter(function (s) { return s.extra; })[0];
        var divide = extraStep.op.charAt(0) === "÷";
        var qShown = extraStep.op.slice(2);
        equation = chain.nodes[0] + (divide ? " ÷ 1 " : " × 1 ") + qShown + " = " + chain.nodes[chain.nodes.length - 1];
        var qdim = dimOf(route.extra);
        var qq = quantityName(divide ? dimDiff({}, qdim) : qdim);
        sentence = esc(sSym) + (qs ? " " + esc(measures(qs)) : " has dimension " + esc(formatDimension(S.dim))) + " and " + esc(tSym) +
          (qt ? " " + esc(measures(qt)) : " has dimension " + esc(formatDimension(T.dim))) +
          ". They aren't the same kind of quantity, so no number alone converts one into the other: you have to " +
          esc(extraStep.why) + (qs && qq && qt ? " (" + esc(qs) + (divide ? " ÷ " : " × ") + esc(qq) + " = " + esc(qt) + ")" : "") + ".";
      }
    }

    chainEl.innerHTML = renderChain(chain, emptyText);
    var product = chain.start && chain.steps.length ? productHTML(chain) : "";
    detailsEl.innerHTML = summary(equation, sentence, product) + renderDetails(S, T, route ? route.extra : null, chain.steps);
  }

  var timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () { update(true); }, 120);
  }
  fromInput.addEventListener("input", schedule);
  toInput.addEventListener("input", schedule);

  document.getElementById("cv-swap").addEventListener("click", function () {
    var f = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = f;
    update(true);
  });

  examplesEl.innerHTML = EXAMPLES.map(function (ex) {
    return '<button type="button" class="an-example" data-from="' + esc(ex[0]) + '" data-to="' + esc(ex[1]) + '">' +
      esc(ex[0]) + " → " + esc(ex[1] || "base units") + "</button>";
  }).join("");
  examplesEl.addEventListener("click", function (ev) {
    var b = ev.target.closest(".an-example");
    if (!b) return;
    fromInput.value = b.dataset.from;
    toInput.value = b.dataset.to;
    update(true);
  });

  document.getElementById("analysis").addEventListener("click", function (ev) {
    var unit = ev.target.closest(".an-unit");
    if (unit && M.selectUnit) { M.selectUnit(unit.dataset.id); return; }
    var fill = ev.target.closest("[data-fill]");
    if (fill) {
      (fill.dataset.fill === "to" ? toInput : fromInput).value = fill.dataset.value;
      update(true);
    }
  });

  function readHash() {
    var m = /^#analysis\?(.*)$/.exec(location.hash);
    if (!m) return null;
    var out = { from: "", to: "" };
    m[1].split("&").forEach(function (pair) {
      var kv = pair.split("=");
      try { if (kv[0] === "from" || kv[0] === "to") out[kv[0]] = decodeURIComponent(kv[1] || ""); } catch (e) { /* ignore */ }
    });
    return out;
  }
  window.addEventListener("hashchange", function () {
    var h = readHash();
    if (h && (h.from !== fromInput.value || h.to !== toInput.value)) {
      fromInput.value = h.from;
      toInput.value = h.to;
      update(false);
    }
  });

  M.data.then(function (data) {
    setup(data);
    datalist.innerHTML = Object.keys(units).map(function (id) {
      return '<option value="' + esc(units[id].symbols[0]) + '">' + esc(units[id].name) + "</option>";
    }).join("");
    var h = readHash();
    if (h) { fromInput.value = h.from; toInput.value = h.to; }
    else if (!fromInput.value) { fromInput.value = "kJ"; toInput.value = "N·m"; }
    update(false);
  }).catch(function (err) {
    chainEl.innerHTML = '<p class="cv-empty">graph.json failed to load, so there are no units to work with.</p>';
    console.error(err);
  });

  // Exposed for testing from the console.
  M.analysis = { expansion: expansion, findRoute: findRoute, buildChain: buildChain, parse: function (t) { return parseExpression(normalize(t)); }, update: update };
})();
