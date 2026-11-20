#!/usr/bin/env python3
"""Serve the Next.js static export (out/) on an independent local port."""

from __future__ import annotations

import argparse
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "out"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8091

mimetypes.add_type("application/pdf", ".pdf")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/vnd.jupyter", ".ipynb")
mimetypes.add_type("font/woff2", ".woff2")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def end_headers(self):
        path = Path(self.path.split("?", 1)[0])
        if path.suffix in {".html", ""}:
            self.send_header("Cache-Control", "no-cache")
        elif path.suffix in {".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".woff2", ".ico"}:
            self.send_header("Cache-Control", "public, max-age=86400")
        elif path.suffix == ".pdf":
            self.send_header("Cache-Control", "public, max-age=3600")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, fmt, *args):
        import sys
        sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve llm.qqx.ai static site")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()
    if not SITE.exists():
        raise SystemExit(f"site directory missing: {SITE}. Run scripts/build.sh first.")
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"serving {SITE} on http://{args.host}:{args.port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
