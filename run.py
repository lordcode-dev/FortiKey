"""Local dev server for the FortiKey Chrome extension.

This project is a static MV3 extension, so we serve files over HTTP for
quick local inspection (e.g., opening popup/options pages in a browser).
"""

from __future__ import annotations

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

HOST = "0.0.0.0"
PORT = 5000


def main() -> None:
    project_root = Path(__file__).resolve().parent
    handler = lambda *args, **kwargs: SimpleHTTPRequestHandler(  # noqa: E731
        *args, directory=str(project_root), **kwargs
    )
    server = ThreadingHTTPServer((HOST, PORT), handler)
    print(f"FortiKey extension files served at http://{HOST}:{PORT}")
    print("Tip: load unpacked extension from this folder in chrome://extensions")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
