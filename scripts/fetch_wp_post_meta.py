"""Einmaliger Abzug der echten WordPress-IDs und Daten der Magazin-Beiträge.

Der WordPress-Server liefert unter https://christlich-verliebt.de/magazin/wp-json/ bis zur Ablösung noch die
Original-Beiträge. Dieses Skript sichert ID, Datum, Änderungsdatum, Autor-ID, Kategorien, Schlagwörter und
Beitragsbild-ID in data/wp-posts.json, damit der aus den Repo-Dateien erzeugte REST-Endpunkt
(lib/wp-rest-compat.ts) dieselben IDs und Zeitstempel ausliefert wie vorher.
Aufruf: python scripts/fetch_wp_post_meta.py (nur solange die WordPress-REST noch erreichbar ist)
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://christlich-verliebt.de/magazin/wp-json/wp/v2"


def fetch(route: str, fields: str) -> list[dict]:
    rows: list[dict] = []
    page = 1
    while True:
        response = requests.get(f"{BASE}/{route}", params={"per_page": 100, "page": page, "_fields": fields}, timeout=30)
        response.raise_for_status()
        rows.extend(response.json())
        if page >= int(response.headers.get("X-WP-TotalPages", "1")):
            return rows
        page += 1


def main() -> None:
    posts = fetch("posts", "id,slug,date,modified,author,featured_media,categories,tags,link")
    tags = fetch("tags", "id,name,slug,count,description")
    snapshot = {
        "source": BASE,
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "posts": sorted(posts, key=lambda post: post["id"]),
        "tags": sorted(tags, key=lambda tag: tag["id"]),
    }
    out = ROOT / "data" / "wp-posts.json"
    out.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(posts)} Beiträge, {len(tags)} Schlagwörter -> {out}")


if __name__ == "__main__":
    main()
