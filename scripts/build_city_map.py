"""Baut die Länderkarten (Bundesländer bzw. Kantone) für die Stadtseiten nach data/city-map.json.

Quelle: Natural Earth 1:10m Admin-1 (gemeinfrei), https://www.naturalearthdata.com/
Projektion: Plattkarte mit cos(Mittelbreite)-Stauchung, reicht für eine Übersichtskarte.
Die Städtepunkte rechnet lib/city-map.ts mit denselben Parametern.

Aufruf: python scripts/build_city_map.py [pfad/zu/ne_10m_admin_1_states_provinces.geojson]
"""

from __future__ import annotations

import json
import math
import sys
import urllib.request
from pathlib import Path

SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"
OUT = Path(__file__).resolve().parent.parent / "data" / "city-map.json"

MARKETS = {"de": "DEU", "at": "AUT", "ch": "CHE"}
REGION_NAMES = {
    "DE-BW": "Baden-Württemberg", "DE-BY": "Bayern", "DE-BE": "Berlin", "DE-BB": "Brandenburg", "DE-HB": "Bremen",
    "DE-HH": "Hamburg", "DE-HE": "Hessen", "DE-MV": "Mecklenburg-Vorpommern", "DE-NI": "Niedersachsen",
    "DE-NW": "Nordrhein-Westfalen", "DE-RP": "Rheinland-Pfalz", "DE-SL": "Saarland", "DE-SN": "Sachsen",
    "DE-ST": "Sachsen-Anhalt", "DE-SH": "Schleswig-Holstein", "DE-TH": "Thüringen",
    "AT-1": "Burgenland", "AT-2": "Kärnten", "AT-3": "Niederösterreich", "AT-4": "Oberösterreich", "AT-5": "Salzburg",
    "AT-6": "Steiermark", "AT-7": "Tirol", "AT-8": "Vorarlberg", "AT-9": "Wien",
}
WIDTH = 600
PADDING = 12
TOLERANCE = 0.9  # Kartenpixel für die Vereinfachung


def rings(geometry: dict) -> list[list[list[float]]]:
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"][0]]
    return [polygon[0] for polygon in geometry["coordinates"]]


def simplify(points: list[tuple[float, float]], tolerance: float) -> list[tuple[float, float]]:
    """Douglas-Peucker, iterativ."""
    if len(points) < 4:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        (x1, y1), (x2, y2) = points[start], points[end]
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy) or 1e-9
        best, index = 0.0, -1
        for i in range(start + 1, end):
            x, y = points[i]
            distance = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length
            if distance > best:
                best, index = distance, i
        if best > tolerance and index > 0:
            keep[index] = True
            stack += [(start, index), (index, end)]
    return [point for point, kept in zip(points, keep) if kept]


def region_name(properties: dict) -> str:
    code = properties["iso_3166_2"]
    if code in REGION_NAMES:
        return REGION_NAMES[code]
    return properties["name_de"]  # Kantone: „Kanton Zürich“


def main() -> None:
    if len(sys.argv) > 1:
        features = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))["features"]
    else:
        with urllib.request.urlopen(SOURCE, timeout=120) as response:
            features = json.loads(response.read().decode("utf-8"))["features"]

    out: dict[str, dict] = {}
    for market, adm0 in MARKETS.items():
        regions = {f["properties"]["iso_3166_2"]: f for f in features if f["properties"]["adm0_a3"] == adm0}
        points = [p for f in regions.values() for ring in rings(f["geometry"]) for p in ring]
        min_lon, max_lon = min(p[0] for p in points), max(p[0] for p in points)
        min_lat, max_lat = min(p[1] for p in points), max(p[1] for p in points)
        kx = math.cos(math.radians((min_lat + max_lat) / 2))
        scale = (WIDTH - 2 * PADDING) / ((max_lon - min_lon) * kx)
        height = round((max_lat - min_lat) * scale + 2 * PADDING)

        def project(lon: float, lat: float) -> tuple[float, float]:
            return (PADDING + (lon - min_lon) * kx * scale, PADDING + (max_lat - lat) * scale)

        states = {}
        for code, feature in sorted(regions.items()):
            parts = []
            for ring in rings(feature["geometry"]):
                projected = [project(lon, lat) for lon, lat in ring[:-1]]
                # Geschlossene Ringe an der Mitte teilen, sonst fallen Start und Ende zusammen.
                half = len(projected) // 2
                coords = simplify(projected[: half + 1], TOLERANCE)[:-1] + simplify(projected[half:] + projected[:1], TOLERANCE)[:-1]
                if len(coords) < 4:
                    continue
                parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in coords) + "Z")
            if parts:
                states[code] = {"name": region_name(feature["properties"]), "d": "".join(parts)}

        out[market] = {
            "width": WIDTH,
            "height": height,
            "projection": {"minLon": min_lon, "maxLat": max_lat, "kx": kx, "scale": scale, "padding": PADDING},
            "regions": states,
        }
        print(f"{market}: {len(states)} Regionen, {WIDTH}x{height}")

    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"-> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
