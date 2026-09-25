import map from "@/data/city-map.json";
import type { MarketCode } from "@/lib/markets";

type MarketMap = {
  width: number;
  height: number;
  projection: { minLon: number; maxLat: number; kx: number; scale: number; padding: number };
  regions: Record<string, { name: string; d: string }>;
};

const MAPS = map as Record<MarketCode, MarketMap>;

export function marketMap(market: MarketCode): MarketMap {
  return MAPS[market];
}

export function regionName(market: MarketCode, region: string): string {
  return MAPS[market].regions[region]?.name ?? "";
}

/** Gleiche Projektion wie scripts/build_city_map.py. */
export function project(market: MarketCode, lat: number, lon: number) {
  const { minLon, maxLat, kx, scale, padding } = MAPS[market].projection;
  return { x: padding + (lon - minLon) * kx * scale, y: padding + (maxLat - lat) * scale };
}

/** Umrisskasten einer Region in Kartenkoordinaten, für Mini-Silhouetten. */
export function regionBox(market: MarketCode, region: string) {
  const numbers = MAPS[market].regions[region]?.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [0, 0, 1, 1];
  const xs = numbers.filter((_, index) => index % 2 === 0);
  const ys = numbers.filter((_, index) => index % 2 === 1);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}
