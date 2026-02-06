#!/usr/bin/env python3
"""Validate that manifest asset file references exist on disk."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "manifest.json"


def _collect_icon_paths(manifest: dict) -> set[str]:
    paths: set[str] = set()
    for _, value in (manifest.get("icons") or {}).items():
        if isinstance(value, str):
            paths.add(value)
    action = manifest.get("action") or {}
    for _, value in (action.get("default_icon") or {}).items():
        if isinstance(value, str):
            paths.add(value)
    return paths


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    missing: list[str] = []
    for rel in sorted(_collect_icon_paths(manifest)):
        if not (ROOT / rel).exists():
            missing.append(rel)

    if missing:
        print("Missing manifest assets:")
        for rel in missing:
            print(f" - {rel}")
        return 1

    print("All manifest icon assets exist.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
