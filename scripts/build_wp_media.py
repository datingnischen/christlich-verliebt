"""Bildmaße der Magazin-Beitragsbilder für den WordPress-kompatiblen REST-Endpunkt.

Liest data/public-pages.json und data/editorial-pages.json, misst jedes heroImage der Magazin-Artikel in public/
und schreibt data/wp-media.json (Pfad -> Breite, Höhe, MIME-Typ, Dateigröße).
Aufruf: python scripts/build_wp_media.py
"""
from __future__ import annotations

import json
import mimetypes
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    pages = []
    for name in ("public-pages.json", "editorial-pages.json"):
        pages += json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))["pages"]
    media: dict[str, dict] = {}
    for page in pages:
        hero = page.get("heroImage")
        if page.get("family") != "magazine" or not hero:
            continue
        file = ROOT / "public" / hero.lstrip("/")
        with Image.open(file) as image:
            width, height = image.size
        media[hero] = {
            "width": width,
            "height": height,
            "mime": mimetypes.guess_type(file.name)[0] or "image/jpeg",
            "bytes": file.stat().st_size,
        }
    out = ROOT / "data" / "wp-media.json"
    out.write_text(json.dumps(dict(sorted(media.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(media)} Beitragsbilder -> {out}")


if __name__ == "__main__":
    main()
