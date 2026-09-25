import { CityFinder } from "@/components/city-finder";
import { HUB_FONT, HUB_LABEL_ROOM, HubMap, RegionShape } from "@/components/city-map";
import { CtaBand } from "@/components/city-page";
import { CitySearchFallback } from "@/components/city-search-fallback";
import { hubRegions, parseHubContent, placeLabels } from "@/lib/city-hub";
import { marketCities, type GuideSection } from "@/lib/city-page";
import { registrationUrl, type PublicPage } from "@/lib/content";
import { getMarket, previewPath, publicUrl } from "@/lib/markets";
import styles from "./city-page.module.css";

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** „Christliche Partnersuche in Österreich: Alle Städte im Überblick“: Hauptteil groß, Rest als Unterzeile. */
function splitTitle(title: string): [string, string | null] {
  const match = title.match(/^(.{8,}?)\s+[–-]\s+(.+)$/) ?? title.match(/^(.{8,}?):\s+(.+)$/);
  return match ? [match[1], match[2]] : [title, null];
}

function HubText({ sections }: { sections: GuideSection[] }) {
  return <div className={styles.hubText}>
    {sections.map(section => section.heading
      ? <article key={section.id} id={section.id} className={styles.card}>
        <h2>{section.heading}</h2>
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: section.html }} />
      </article>
      : <div key={section.id} className={`${styles.card} ${styles.prose}`} dangerouslySetInnerHTML={{ __html: section.html }} />)}
  </div>;
}

export function CityHub({ page }: { page: PublicPage }) {
  const market = getMarket(page.market);
  const register = registrationUrl(page);
  const content = parseHubContent(page);
  const regions = hubRegions(page);
  const cities = marketCities(page);
  const pins = placeLabels(page, cities, HUB_FONT, HUB_LABEL_ROOM);
  const [regionOne, regionMany] = page.market === "ch" ? ["Kanton", "Kantone"] : ["Bundesland", "Bundesländer"];
  const inCountry = page.market === "ch" ? "in der Schweiz" : `in ${market.countryName}`;
  const [titleMain, titleSub] = splitTitle(page.heroTitle);
  const shapes = Object.fromEntries(regions.map(region => [region.code, <RegionShape key={region.code} market={page.market} region={region.code} />]));
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: publicUrl(page.market) },
          { "@type": "ListItem", position: 2, name: "Partnersuche", item: page.canonical },
        ],
      },
      {
        "@type": "ItemList",
        name: `Christliche Partnersuche ${inCountry}: Städte`,
        itemListElement: cities.map((city, index) => ({ "@type": "ListItem", position: index + 1, url: city.page.canonical, name: city.page.title })),
      },
    ],
  };

  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }} />

    <section className={`${styles.hero} ${styles.hubHero}`}>
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <nav className={styles.breadcrumbs} aria-label="Brotkrumen">
            <ol><li><a href={previewPath(page.market)}>Start</a></li><li><span aria-current="page">Partnersuche</span></li></ol>
          </nav>
          <p className={styles.heroEyebrow}>Christliche Partnersuche vor Ort · {market.countryName}</p>
          <h1>{titleMain}{titleSub ? <span>{titleSub}</span> : null}</h1>
          {page.description ? <p className={styles.heroLead}>{page.description}</p> : null}
          <ul className={styles.hubStats}>
            <li><strong>{cities.length}</strong> Städte</li>
            <li><strong>{regions.length}</strong> {regions.length === 1 ? regionOne : regionMany}</li>
            <li><strong>kostenlos</strong> anmelden</li>
          </ul>
          <div className={styles.heroActions}>
            <a className={styles.buttonPrimary} href="#staedte">Deine Stadt finden</a>
            <a className={styles.buttonGhost} href={register}>Kostenlos registrieren</a>
          </div>
        </div>
        <figure className={`${styles.mapCard} ${styles.hubMapCard}`}>
          <HubMap market={page.market} pins={pins} regionsWithCities={new Set(regions.map(region => region.code))} title={`Karte: christliche Partnersuche ${inCountry}, alle Stadtseiten`} />
          <figcaption>Stadt antippen und direkt loslegen</figcaption>
        </figure>
      </div>
    </section>

    {content.before.length ? <section className={content.introImage ? styles.hubIntro : undefined}>
      {content.introImage ? <div className={styles.hubIntroImage} dangerouslySetInnerHTML={{ __html: content.introImage }} /> : null}
      <HubText sections={content.before} />
    </section> : null}

    <section id="staedte" className={styles.hubFinder} aria-labelledby="staedte-titel">
      <div className={styles.hubFinderHead}>
        <p className={styles.eyebrow}>{cities.length} Stadtseiten {inCountry}</p>
        <h2 id="staedte-titel">Finde christliche Singles in Deiner Stadt</h2>
        <p>Jede Stadtseite zeigt Treffpunkte, Gemeinden und Ideen fürs erste Date – und wer in Deiner Nähe gerade sucht.</p>
      </div>
      <CityFinder regions={regions} shapes={shapes} regionLabel={regionOne} />
    </section>

    <div className={styles.hubFallback}>
      {page.family === "location-hub" ? <CitySearchFallback market={page.market} /> : null}
    </div>

    {content.after.length ? <HubText sections={content.after} /> : null}
    {content.credit ? <p className={styles.hubCredit}>Bild: <a href={content.credit} target="_blank" rel="nofollow noopener">Pixabay</a></p> : null}

    <CtaBand market={page.market} register={register} heading={`Bereit für Dein erstes Date ${inCountry}?`} />
  </main>;
}
