#!/usr/bin/env python3
"""Validate data/units/*.yaml and data/relationships/*.yaml against schema/,
plus referential-integrity, dimensional-arithmetic, and cycle checks that a
JSON Schema alone can't express. Run before every commit.
"""
import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
UNITS_DIR = ROOT / "data" / "units"
RELATIONSHIPS_DIR = ROOT / "data" / "relationships"
SCHEMA_DIR = ROOT / "schema"

# Systems whose units are defined by fixing physical constants rather than
# from other units — the only ones allowed an empty derived_from.
CONSTANT_DEFINED_SYSTEMS = {"SI-base", "natural-planck"}

DIM_KEYS = ["length", "mass", "time", "current", "temperature", "amount", "luminous_intensity"]


def load_yaml_dir(directory):
    entries = {}
    if not directory.exists():
        return entries
    for path in sorted(directory.glob("*.yaml")):
        with path.open() as f:
            data = yaml.safe_load(f)
        entries[path.stem] = (path, data)
    return entries


def load_schema(name):
    with (SCHEMA_DIR / name).open() as f:
        return json.load(f)


def validate_schema(entries, schema, label, errors):
    validator = Draft202012Validator(schema)
    for stem, (path, data) in entries.items():
        for err in sorted(validator.iter_errors(data), key=str):
            loc = "/".join(str(p) for p in err.path) or "<root>"
            errors.append(f"{label} {path.name}: {loc}: {err.message}")


def check_units(units, errors):
    ids = set(units.keys())

    for stem, (path, data) in units.items():
        if data.get("id") != stem:
            errors.append(f"unit {path.name}: id '{data.get('id')}' does not match filename stem '{stem}'")

        derived_from = data.get("derived_from", [])
        for comp in derived_from:
            comp_id = comp.get("id")
            if comp_id not in ids:
                errors.append(f"unit {path.name}: derived_from references unknown unit '{comp_id}'")

        if data.get("system") == "SI-base" and derived_from:
            errors.append(f"unit {path.name}: SI-base unit must have empty derived_from")
        if data.get("system") not in CONSTANT_DEFINED_SYSTEMS and not derived_from:
            errors.append(
                f"unit {path.name}: derived_from is empty, but only units defined directly from "
                f"physical constants ({', '.join(sorted(CONSTANT_DEFINED_SYSTEMS))}) may have no "
                f"component units"
            )

        definitions = data.get("definitions", [])
        current_count = sum(1 for d in definitions if d.get("current"))
        if current_count != 1:
            errors.append(
                f"unit {path.name}: definitions must have exactly one entry with current: true "
                f"(found {current_count})"
            )
        for i, d in enumerate(definitions):
            if not d.get("source"):
                errors.append(f"unit {path.name}: definitions[{i}] missing non-empty 'source'")

        # Dimensional-arithmetic check: sum(power * component.dimension) must equal
        # this unit's stated dimension, whenever it has any components.
        if derived_from:
            unresolved = any(c.get("id") not in units for c in derived_from)
            if not unresolved:
                computed = {k: 0 for k in DIM_KEYS}
                for comp in derived_from:
                    comp_dim = units[comp["id"]][1].get("dimension", {})
                    power = comp.get("power", 1)
                    for k in DIM_KEYS:
                        computed[k] += power * comp_dim.get(k, 0)
                stated = data.get("dimension", {})
                mismatches = [k for k in DIM_KEYS if stated.get(k, 0) != computed[k]]
                if mismatches:
                    errors.append(
                        f"unit {path.name}: dimension mismatch on {mismatches}: "
                        f"stated {stated}, computed from derived_from {computed}"
                    )


def check_cycles(units, errors):
    # component -> [units derived from it]
    graph = {stem: [] for stem in units}
    for stem, (_, data) in units.items():
        for comp in data.get("derived_from", []):
            comp_id = comp.get("id")
            if comp_id in graph:
                graph[comp_id].append(stem)

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {stem: WHITE for stem in units}

    def dfs(node, stack):
        color[node] = GRAY
        stack.append(node)
        for neighbor in graph.get(node, []):
            if color[neighbor] == GRAY:
                cycle_start = stack.index(neighbor)
                cycle = stack[cycle_start:] + [neighbor]
                errors.append("cycle detected in derived_from graph: " + " -> ".join(cycle))
                return True
            if color[neighbor] == WHITE and dfs(neighbor, stack):
                return True
        stack.pop()
        color[node] = BLACK
        return False

    for stem in units:
        if color[stem] == WHITE:
            if dfs(stem, []):
                break


def check_relationships(units, relationships, errors):
    unit_ids = set(units.keys())
    for stem, (path, data) in relationships.items():
        if data.get("id") != stem:
            errors.append(f"relationship {path.name}: id '{data.get('id')}' does not match filename stem '{stem}'")
        rel_units = data.get("units", [])
        if len(rel_units) < 2:
            errors.append(f"relationship {path.name}: 'units' must have at least 2 entries")
        for uid in rel_units:
            if uid not in unit_ids:
                errors.append(f"relationship {path.name}: references unknown unit '{uid}'")


def main():
    errors = []

    units = load_yaml_dir(UNITS_DIR)
    relationships = load_yaml_dir(RELATIONSHIPS_DIR)

    validate_schema(units, load_schema("unit.schema.json"), "unit", errors)
    validate_schema(relationships, load_schema("relationship.schema.json"), "relationship", errors)

    check_units(units, errors)
    check_cycles(units, errors)
    check_relationships(units, relationships, errors)

    if errors:
        print(f"FAILED: {len(errors)} error(s)\n")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print(f"OK: {len(units)} unit(s), {len(relationships)} relationship(s) validated successfully.")


if __name__ == "__main__":
    main()
