import { CityIcon } from "@/components/city-icons";
import { CityMap, RegionShape } from "@/components/city-map";
import { CityStickyCta } from "@/components/city-sticky-cta";
import { cityGeo } from "@/lib/city-geo";
import { regionName } from "@/lib/city-map";
import { marketCities, nearestCities, parseCityContent, sectionIcon } from "@/lib/city-page";
import { getCityImageCredit, getCityWidget, locationName, registrationUrl, selectPageImage, type PublicPage } from "@/lib/content";
import { getMarket, previewPath, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import styles from "./city-page.module.css";

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replaceAll(String.fromCharCode(0x2028), "\\u2028")
    .replaceAll(String.fromCharCode(0x2029), "\\u2029");
}

/** „Christliche Singles in Zürich – Treffpunkte …“: Ortsteil groß, Rest als Unterzeile. */
function splitTitle(title: string): [string, string | null] {
  const match = title.match(/^(.{8,}?)\s+[–-]\s+(.+)$/) ?? title.match(/^(.{8,}?):\s+(.+)$/);
  return match ? [match[1], match[2]] : [title, null];
}

export function CityPage({ page }: { page: PublicPage }) {
  const city = locationName(page);
  const market = getMarket(page.market);
  const register = registrationUrl(page);
  const hub = previewPath(page.market, "/partnersuche/");
  const heroImage = selectPageImage(page);
  const wikimediaCredit = getCityImageCredit(page);
  const cityWidget = getCityWidget(page);
  const content = parseCityContent(page);
  const geo = cityGeo(page.market, page.path);
  const region = geo ? regionName(page.market, geo.region) : "";
  const cities = marketCities(page);
  const nearest = nearestCities(page, 5);
  const maxKm = Math.max(...nearest.map(item => item.km), 1);
  const related = content.related.length >= 3
    ? content.related
    : [...content.related, ...nearestCities(page, 12).slice(5).filter(item => !content.related.some(link => link.page.path === item.page.path)).map(item => ({ page: item.page, label: `Christliche Singles in ${locationName(item.page)}` }))].slice(0, 4);
  const toc = content.sections.filter(section => section.heading);
  const [titleMain, titleSub] = splitTitle(page.heroTitle);
  const crumbs = [
    { label: "Start", href: previewPath(page.market), url: publicUrl(page.market) },
    { label: "Partnersuche", href: hub, url: `${publicUrl(page.market, "/partnersuche")}/` },
    { label: city, href: null, url: page.canonical },
  ];
  const breadcrumbGraph = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.label, item: crumb.url })),
  };

  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbGraph) }} />

    <section className={styles.hero}>
      {heroImage
        // eslint-disable-next-line @next/next/no-img-element
        ? <img className={styles.heroImage} src={heroImage} alt={`${city}: Stadtansicht`} width={1280} height={720} fetchPriority="high" />
        : null}
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <nav className={styles.breadcrumbs} aria-label="Brotkrumen">
            <ol>{crumbs.map(crumb => <li key={crumb.label}>{crumb.href ? <a href={crumb.href}>{crumb.label}</a> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol>
          </nav>
          {geo ? <span className={styles.regionBadge}><RegionShape market={page.market} region={geo.region} />{region} · {market.countryName}</span> : null}
          <h1>{titleMain}{titleSub ? <span>{titleSub}</span> : null}</h1>
          {page.description ? <p className={styles.heroLead}>{page.description}</p> : null}
          <div className={styles.heroActions}>
            <a className={styles.buttonPrimary} href={register}>Singles in {city} finden</a>
            <a className={styles.buttonGhost} href="#guide">Tipps lesen</a>
          </div>
        </div>
        {geo ? <figure className={styles.mapCard}>
          <CityMap market={page.market} cities={cities} activePath={page.path} activeRegion={geo.region} title={`Lage von ${city} in ${market.countryName === "Schweiz" ? "der Schweiz" : market.countryName}`} />
          <figcaption><strong>{city}</strong> · {region}</figcaption>
        </figure> : null}
      </div>
      {wikimediaCredit
        ? <p className={styles.heroCredit}>Bild: <a href={wikimediaCredit.sourcePage} target="_blank" rel="nofollow noopener">{wikimediaCredit.artist} · {wikimediaCredit.license}</a></p>
        : content.credit ? <p className={styles.heroCredit}>Bild: <a href={content.credit} target="_blank" rel="nofollow noopener">Pixabay</a></p> : null}
    </section>

    <div className={styles.facts} role="list">
      <div role="listitem"><CityIcon name="pin" /><span>Suche rund um<strong>{city}</strong></span></div>
      {nearest[0] ? <div role="listitem"><CityIcon name="route" /><span>Nächste Stadtseite<strong>{locationName(nearest[0].page)} · {nearest[0].km} km</strong></span></div> : null}
      <div role="listitem"><CityIcon name="clock" /><span>Lesezeit<strong>{content.minutes} Minuten</strong></span></div>
      <div role="listitem"><CityIcon name="check" /><span>Anmeldung<strong>kostenlos</strong></span></div>
    </div>

    {cityWidget ? <section className={styles.widget} data-icony-city-widget>
      <div className={styles.widgetCopy}>
        <p className={styles.live}><i aria-hidden="true" />Gerade in Deiner Nähe aktiv</p>
        <h2>Wer in {city} gerade sucht</h2>
        <p>Christliche Singles aus {city} und Umgebung, denen Glaube, gemeinsame Werte und eine ehrliche Beziehung wichtig sind.</p>
        <a className={styles.buttonPrimary} href={register}>Jetzt kostenlos kennenlernen</a>
      </div>
      <div className={styles.widgetFrame}>
        <iframe
          src={cityWidget.widgetUrl}
          title={`Aktive christliche Singles aus ${city} und Umgebung`}
          width="440"
          height="300"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </section> : null}

    {content.fit ? <section className={styles.fit} aria-labelledby="christen-fit-faktor">
      <div className={styles.fitScore}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" className={styles.fitTrack} />
          <circle cx="60" cy="60" r="50" className={styles.fitValue} pathLength={100} strokeDasharray={`${content.fit.score} 100`} />
        </svg>
        <strong>{content.fit.score}<small>/100</small></strong>
      </div>
      <div className={styles.fitCopy}>
        <p className={styles.eyebrow}>⭐ Christen-Fit-Faktor</p>
        <h2 id="christen-fit-faktor">So gut passt {city} für gläubige Singles</h2>
        {content.fit.introHtml ? <p dangerouslySetInnerHTML={{ __html: content.fit.introHtml }} /> : null}
        {content.fit.methodHref ? <a href={content.fit.methodHref}>Wie der Christen-Fit-Faktor entsteht <CityIcon name="arrow" /></a> : null}
      </div>
      <ul className={styles.fitValues}>
        {content.fit.values.map(value => <li key={value.label}>
          <div className={styles.fitValueHead}><span aria-hidden="true">{value.emoji}</span><strong>{value.label}</strong><b>{value.score}<small>/100</small></b></div>
          <span className={styles.fitBar} style={{ ["--w" as string]: `${value.score}%` }}><span /></span>
          <p dangerouslySetInnerHTML={{ __html: value.html }} />
        </li>)}
      </ul>
    </section> : null}

    <section id="guide" className={styles.guide}>
      <aside className={styles.toc}>
        <p className={styles.eyebrow}>Dein Stadt-Guide</p>
        <h2>{city} für christliche Singles</h2>
        {toc.length ? <ol>{toc.map(section => <li key={section.id}><a href={`#${section.id}`}><CityIcon name={sectionIcon(section.heading)} /><span>{section.heading}</span></a></li>)}</ol> : null}
        <a className={styles.buttonPrimary} href={register}>Kostenlos anmelden</a>
      </aside>
      <div className={styles.sections}>
        {content.sections.map(section => section.heading
          ? <article key={section.id} id={section.id} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardIcon}><CityIcon name={sectionIcon(section.heading)} /></span>
              <span className={styles.cardNumber}>{String(toc.indexOf(section) + 1).padStart(2, "0")}</span>
            </div>
            <h2>{section.heading}</h2>
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: section.html }} />
          </article>
          : <div key={section.id} className={`${styles.prose} ${styles.intro}`} dangerouslySetInnerHTML={{ __html: section.html }} />)}
      </div>
    </section>

    {nearest.length ? <section className={styles.neighbours} aria-labelledby="nachbarn">
      <div>
        <p className={styles.eyebrow}>Nachbarn in Reichweite</p>
        <h2 id="nachbarn">Liebe kennt keine Stadtgrenze</h2>
        <p>Christliche Singles aus {city} schauen gern auch in die Nachbarschaft. So weit ist es (Luftlinie) bis zur nächsten Stadtseite:</p>
      </div>
      <ol className={styles.distances}>
        {nearest.map(item => <li key={item.page.path}>
          <a href={previewPath(item.page.market, item.page.path)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.page.heroImage ? <img src={staticAsset(item.page.heroImage)} alt="" width={56} height={56} loading="lazy" decoding="async" /> : <span className={styles.distanceThumb} />}
            <span className={styles.distanceName}>{locationName(item.page)}<small>{regionName(page.market, item.geo.region)}</small></span>
            <span className={styles.distanceBar} style={{ ["--w" as string]: `${Math.max(8, (item.km / maxKm) * 100)}%` }}><span /></span>
            <span className={styles.distanceKm}>{item.km} km</span>
          </a>
        </li>)}
      </ol>
    </section> : null}

    <section className={styles.related} aria-labelledby="weitere-staedte">
      <h2 id="weitere-staedte">Diese Städte könnten auch interessant für Dich sein:</h2>
      <ul>
        {related.map(link => <li key={link.page.path}><a className={styles.chip} href={previewPath(link.page.market, link.page.path)}>{link.label}<span aria-hidden="true">→</span></a></li>)}
        <li><a className={`${styles.chip} ${styles.chipAll}`} href={hub}>Alle Städte<span aria-hidden="true">→</span></a></li>
      </ul>
    </section>

    <section className={styles.ctaBand}>
      <div className={styles.ctaCopy}>
        <p className={styles.eyebrow}>Glaube verbindet</p>
        <h2>Bereit für Dein erstes Date in {city}?</h2>
        <ul className={styles.trust}>
          <li><CityIcon name="shield" /><a href={publicUrl(page.market, "/redaktionelle-kontrolle.html")}>Redaktionell kontrollierte Profile</a></li>
          <li><CityIcon name="check" /><a href={publicUrl(page.market, "/kostenlose-basis-mitgliedschaft.html")}>Kostenlose Basis-Mitgliedschaft</a></li>
          <li><CityIcon name="heart" /><a href={publicUrl(page.market, "/unsere-erfolgsgeschichten.html")}>Paare, die sich hier gefunden haben</a></li>
        </ul>
        <a className={styles.buttonPrimary} href={register}>Zur kostenlosen Registrierung</a>
      </div>
      <a className={styles.radar} href={register}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={staticAsset("/brand/umkreissuche-radar.svg")} alt="Umkreissuche: Christliche Singles in Deiner Nähe – kostenlos anmelden" width={320} height={480} loading="lazy" decoding="async" />
      </a>
    </section>

    <CityStickyCta href={register} city={city} />
  </main>;
}
