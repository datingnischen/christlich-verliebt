import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "import_public_pages.py"
spec = importlib.util.spec_from_file_location("public_importer", MODULE_PATH)
assert spec and spec.loader
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class ImportSecurityTests(unittest.TestCase):
    def test_rejects_non_https_and_unapproved_hosts(self):
        with self.assertRaises(RuntimeError):
            importer.assert_public_https_url("http://christlich-verliebt.de/")
        with self.assertRaises(RuntimeError):
            importer.assert_public_https_url("https://127.0.0.1/")
        with self.assertRaises(RuntimeError):
            importer.assert_public_https_url("https://example.com/")

    def test_normalizes_encoded_and_backslash_member_media_paths(self):
        blocked = [
            "https://christlich-verliebt.de/%75ser-media/member/42.jpg",
            "https://christlich-verliebt.de/%2575ser-media/member/42.jpg",
            "https://christlich-verliebt.de/foo/%2e%2e/user-media/member/42.jpg",
            "https://christlich-verliebt.de/cms\\..\\user-media\\member\\42.jpg",
        ]
        for url in blocked:
            self.assertIn("/user-media/", importer.normalized_url_path(url))
            self.assertIsNone(importer.stable_asset_path(url, "de"))

    @patch.object(importer.socket, "getaddrinfo")
    def test_rejects_private_dns_answers(self, resolver):
        resolver.return_value = [(2, 1, 6, "", ("10.0.0.8", 443))]
        with self.assertRaisesRegex(RuntimeError, "Non-public"):
            importer.assert_public_https_url("https://christlich-verliebt.de/")

    @patch.object(importer.socket, "getaddrinfo")
    @patch.object(importer.SESSION, "get")
    def test_rejects_redirect_escape_before_second_request(self, get, resolver):
        resolver.return_value = [(2, 1, 6, "", ("93.184.216.34", 443))]
        response = importer.requests.Response()
        response.status_code = 302
        response.headers["location"] = "https://example.com/escape"
        response.url = "https://christlich-verliebt.de/"
        get.return_value = response
        with self.assertRaisesRegex(RuntimeError, "not approved"):
            importer.fetch_response("https://christlich-verliebt.de/")
        self.assertEqual(get.call_count, 1)


if __name__ == "__main__":
    unittest.main()
