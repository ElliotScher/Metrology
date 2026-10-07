#!/usr/bin/env python3
"""Regenerate output/graph.dot, output/graph.svg, and output/graph.json from
data/. These are the only source of truth for the graph structure — never
hand-edit anything under output/.
"""
import json
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
UNITS_DIR = ROOT / "data" / "units"
RELATIONSHIPS_DIR = ROOT / "data" / "relationships"
OUTPUT_DIR = ROOT / "output"

SYSTEM_COLORS = {
    "SI-base": "#1b5e20",
    "SI-derived": "#1565c0",
    "SI-accepted": "#6a1b9a",
    "CGS": "#e65100",
    "imperial": "#b71c1c",
    "us-customary": "#ad1457",
    "natural-planck": "#004d40",
    "domain-specific": "#37474f",
}
DEFAULT_COLOR = "#607d8b"


def load_yaml_dir(directory):
    entries = {}
    if not directory.exists():
        return entries
    for path in sorted(directory.glob("*.yaml")):
        with path.open() as f:
            entries[path.stem] = yaml.safe_load(f)
    return entries


def current_definition(unit):
    for d in unit.get("definitions", []):
        if d.get("current"):
            return d
    definitions = unit.get("definitions", [])
    return definitions[0] if definitions else {}


def build_dot(units, relationships):
    lines = [
        "digraph metrology {",
        '  rankdir="TB";',
        '  node [shape=box, style=filled, fontname="Helvetica", fontsize=10];',
        '  edge [fontname="Helvetica", fontsize=8];',
    ]

    for uid, unit in units.items():
        color = SYSTEM_COLORS.get(unit.get("system"), DEFAULT_COLOR)
        symbols = ", ".join(unit.get("symbols", []))
        label = f"{unit.get('name')}\\n({symbols})"
        lines.append(f'  "{uid}" [label="{label}", fillcolor="{color}", fontcolor="white"];')

    for uid, unit in units.items():
        for comp in unit.get("derived_from", []):
            power = comp.get("power", 1)
            edge_label = f"^{power}" if power != 1 else ""
            lines.append(f'  "{comp["id"]}" -> "{uid}" [label="{edge_label}"];')

    for _, rel in relationships.items():
        rel_units = rel.get("units", [])
        for a, b in zip(rel_units, rel_units[1:]):
            lines.append(
                f'  "{a}" -> "{b}" [dir=none, style=dashed, color="#9e9e9e", '
                f'fontcolor="#616161", label="{rel.get("kind", "")}"];'
            )

    lines.append("}")
    return "\n".join(lines) + "\n"


def build_json(units, relationships):
    nodes = []
    for uid, unit in units.items():
        cur = current_definition(unit)
        nodes.append(
            {
                "id": uid,
                "name": unit.get("name"),
                "symbols": unit.get("symbols", []),
                "system": unit.get("system"),
                "domain": unit.get("domain"),
                "dimension": unit.get("dimension"),
                "equation": unit.get("equation"),
                "currentDefinition": cur.get("value"),
                "currentSource": cur.get("source"),
                "definitionCount": len(unit.get("definitions", [])),
                "etymology": unit.get("notes", {}).get("etymology"),
                "cursedness": unit.get("notes", {}).get("cursedness"),
            }
        )

    links = []
    for uid, unit in units.items():
        for comp in unit.get("derived_from", []):
            links.append(
                {
                    "source": comp["id"],
                    "target": uid,
                    "type": "derivation",
                    "power": comp.get("power", 1),
                }
            )

    for rid, rel in relationships.items():
        rel_units = rel.get("units", [])
        for a, b in zip(rel_units, rel_units[1:]):
            links.append(
                {
                    "source": a,
                    "target": b,
                    "type": "relationship",
                    "relationshipId": rid,
                    "kind": rel.get("kind"),
                    "note": rel.get("note"),
                    "sourceRef": rel.get("source"),
                }
            )

    return {"nodes": nodes, "links": links}


def main():
    units = load_yaml_dir(UNITS_DIR)
    relationships = load_yaml_dir(RELATIONSHIPS_DIR)

    OUTPUT_DIR.mkdir(exist_ok=True)

    dot_text = build_dot(units, relationships)
    (OUTPUT_DIR / "graph.dot").write_text(dot_text)

    (OUTPUT_DIR / "graph.json").write_text(json.dumps(build_json(units, relationships), indent=2) + "\n")

    result = subprocess.run(
        ["dot", "-Tsvg", str(OUTPUT_DIR / "graph.dot")],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"dot failed:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)
    (OUTPUT_DIR / "graph.svg").write_text(result.stdout)

    print(f"Built graph: {len(units)} unit(s), {len(relationships)} relationship(s).")
    for name in ("graph.dot", "graph.svg", "graph.json"):
        print(f"  -> {OUTPUT_DIR / name}")


if __name__ == "__main__":
    main()
