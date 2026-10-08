#!/usr/bin/env python3
"""Assemble the static web viewer into _site/ from site/ and the generated
output/ graph. Run build_graph.py first. The result is what GitHub Pages
serves; never hand-edit anything under _site/.
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_SRC = ROOT / "site"
OUTPUT_DIR = ROOT / "output"
SITE_OUT = ROOT / "_site"

GENERATED = ["graph.json", "graph.svg"]


def main():
    missing = [name for name in GENERATED if not (OUTPUT_DIR / name).exists()]
    if missing:
        print(f"missing {', '.join(missing)} in output/ — run build_graph.py first", file=sys.stderr)
        sys.exit(1)

    if SITE_OUT.exists():
        shutil.rmtree(SITE_OUT)
    shutil.copytree(SITE_SRC, SITE_OUT)
    for name in GENERATED:
        shutil.copy2(OUTPUT_DIR / name, SITE_OUT / name)

    print(f"Built site -> {SITE_OUT}")


if __name__ == "__main__":
    main()
