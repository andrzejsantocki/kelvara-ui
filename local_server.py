#!/usr/bin/env python3
"""Local static mirror plus same-origin HAOS API reverse proxy."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import argparse

UPSTREAM = "http://192.168.0.193:7650"
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self): self._proxy_or_static("GET")
    def do_POST(self): self._proxy_or_static("POST")
    def _proxy_or_static(self, method):
        path = urlsplit(self.path).path
        if path == "/healthz" or path.startswith("/api/"):
            self._proxy(method)
        else:
            if path == "/": self.path = "/index.deployed.html"
            super().do_GET()
    def _proxy(self, method):
        body = None
        if method == "POST":
            length = int(self.headers.get("Content-Length", "0")); body = self.rfile.read(length)
        req = Request(UPSTREAM + self.path, data=body, method=method)
        req.add_header("Origin", "https://app.kelvara.xyz")
        if self.headers.get("Content-Type"): req.add_header("Content-Type", self.headers["Content-Type"])
        try:
            with urlopen(req, timeout=30) as response:
                data = response.read(); self.send_response(response.status)
                for key in ("Content-Type", "Cache-Control"):
                    if response.headers.get(key): self.send_header(key, response.headers[key])
                self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
        except Exception as exc:
            self.send_error(502, "HAOS upstream unavailable: " + str(exc))
    def log_message(self, fmt, *args): print(fmt % args)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--port", type=int, default=7780); ap.add_argument("--bind", default="127.0.0.1"); args = ap.parse_args()
    ThreadingHTTPServer((args.bind, args.port), Handler).serve_forever()
