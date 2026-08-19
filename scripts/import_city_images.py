from __future__ import annotations

import hashlib
import html
import io
import json
import re
import time
from pathlib import Path

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "city-images" / "de"
MANIFEST = ROOT / "data" / "city-image-overrides.json"
API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "christlich-verliebt migration/1.0 (public city imagery)"

CITY_FILES = {
    "/partnersuche/augsburg/": ("Augsburg", "Plaza_del_Ayuntamiento,_Augsburgo,_Alemania,_2021-06-04,_DD_32-34_HDR.jpg"),
    "/partnersuche/bochum/": ("Bochum", "Bochum_-_Rathaus+Christuskirche_(Bismarckturm)_03_ies.jpg"),
    "/partnersuche/bonn/": ("Bonn", "Bonner_Skyline.jpg"),
    "/partnersuche/bremen/": ("Bremen", "Bremen,_Rathaus_--_2021_--_6357.jpg"),
    "/partnersuche/dortmund/": ("Dortmund", "Platz_der_Deutschen_Einheit.jpg"),
    "/partnersuche/dresden/": ("Dresden", "Dresden-Frauenkirche-View.from.top.01.JPG"),
    "/partnersuche/duesseldorf/": ("Düsseldorf", "Düsseldorf_Panorama.jpg"),
    "/partnersuche/essen/": ("Essen", "Essen_2010-04-12_–_Skyline_von_der_A40_aus_-_panoramio.jpg"),
    "/partnersuche/freiburg/": ("Freiburg", "Freiburg_Schlossberg_Sonnenuntergang_Münster.jpg"),
    "/partnersuche/karlsruhe/": ("Karlsruhe", "Aerial_image_of_the_Karlsruhe_Schlossgarten_(view_from_the_south).jpg"),
    "/partnersuche/leipzig/": ("Leipzig", "Neues_Rathaus_Leipzig,_Vorderansicht.jpg"),
    "/partnersuche/magdeburg/": ("Magdeburg", "Aerial_view_of_Magdeburg.jpg"),
    "/partnersuche/mainz/": ("Mainz", "Mainzer_Dom_Blaue_Stunde_(37539430014).jpg"),
    "/partnersuche/muenster/": ("Münster", "Muenster_Innenstadt.jpg"),
    "/partnersuche/nordrhein-westfalen/koeln/": ("Köln", "Stadtbild_Köln_(50MP).jpg"),
    "/partnersuche/nuernberg/": ("Nürnberg", "Nürnberger_Burg_im_Herbst_2013.jpg"),
    "/partnersuche/paderborn/": ("Paderborn", "Rathaus_Paderborn_April_2016.jpg"),
    "/partnersuche/stuttgart/": ("Stuttgart", "Neues_Schloss_Schlossplatzspringbrunnen_Jubiläumssäule_Schlossplatz_Stuttgart_2015_01.jpg"),
    "/partnersuche/trier/": ("Trier", "Trier_Porta_Nigra_BW_3.JPG"),
    "/partnersuche/wuerzburg/": ("Würzburg", "Würzburg_(2021).jpg"),
}


def plain(value: str) -> str:
    return " ".join(re.sub(r"<[^>]+>", " ", html.unescape(value or "")).split())


def metadata() -> dict[str, dict]:
    titles = "|".join(f"File:{filename}" for _city, filename in CITY_FILES.values())
    response = requests.get(
        API,
        params={
            "action": "query",
            "format": "json",
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": 1200,
            "titles": titles,
        },
        headers={"User-Agent": USER_AGENT},
        timeout=60,
    )
    response.raise_for_status()
    pages = response.json().get("query", {}).get("pages", {}).values()
    return {page["title"].split(":", 1)[1].replace(" ", "_"): page for page in pages}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pages = metadata()
    records = []
    expected = set()
    for path, (city, filename) in sorted(CITY_FILES.items()):
        page = pages.get(filename.replace(" ", "_"))
        if not page or "imageinfo" not in page:
            raise RuntimeError(f"Wikimedia file not found: {filename}")
        info = page["imageinfo"][0]
        download_url = info.get("thumburl") or info["url"]
        for attempt in range(6):
            response = requests.get(download_url, headers={"User-Agent": USER_AGENT}, timeout=60)
            if response.status_code != 429:
                response.raise_for_status()
                break
            delay = max(float(response.headers.get("Retry-After", "0") or 0), 2 ** attempt)
            time.sleep(delay)
        else:
            raise RuntimeError(f"Wikimedia rate limit persisted for {filename}")
        with Image.open(io.BytesIO(response.content)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            image = ImageOps.fit(image, (1200, 675), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
            output = io.BytesIO()
            image.save(output, format="WEBP", quality=86, method=6)
        data = output.getvalue()
        slug = path.rstrip("/").split("/")[-1]
        local_path = f"/city-images/de/{slug}.webp"
        destination = ROOT / "public" / local_path.lstrip("/")
        destination.write_bytes(data)
        expected.add(destination)
        extra = info.get("extmetadata", {})
        license_name = plain(extra.get("LicenseShortName", {}).get("value", ""))
        artist = plain(extra.get("Artist", {}).get("value", ""))
        records.append({
            "artist": artist,
            "bytes": len(data),
            "city": city,
            "fileTitle": page["title"],
            "license": license_name,
            "licenseUrl": plain(extra.get("LicenseUrl", {}).get("value", "")),
            "localPath": local_path,
            "market": "de",
            "path": path,
            "rightsStatus": f"Wikimedia Commons {license_name}; attribution: {artist}",
            "sha256": hashlib.sha256(data).hexdigest(),
            "sourcePage": info.get("descriptionurl", ""),
            "sourceUrl": info["url"],
            "transformation": "center-cropped to 1200x675 and encoded as WebP",
        })
        print(f"IMPORTED {city}: {local_path}")
        time.sleep(1)
    for existing in OUTPUT_DIR.glob("*.webp"):
        if existing not in expected:
            existing.unlink()
    MANIFEST.write_text(
        json.dumps({"schemaVersion": 1, "images": records}, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"CITY_IMAGES={len(records)}")


if __name__ == "__main__":
    main()
