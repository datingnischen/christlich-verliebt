"use client";

import Image from "next/image";
import { useState } from "react";
import type { HubRegion } from "@/lib/city-hub";
import styles from "./city-page.module.css";

const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/ß/g, "ss");

/** Städtesuche mit Filter; ohne JavaScript bleiben alle Karten und Links sichtbar. */
export function CityFinder({ regions, shapes, regionLabel }: { regions: HubRegion[]; shapes: Record<string, React.ReactNode>; regionLabel: string }) {
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());
  const visible = regions
    .map(region => ({ ...region, cities: region.cities.filter(city => !q || normalize(city.name).includes(q) || normalize(region.name).includes(q)) }))
    .filter(region => region.cities.length);

  return <div className={styles.finder}>
    <label className={styles.finderSearch}>
      <span className={styles.srOnly}>Stadt oder {regionLabel} suchen</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Stadt oder ${regionLabel} suchen …`} autoComplete="off" />
    </label>
    <div className={styles.regionGrid}>
      {visible.map(region => <section key={region.code} className={styles.regionCard} aria-labelledby={`region-${region.code}`}>
        <header>
          <span className={styles.regionIcon}>{shapes[region.code]}</span>
          <div><h3 id={`region-${region.code}`}>{region.name}</h3><p>{region.cities.length === 1 ? "1 Stadtseite" : `${region.cities.length} Stadtseiten`}</p></div>
        </header>
        <ul>
          {region.cities.map(city => <li key={city.href}><a href={city.href} className={styles.cityTile}>
            {city.image ? <Image src={city.image} alt="" width={104} height={104} sizes="52px" /> : <span />}
            <span><small>Christliche Singles in</small><strong>{city.name}</strong></span>
            <i aria-hidden="true">→</i>
          </a></li>)}
        </ul>
      </section>)}
      {!visible.length ? <p className={styles.finderEmpty}>Für „{query}“ gibt es noch keine eigene Stadtseite – mit der <a href="#stadt-fehlt">individuellen Suche</a> findest Du trotzdem christliche Singles in Deiner Nähe.</p> : null}
    </div>
  </div>;
}
