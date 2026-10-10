import http.server
import importlib.util
import json
import pathlib
import threading
import unittest
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).parent
spec = importlib.util.spec_from_file_location("local_server", ROOT / "local_server.py")
assert spec and spec.loader
local_server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(local_server)


class FakeUpstream(http.server.BaseHTTPRequestHandler):
    seen_authorization = None
    seen_network = None
    seen_genesis = None

    def do_GET(self):
        FakeUpstream.seen_authorization = self.headers.get("Authorization")
        FakeUpstream.seen_network = self.headers.get("X-Kelvara-Network")
        FakeUpstream.seen_genesis = self.headers.get("X-Kelvara-Genesis")
        if self.path == "/api/protection/status":
            body = json.dumps({"error": "Authentication required"}).encode()
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
        else:
            body = b"<html>not api json</html>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        pass


class LocalProxyAuthTests(unittest.TestCase):
    def setUp(self):
        self.upstream = http.server.ThreadingHTTPServer(("127.0.0.1", 0), FakeUpstream)
        self.upstream_thread = threading.Thread(target=self.upstream.serve_forever, daemon=True)
        self.upstream_thread.start()
        self.proxy = http.server.ThreadingHTTPServer(("127.0.0.1", 0), local_server.Handler)
        self.proxy_thread = threading.Thread(target=self.proxy.serve_forever, daemon=True)
        self.proxy_thread.start()
        self.previous_upstream = local_server.UPSTREAM
        local_server.UPSTREAM = f"http://127.0.0.1:{self.upstream.server_port}"

    def tearDown(self):
        local_server.UPSTREAM = self.previous_upstream
        self.proxy.shutdown()
        self.upstream.shutdown()
        self.proxy.server_close()
        self.upstream.server_close()

    def proxy_url(self, path):
        return f"http://127.0.0.1:{self.proxy.server_port}{path}"

    def test_authenticated_protection_request_reaches_upstream_and_preserves_json_401(self):
        request = urllib.request.Request(
            self.proxy_url("/api/protection/status"),
            headers={"Authorization": "Bearer handoff-token", "X-Kelvara-Network": "mainnet-beta", "X-Kelvara-Genesis": "fixture-genesis"},
        )
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(request, timeout=2)
        response = caught.exception
        self.assertEqual(response.status, 401)
        self.assertEqual(response.headers.get_content_type(), "application/json")
        self.assertEqual(json.load(response)["error"], "Authentication required")
        self.assertEqual(FakeUpstream.seen_authorization, "Bearer handoff-token")
        self.assertEqual(FakeUpstream.seen_network, "mainnet-beta")
        self.assertEqual(FakeUpstream.seen_genesis, "fixture-genesis")

    def test_non_json_upstream_body_is_relayed_without_proxy_json_decode(self):
        response = urllib.request.urlopen(self.proxy_url("/api/html"), timeout=2)
        self.assertEqual(response.status, 200)
        self.assertEqual(response.headers.get_content_type(), "text/html")
        self.assertIn(b"not api json", response.read())

    def test_upstream_transport_failure_is_bounded_json_502(self):
        local_server.UPSTREAM = "http://127.0.0.1:1"
        request = urllib.request.Request(self.proxy_url("/api/protection/status"))
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(request, timeout=2)
        response = caught.exception
        self.assertEqual(response.status, 502)
        self.assertEqual(response.headers.get_content_type(), "application/json")
        self.assertEqual(json.load(response), {"error": "HAOS upstream unavailable"})
        self.assertNotIn("handoff", response.read().decode("utf-8", "ignore"))


if __name__ == "__main__":
    unittest.main()
