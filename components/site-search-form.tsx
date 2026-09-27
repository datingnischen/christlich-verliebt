import { previewPath, type MarketCode } from "@/lib/markets";
import { SEARCH_PATH } from "@/lib/search";
import styles from "./site-search-form.module.css";

// GET-Formular auf die Seitensuche unter „Über uns“ (serverseitig gerendert, ?q=).
export function SiteSearchForm({ market, query = "", autoFocus = false }: { market: MarketCode; query?: string; autoFocus?: boolean }) {
  return <form className={styles.form} action={previewPath(market, SEARCH_PATH)} method="get" role="search">
    <label className={styles.label} htmlFor={`site-search-${market}`}>Suchbegriff</label>
    <input id={`site-search-${market}`} type="search" name="q" defaultValue={query} placeholder="Stadt, Thema oder Stichwort" maxLength={100} autoFocus={autoFocus} autoComplete="off" />
    <button type="submit">Suchen</button>
  </form>;
}
