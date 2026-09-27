import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { SiteSearchForm } from "@/components/site-search-form";
import { ABOUT_ROOT_PATH } from "@/lib/about";
import { getPages } from "@/lib/content";
import { getMarket, isMarketCode, MARKET_CODES, previewPath, publicUrl, type MarketCode } from "@/lib/markets";
import { buildSearchIndex, SEARCH_LIMIT, SEARCH_PATH, searchIndex, type SearchEntry } from "@/lib/search";
import pageStyles from "../../[[...slug]]/page.module.css";
import aboutStyles from "../about.module.css";
import styles from "./search.module.css";

type Props = {
  params: Promise<{ market: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export function generateStaticParams() {
  return MARKET_CODES.map(market => ({ market }));
}
export const dynamicParams = false;

// Index einmal pro Markt aus dem vorhandenen Seiten-Snapshot (data/public-pages.json) – kein Request pro Suche.
const INDEX = new Map<MarketCode, SearchEntry[]>();
function marketIndex(market: MarketCode): SearchEntry[] {
  let index = INDEX.get(market);
  if (!index) {
    index = buildSearchIndex(getPages(market));
    INDEX.set(market, index);
  }
  return index;
}

async function activeMarket(params: Props["params"]): Promise<MarketCode> {
  const { market } = await params;
  if (!isMarketCode(market)) notFound();
  return market;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const market = await activeMarket(params);
  const config = getMarket(market);
  const title = `Suche auf ${config.domain}`;
  const description = "Durchsuche Magazin, Ratgeber und die christliche Partnersuche in Deiner Region.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: publicUrl(market, SEARCH_PATH) },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const market = await activeMarket(params);
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q ?? "").trim().slice(0, 100);
  const hits = query ? searchIndex(marketIndex(market), query) : [];

  return <SiteShell market={market}>
    <main className={pageStyles.page}>
      <nav className={aboutStyles.breadcrumbs} aria-label="Breadcrumb"><ol>
        <li><a href={previewPath(market)}>Startseite</a></li>
        <li><a href={previewPath(market, ABOUT_ROOT_PATH)}>Über uns</a></li>
        <li><span aria-current="page">Suche</span></li>
      </ol></nav>
      <section className={styles.head}>
        <p className={pageStyles.eyebrow}>Suche</p>
        <h1>Was suchst Du?</h1>
        <p className={styles.intro}>Finde Artikel aus dem Magazin, Ratgeber und Tipps sowie die christliche Partnersuche in Deiner Stadt.</p>
        <SiteSearchForm market={market} query={query} autoFocus />
      </section>

      {!query
        ? <p className={styles.state}>Gib einen Begriff ein – zum Beispiel eine Stadt, „Gebet“ oder „erste Nachricht“.</p>
        : hits.length === 0
          ? <div className={styles.state}>
            <p>Zu „{query}“ haben wir leider nichts gefunden.</p>
            <p>Versuch es mit einem anderen Wort oder schau Dich in der <a href={previewPath(market, "/partnersuche/")}>Partnersuche nach Region</a> um.</p>
          </div>
          : <section aria-labelledby="treffer-title">
            <h2 id="treffer-title" className={styles.count}>{hits.length === SEARCH_LIMIT ? `Die ${SEARCH_LIMIT} besten Treffer` : `${hits.length} Treffer`} für „{query}“</h2>
            <ol className={styles.results}>
              {hits.map(hit => <li key={hit.path}>
                <a className={styles.result} href={previewPath(market, hit.path)}>
                  <span>{hit.section}</span>
                  <strong>{hit.title}</strong>
                  {hit.excerpt ? <p>{hit.excerpt}</p> : null}
                </a>
              </li>)}
            </ol>
          </section>}
    </main>
  </SiteShell>;
}
