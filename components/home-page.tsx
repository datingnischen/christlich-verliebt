import Image from "next/image";
import { CityIcon } from "@/components/city-icons";
import { HUB_FONT, HUB_LABEL_ROOM, HubMap } from "@/components/city-map";
import { CtaBand } from "@/components/city-page";
import { hubRegions, placeLabels } from "@/lib/city-hub";
import { marketCities, sectionIcon } from "@/lib/city-page";
import { getPage, locationName, registrationUrl, selectPageImage, type PublicPage } from "@/lib/content";
import { homeTeasers, parseHomeContent } from "@/lib/home";
import { getMarket, previewPath, publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import styles from "./home-page.module.css";

// Größte Städte je Markt als Fotokacheln auf der Startseite.
const FEATURED_CITIES: Record<MarketCode, string[]> = {
  de: ["berlin", "hamburg", "muenchen", "nordrhein-westfalen/koeln", "frankfurt-am-main", "stuttgart"],
  at: ["wien", "graz", "linz", "salzburg", "innsbruck", "klagenfurt"],
  ch: ["zuerich", "basel", "bern", "luzern", "st-gallen", "winterthur"],
};

export function HomePage({ page }: { page: PublicPage }) {
  const market = getMarket(page.market);
  const register = registrationUrl(page);
  const hero = selectPageImage(page);
  const content = parseHomeContent(page);
  const hub = getPage(page.market, "/partnersuche/") ?? page;
  const cities = marketCities(hub);
  const regions = hubRegions(hub);
  const pins = placeLabels(hub, cities, HUB_FONT, HUB_LABEL_ROOM);
  const featured = FEATURED_CITIES[page.market].map(slug => getPage(page.market, `/partnersuche/${slug}/`)).filter((city): city is PublicPage => Boolean(city?.heroImage));
  const teasers = homeTeasers(page.market);
  const inCountry = page.market === "ch" ? "in der Schweiz" : `in ${market.countryName}`;
  const guideHub = page.market === "de" ? "/magazin/" : "/ratgeber/";

  return <main className={styles.page}>
    <section className={styles.hero}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {hero ? <img className={styles.heroImage} src={hero} alt="" width={1280} height={720} fetchPriority="high" /> : null}
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>♥ Die Singlebörse für Christen {inCountry}</p>
          <h1>{page.heroTitle}</h1>
          {page.description ? <p className={styles.heroLead}>{page.description}</p> : null}
          <div className={styles.heroActions}>
            <a className={styles.buttonPrimary} href={register}>Kostenlos registrieren</a>
            <a className={styles.buttonGhost} href="#regionen">Singles in Deiner Nähe</a>
          </div>
        </div>
        <aside className={styles.steps} aria-labelledby="so-gehts">
          <p className={styles.eyebrow}>So einfach geht&apos;s</p>
          <h2 id="so-gehts">In drei Schritten zum ersten Kennenlernen</h2>
          <ol>
            <li><span>1</span><div><strong>Kostenlos registrieren</strong><small>Profil in Ruhe anlegen – die Basis-Mitgliedschaft kostet nichts.</small></div></li>
            <li><span>2</span><div><strong>Glauben &amp; Werte zeigen</strong><small>Erzähle, was Dir wichtig ist – Fragenflirt und Matching helfen beim Finden.</small></div></li>
            <li><span>3</span><div><strong>Christliche Singles treffen</strong><small>Schreib Menschen aus Deiner Region, die Deine Werte teilen.</small></div></li>
          </ol>
          <a className={styles.buttonPrimary} href={register}>Jetzt kostenlos starten</a>
        </aside>
      </div>
    </section>

    <ul className={styles.trust}>
      <li><CityIcon name="shield" /><a href={publicUrl(page.market, "/redaktionelle-kontrolle.html")}><strong>Profile von Hand geprüft</strong><small>Redaktionelle Kontrolle</small></a></li>
      <li><CityIcon name="check" /><a href={publicUrl(page.market, "/kostenlose-basis-mitgliedschaft.html")}><strong>Kostenlos starten</strong><small>Basis-Mitgliedschaft</small></a></li>
      <li><CityIcon name="people" /><a href={publicUrl(page.market, "/hilfe/")}><strong>Persönlicher Support</strong><small>Echte Menschen helfen Dir</small></a></li>
      <li><CityIcon name="pin" /><a href="#regionen"><strong>{cities.length} Städte {inCountry}</strong><small>mit lokalen Tipps</small></a></li>
    </ul>

    <section id="regionen" className={styles.regions} aria-labelledby="regionen-titel">
      <div className={styles.regionsCopy}>
        <p className={styles.eyebrow}>Christliche Singles vor Ort</p>
        <h2 id="regionen-titel">Liebe beginnt oft ganz in der Nähe</h2>
        <p>Treffpunkte, Gemeinden und Ideen fürs erste Date: Für {cities.length} Städte in {regions.length} {page.market === "ch" ? "Kantonen" : "Bundesländern"} haben wir lokale Tipps zusammengestellt.</p>
        <ul className={styles.cityTiles}>
          {featured.map(city => <li key={city.path}><a href={previewPath(city.market, city.path)}>
            <Image src={staticAsset(city.heroImage!)} alt="" width={360} height={260} sizes="(max-width: 640px) 45vw, 200px" />
            <span>{locationName(city)}</span>
          </a></li>)}
        </ul>
        <a className={styles.buttonDark} href={previewPath(page.market, "/partnersuche/")}>Alle {cities.length} Städte ansehen <CityIcon name="arrow" /></a>
      </div>
      <figure className={styles.mapCard}>
        <HubMap market={page.market} pins={pins} regionsWithCities={new Set(regions.map(region => region.code))} title={`Karte: christliche Partnersuche ${inCountry}`} />
      </figure>
    </section>

    {content.intro ? <section className={styles.intro}>
      {content.intro.heading ? <h2>{content.intro.heading}</h2> : null}
      <div className={styles.prose} dangerouslySetInnerHTML={{ __html: content.intro.html }} />
    </section> : null}

    <section className={styles.expert}>
      <Image src={staticAsset("/brand/christian-m-haas.jpg")} alt="Christian M. Haas" width={160} height={160} />
      <div>
        <p className={styles.eyebrow}>Begleitet von einem Experten</p>
        <p><strong>Christian M. Haas</strong> ist Datingexperte für werteorientierte Partnersuche und hilft christlichen Singles, Gleichgesinnte mit Herz und Glauben zu finden.</p>
        <a href={page.market === "de" ? previewPath("de", "/magazin/christian-m-haas/") : `${publicUrl("de", "/magazin/christian-m-haas")}/`}>Mehr über Christian M. Haas <CityIcon name="arrow" /></a>
      </div>
    </section>

    {content.sections.length ? <section className={styles.topics} aria-label="Christliche Partnersuche im Überblick">
      {content.sections.map(section => <article key={section.id} id={section.id} className={styles.card}>
        {section.heading ? <div className={styles.cardHead}><span className={styles.cardIcon}><CityIcon name={sectionIcon(section.heading)} /></span><h2>{section.heading}</h2></div> : null}
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: section.html }} />
      </article>)}
    </section> : null}

    {teasers.length ? <section className={styles.teasers} aria-labelledby="ratgeber-titel">
      <div className={styles.teasersHead}>
        <div><p className={styles.eyebrow}>{page.market === "de" ? "Magazin" : "Ratgeber"}</p><h2 id="ratgeber-titel">Lesenswert für christliche Singles</h2></div>
        <a href={previewPath(page.market, guideHub)}>Alle Artikel <CityIcon name="arrow" /></a>
      </div>
      <ul>
        {teasers.map(article => <li key={article.path}><a href={previewPath(article.market, article.path)}>
          {article.heroImage ? <Image src={staticAsset(article.heroImage)} alt="" width={640} height={400} sizes="(max-width: 960px) 100vw, 380px" /> : null}
          <strong>{article.heroTitle}</strong>
          <span>Weiterlesen <CityIcon name="arrow" /></span>
        </a></li>)}
      </ul>
    </section> : null}

    <CtaBand market={page.market} register={register} heading="Bereit, jemanden kennenzulernen, der Deinen Glauben teilt?" />

    {content.credits.length ? <p className={styles.credits}>Bilder: {content.credits.map((url, index) => <a key={url} href={url} target="_blank" rel="nofollow noopener">Pixabay {index + 1}</a>)}</p> : null}
  </main>;
}
