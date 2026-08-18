"""Local dev server for the FortiKey Chrome extension."""

from __future__ import annotations

import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "0.0.0.0"
PORT = 5000


def _manifest_icon_paths(project_root: Path) -> set[str]:
    manifest = json.loads((project_root / "manifest.json").read_text(encoding="utf-8"))
    paths: set[str] = set()
    for value in (manifest.get("icons") or {}).values():
        if isinstance(value, str):
            paths.add(value)
    for value in ((manifest.get("action") or {}).get("default_icon") or {}).values():
        if isinstance(value, str):
            paths.add(value)
    return paths


def _warn_if_missing_manifest_assets(project_root: Path) -> None:
    icon_paths = _manifest_icon_paths(project_root)
    if not icon_paths:
        print("No manifest icon assets are referenced; Chrome will use a default extension icon.")
        return

    missing = [path for path in sorted(icon_paths) if not (project_root / path).exists()]
    if not missing:
        return

    print("WARNING: manifest icon files are currently missing:")
    for path in missing:
        print(f"  - {path}")
    print("Add those files or remove the matching manifest references before packaging.")


def main() -> None:
    project_root = Path(__file__).resolve().parent
    handler = lambda *args, **kwargs: SimpleHTTPRequestHandler(  # noqa: E731
        *args, directory=str(project_root), **kwargs
    )
    server = ThreadingHTTPServer((HOST, PORT), handler)

    print(f"FortiKey extension files served at http://{HOST}:{PORT}")
    print("Tip: load unpacked extension from this folder in chrome://extensions")
    _warn_if_missing_manifest_assets(project_root)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
