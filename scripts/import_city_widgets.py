#!/usr/bin/env python3
"""Import the proven public ICONY activity frame for each city page."""

from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PAGES_PATH = ROOT / "data" / "public-pages.json"
OUTPUT_PATH = ROOT / "data" / "city-widgets.json"
USER_AGENT = "christlich-verliebt-public-widget-import/1.0"

MARKET_CONTRACT = {
    "de": {"domain": "christlich-verliebt.de", "id": "christlichverliebt", "ctr": "49", "postcode": r"[0-9]{5}"},
    "at": {"domain": "christlich-verliebt.at", "id": "christlichverliebtat", "ctr": "43", "postcode": r"[0-9]{4}"},
    "ch": {"domain": "christlich-verliebt.ch", "id": "christlichverliebtch", "ctr": "41", "postcode": r"[0-9]{4}"},
}


def validate_source_url(url: str, market: str, path: str) -> None:
    contract = MARKET_CONTRACT[market]
    parsed = urlparse(url)
    if (
        url != f"https://{contract['domain']}{path}"
        or parsed.scheme != "https"
        or parsed.netloc != contract["domain"]
        or parsed.path != path
        or parsed.params
        or parsed.query
        or parsed.fragment
        or "#" in url
    ):
        raise ValueError(f"Unexpected legacy source URL for {market}:{path}")


def validate_widget_url(url: str, market: str) -> tuple[str, str]:
    contract = MARKET_CONTRACT[market]
    postcode_pattern = contract["postcode"]
    canonical_pattern = (
        rf"https://js\.icony\.com/frame/\?h=300&id={re.escape(contract['id'])}"
        rf"&pc=CE302F&z=({postcode_pattern})&ds=&ctr={contract['ctr']}&it=1"
    )
    match = re.fullmatch(canonical_pattern, url)
    if not match:
        raise ValueError(f"Invalid ICONY widget URL for {market}")
    return url, match.group(1)


def extract_widget_url(html: str, market: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    frames = soup.find_all("iframe")
    if len(frames) != 1:
        raise ValueError(f"Expected exactly one iframe, found {len(frames)}")
    src = str(frames[0].get("src") or "")
    if not src:
        raise ValueError("The sole iframe has no src")
    return validate_widget_url(src, market)


def import_page(page: dict) -> dict:
    market = str(page["market"])
    path = str(page["path"])
    source_url = str(page["sourceUrl"])
    validate_source_url(source_url, market, path)
    response = None
    for attempt in range(4):
        response = requests.get(
            source_url,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
            timeout=30,
            allow_redirects=False,
        )
        if response.status_code == 200:
            break
        if response.status_code not in {429, 500, 502, 503, 504} or attempt == 3:
            raise RuntimeError(f"Unexpected HTTP {response.status_code} for {source_url}")
        time.sleep(1.5 * (attempt + 1))
    assert response is not None
    widget_url, postcode = extract_widget_url(response.text, market)
    return {
        "market": market,
        "path": path,
        "postcode": postcode,
        "sourceUrl": source_url,
        "widgetUrl": widget_url,
    }


def main() -> None:
    pages = json.loads(PAGES_PATH.read_text(encoding="utf-8"))["pages"]
    locations = [page for page in pages if page["family"] == "location"]
    if len(locations) != 51:
        raise RuntimeError(f"Expected 51 location pages, found {len(locations)}")

    records: list[dict] = []
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(import_page, page): page for page in locations}
        for future in as_completed(futures):
            page = futures[future]
            try:
                record = future.result()
                records.append(record)
                print(f"IMPORTED {record['market']} {record['path']} postcode={record['postcode']}")
            except Exception as error:
                failures.append(f"{page['market']}:{page['path']}: {error}")

    if failures:
        raise RuntimeError("City widget import failed:\n" + "\n".join(sorted(failures)))
    records.sort(key=lambda item: (item["market"], item["path"]))
    if len({(record["market"], record["path"]) for record in records}) != len(locations):
        raise RuntimeError("Duplicate or missing city widget routes")
    OUTPUT_PATH.write_text(
        json.dumps({"schemaVersion": 1, "widgets": records}, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"WIDGETS={len(records)}")


if __name__ == "__main__":
    main()
