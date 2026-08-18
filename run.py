"""Local dev server for the FortiKey Chrome extension."""

from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "0.0.0.0"
PORT = 5000
ICON_FILES = [
    "icons/icon-16.png",
    "icons/icon-32.png",
    "icons/icon-48.png",
    "icons/icon-128.png",
]


def _warn_if_missing_icons(project_root: Path) -> None:
    missing = [path for path in ICON_FILES if not (project_root / path).exists()]
    if not missing:
        return
    print("WARNING: manifest icon files are currently missing:")
    for path in missing:
        print(f"  - {path}")
    print("Add your icon files before packaging the extension.")


def main() -> None:
    project_root = Path(__file__).resolve().parent
    handler = lambda *args, **kwargs: SimpleHTTPRequestHandler(  # noqa: E731
        *args, directory=str(project_root), **kwargs
    )
    server = ThreadingHTTPServer((HOST, PORT), handler)

    print(f"FortiKey extension files served at http://{HOST}:{PORT}")
    print("Tip: load unpacked extension from this folder in chrome://extensions")
    _warn_if_missing_icons(project_root)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
