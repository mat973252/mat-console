"""Loopback-only server for three explicitly named, sanitized status exports."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

FILES = {"agent-platform.json": "Agent Platform", "relay.json": "Relay", "agent-permit4j.json": "AgentPermit4j"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", default=".local-status")
    parser.add_argument("--port", type=int, default=4174)
    args = parser.parse_args()
    root = Path(args.directory).resolve()
    origin = "http://127.0.0.1:5173"

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            path = urlsplit(self.path).path
            if path == "/":
                body = Path(__file__).with_name("workbench.html").read_bytes()
                content_type = "text/html; charset=utf-8"
            elif path[1:] in FILES:
                try:
                    body = (root / path[1:]).read_bytes()
                except OSError:
                    self.send_error(404)
                    return
                content_type = "application/json; charset=utf-8"
            else:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

    print(f"Workbench entries: http://127.0.0.1:{args.port}/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
