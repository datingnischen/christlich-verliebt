import html
import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "import_city_widgets.py"
spec = importlib.util.spec_from_file_location("city_widget_importer", MODULE_PATH)
assert spec and spec.loader
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class CityWidgetContractTests(unittest.TestCase):
    VALID_DE = "https://js.icony.com/frame/?h=300&id=christlichverliebt&pc=CE302F&z=10178&ds=&ctr=49&it=1"

    def test_accepts_exact_legacy_contract_after_html_decoding(self):
        fixture = f'<iframe src="{html.escape(self.VALID_DE, quote=True)}"></iframe>'
        self.assertEqual(importer.extract_widget_url(fixture, "de"), (self.VALID_DE, "10178"))

    def test_rejects_noncanonical_widget_url_variants(self):
        variants = [
            self.VALID_DE.replace("https://", "http://"),
            self.VALID_DE.replace("js.icony.com", "JS.ICONY.COM"),
            self.VALID_DE.replace("js.icony.com", "js.icony.com."),
            self.VALID_DE.replace("js.icony.com", "js.icony.com:443"),
            self.VALID_DE.replace("js.icony.com", "js.icony.com:"),
            self.VALID_DE.replace("js.icony.com", "user@js.icony.com"),
            self.VALID_DE.replace("/frame/", "/frame/;ignored"),
            self.VALID_DE + "#",
            self.VALID_DE + "#fragment",
            self.VALID_DE + "&extra=1",
            self.VALID_DE.replace("&it=1", "&it=1&it=1"),
            self.VALID_DE.replace("h=300&id=", "id=christlichverliebt&h=300&id=").replace("id=christlichverliebt&id=", "id="),
            self.VALID_DE.replace("h=300", "h=%33%30%30"),
            self.VALID_DE.replace("z=10178", "z=%31%30%31%37%38"),
            self.VALID_DE.replace("z=10178", "z=1017８"),
            self.VALID_DE.replace("id=christlichverliebt", "id=christlichverliebtat"),
            self.VALID_DE.replace("ctr=49", "ctr=43"),
            self.VALID_DE.replace("CE302F", "ce302f"),
            " " + self.VALID_DE,
            self.VALID_DE.replace("https://js", "https:\t//js"),
        ]
        for candidate in variants:
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    importer.validate_widget_url(candidate, "de")

    def test_requires_exactly_one_iframe_total(self):
        valid = f'<iframe src="{html.escape(self.VALID_DE, quote=True)}"></iframe>'
        for fixture in ["<p>none</p>", valid + "<iframe></iframe>", valid + valid, "<iframe></iframe>"]:
            with self.subTest(fixture=fixture):
                with self.assertRaises(ValueError):
                    importer.extract_widget_url(fixture, "de")

    def test_applies_documented_freiburg_postcode_override_fail_closed(self):
        legacy = self.VALID_DE.replace("z=10178", "z=21729")
        overrides = importer.load_postcode_overrides()
        corrected, postcode = importer.apply_postcode_override(
            legacy, "21729", "de", "/partnersuche/freiburg/", overrides
        )
        self.assertEqual(postcode, "79098")
        self.assertIn("&z=79098&", corrected)
        with self.assertRaisesRegex(ValueError, "Legacy postcode changed"):
            importer.apply_postcode_override(
                legacy, "21728", "de", "/partnersuche/freiburg/", overrides
            )

    def test_rejects_unexpected_legacy_source_urls(self):
        path = "/partnersuche/berlin/"
        importer.validate_source_url("https://christlich-verliebt.de/partnersuche/berlin/", "de", path)
        for candidate in [
            "http://christlich-verliebt.de/partnersuche/berlin/",
            "https://christlich-verliebt.de:443/partnersuche/berlin/",
            "https://user@christlich-verliebt.de/partnersuche/berlin/",
            "https://christlich-verliebt.de/partnersuche/berlin/?x=1",
            "https://christlich-verliebt.de/partnersuche/berlin/#x",
            "https://christlich-verliebt.at/partnersuche/berlin/",
        ]:
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    importer.validate_source_url(candidate, "de", path)


if __name__ == "__main__":
    unittest.main()
