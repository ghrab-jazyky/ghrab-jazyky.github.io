#!/usr/bin/env python3
"""Safely embed the shared Reading Lab 2.2 navigation & paragraph numbers.
Usage: python patch_nav.py SOURCE.html OUTPUT.html
Does not modify source files or question DATA; does not add network dependencies.
The original file must use the approved Reading Lab inline HTML DOM contract.
"""
from __future__ import annotations
import argparse
import hashlib
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
MARKER = "Reading Lab universal question<->text navigation, v2.2."
CONTRACT = ("id=\"readingBody\"", "id=\"questions\"", "id=\"skillTabs\"", "id=\"dictionaryToggle\"", "const DATA=")

def patch(text: str) -> str:
    if MARKER in text:
        raise ValueError("navigation module is already installed")
    for check in CONTRACT:
        if text.count(check) != 1:
            raise ValueError(f"expected exactly one {check}, found {text.count(check)}")
    if text.count("</style>") != 1 or "</body>" not in text:
        raise ValueError("unexpected HTML style/body structure")
    css = (HERE / "reading-nav-v2_2.css").read_text(encoding="utf-8")
    js = (HERE / "reading-nav-v2_2.js").read_text(encoding="utf-8")
    if "</script" in js.lower() or "</style" in css.lower():
        raise ValueError("embedded asset contains closing HTML delimiter")
    text = text.replace("</style>", "\n" + css + "\n</style>", 1)
    text = text.replace("</body>", "<script>\n" + js + "\n</script>\n</body>", 1)
    return text

def main() -> None:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source", type=pathlib.Path)
    ap.add_argument("output", type=pathlib.Path)
    args=ap.parse_args()
    if args.source.resolve()==args.output.resolve():
        ap.error("output must not overwrite source")
    original=args.source.read_text(encoding="utf-8")
    fixed=patch(original)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(fixed, encoding="utf-8")
    print("Source SHA256:",hashlib.sha256(original.encode()).hexdigest())
    print("Patched SHA256:",hashlib.sha256(fixed.encode()).hexdigest())
    print("Added only an inline CSS block and one inline JavaScript module. Source untouched.")

if __name__ == "__main__": main()
