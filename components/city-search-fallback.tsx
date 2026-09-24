import { individualSearchUrl, type MarketCode } from "@/lib/markets";
import styles from "./city-search-fallback.module.css";

// Hinweis unter der Städteübersicht: Wer seine Stadt nicht findet, sucht individuell nach Ort und Umkreis.
export function CitySearchFallback({ market }: { market: MarketCode }) {
  return <aside className={styles.fallback} aria-labelledby="stadt-fehlt">
    <div className={styles.copy}>
      <p className={styles.eyebrow}>Individuelle Suche</p>
      <h2 id="stadt-fehlt">Deine Stadt fehlt? Gemeinsamer Glaube kennt keine Ortsgrenzen.</h2>
      <p>Nicht jeder Ort hat eine eigene Seite – christliche Singles, denen Glaube und gemeinsame Werte wichtig sind, gibt es trotzdem auch in Deiner Region. In der individuellen Suche legst Du Ort, Umkreis und Alter selbst fest und siehst, wer in Deiner Nähe auf der Suche ist.</p>
    </div>
    <a className={styles.button} href={individualSearchUrl(market)}>Zur individuellen Suche</a>
  </aside>;
}
