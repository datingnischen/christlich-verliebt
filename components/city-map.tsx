import { marketMap, project, regionBox } from "@/lib/city-map";
import type { PlacedPin } from "@/lib/city-hub";
import type { CityPoint } from "@/lib/city-page";
import { locationName } from "@/lib/content";
import { previewPath, type MarketCode } from "@/lib/markets";
import styles from "./city-page.module.css";

// Platz links und rechts der Karte, damit Randbeschriftungen nicht abgeschnitten werden.
const LABEL_ROOM = 90;
export const HUB_LABEL_ROOM = 70;
export const HUB_FONT = 19;

type Props = { market: MarketCode; cities: CityPoint[]; activePath: string; activeRegion: string; title: string };

export function CityMap({ market, cities, activePath, activeRegion, title }: Props) {
  const map = marketMap(market);
  const unit = map.width / 600;
  return <svg className={styles.map} viewBox={`${-LABEL_ROOM} 0 ${map.width + 2 * LABEL_ROOM} ${map.height}`} role="img" aria-label={title}>
    <title>{title}</title>
    <defs>
      <radialGradient id="city-pin-glow">
        <stop offset="0%" stopColor="#ce302f" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ce302f" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g className={styles.mapRegions}>
      {Object.entries(map.regions).map(([code, region]) => <path key={code} d={region.d} className={code === activeRegion ? styles.mapRegionActive : styles.mapRegion}><title>{region.name}</title></path>)}
    </g>
    {cities.filter(city => city.page.path !== activePath).map(city => {
      const { x, y } = project(market, city.geo.lat, city.geo.lon);
      return <a key={city.page.path} href={previewPath(market, city.page.path)} className={styles.mapPin} aria-label={`Christliche Singles in ${locationName(city.page)}`}>
        <circle cx={x} cy={y} r={6 * unit} className={styles.mapDot} />
        <text x={x} y={y - 12 * unit} textAnchor="middle" className={styles.mapHoverLabel}>{locationName(city.page)}</text>
      </a>;
    })}
    {cities.filter(city => city.page.path === activePath).map(city => {
      const { x, y } = project(market, city.geo.lat, city.geo.lon);
      const left = x > map.width * 0.62;
      return <g key={city.page.path} className={styles.mapActive}>
        <circle cx={x} cy={y} r={38 * unit} fill="url(#city-pin-glow)" className={styles.mapPulse} />
        <path d={`M${x} ${y + 10}c-10-8-17-13-17-21a9 9 0 0 1 17-4.5a9 9 0 0 1 17 4.5c0 8-7 13-17 21z`} className={styles.mapHeart} />
        <text x={left ? x - 24 : x + 24} y={y + 2} textAnchor={left ? "end" : "start"} className={styles.mapLabel}>{locationName(city.page)}</text>
      </g>;
    })}
  </svg>;
}

/** Kleine Silhouette eines Bundeslandes bzw. Kantons als Symbol. */
export function RegionShape({ market, region }: { market: MarketCode; region: string }) {
  const map = marketMap(market);
  const box = regionBox(market, region);
  const size = Math.max(box.width, box.height);
  const pad = size * 0.08;
  const x = box.x - (size - box.width) / 2 - pad;
  const y = box.y - (size - box.height) / 2 - pad;
  return <svg className={styles.regionShape} viewBox={`${x} ${y} ${size + 2 * pad} ${size + 2 * pad}`} aria-hidden="true"><path d={map.regions[region]?.d} /></svg>;
}

/** Übersichtskarte aller Stadtseiten eines Marktes, Namen ohne Überlappung gesetzt. */
export function HubMap({ market, pins, regionsWithCities, title }: { market: MarketCode; pins: PlacedPin[]; regionsWithCities: Set<string>; title: string }) {
  const map = marketMap(market);
  return <svg className={styles.hubMap} viewBox={`${-HUB_LABEL_ROOM} 0 ${map.width + 2 * HUB_LABEL_ROOM} ${map.height}`} role="img" aria-label={title}>
    <title>{title}</title>
    <g className={styles.mapRegions}>
      {Object.entries(map.regions).map(([code, region]) => <path key={code} d={region.d} className={regionsWithCities.has(code) ? styles.hubRegionActive : styles.hubRegion}><title>{region.name}</title></path>)}
    </g>
    {pins.map(pin => <a key={pin.point.page.path} href={previewPath(market, pin.point.page.path)} className={styles.hubPin} aria-label={`Christliche Singles in ${locationName(pin.point.page)}`}>
      <circle cx={pin.x} cy={pin.y} r={HUB_FONT * 0.34} className={styles.hubDot} />
      {pin.label
        ? <text x={pin.label.x} y={pin.label.y} textAnchor={pin.label.anchor} className={styles.hubLabel}>{locationName(pin.point.page)}</text>
        : <text x={pin.x} y={pin.y - HUB_FONT * 0.7} textAnchor="middle" className={styles.hubHoverLabel}>{locationName(pin.point.page)}</text>}
    </a>)}
  </svg>;
}
