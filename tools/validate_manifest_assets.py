#!/usr/bin/env python3
"""Validate that manifest icon file references exist and have the expected PNG sizes."""

from __future__ import annotations

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "manifest.json"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def _collect_icon_paths(manifest: dict) -> dict[str, int]:
    paths: dict[str, int] = {}
    for size, value in (manifest.get("icons") or {}).items():
        if isinstance(value, str):
            paths[value] = int(size)
    action = manifest.get("action") or {}
    for size, value in (action.get("default_icon") or {}).items():
        if isinstance(value, str):
            paths[value] = int(size)
    return paths


def _read_png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError("not a PNG file")
    return struct.unpack("!II", data[16:24])


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    failures: list[str] = []

    for rel, expected_size in sorted(_collect_icon_paths(manifest).items()):
        path = ROOT / rel
        if not path.exists():
            failures.append(f"missing: {rel}")
            continue
        try:
            width, height = _read_png_size(path)
        except ValueError as error:
            failures.append(f"invalid PNG: {rel} ({error})")
            continue
        if (width, height) != (expected_size, expected_size):
            failures.append(
                f"wrong size: {rel} is {width}x{height}, expected {expected_size}x{expected_size}"
            )

    if failures:
        print("Manifest icon validation failed:")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print("All manifest icon assets exist and have the expected PNG dimensions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
