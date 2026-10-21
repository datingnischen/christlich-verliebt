import Image from "next/image";
import { CityIcon } from "@/components/city-icons";
import { RegionShape } from "@/components/city-map";
import { marketMap, project, regionBox } from "@/lib/city-map";
import { PreviewLinks } from "@/components/preview-links";
import { IT_ABOUT_SLUG, IT_AUTHOR, IT_CANTON_NAMES, IT_CITIES, IT_GUIDE_COUNT, IT_HOME, IT_PLATFORM, IT_PLATFORM_ITALIAN, itAuthorUrl, itCityUrl, itMagazineUrl, itPublicUrl, itWidgetUrl, nearestItCities, type ItCity, type ItGuide, type ItSection } from "@/lib/it-pilot";
import { getMarket, MARKET_CODES, publicUrl } from "@/lib/markets";
import { Flag } from "@/components/site-shell";
import { staticAsset } from "@/lib/static-asset";
import shell from "./site-shell.module.css";
import styles from "./city-page.module.css";
import itStyles from "./it-pages.module.css";

/** Kopf und Fuß der italienischen Variante; <html lang="it-CH"> kommt aus app/(italiano)/layout.tsx. */
export function ItShell({ children }: { children: React.ReactNode }) {
  return <div className={shell.shell} lang="it-CH">
    <PreviewLinks />
    <header className={shell.header}>
      <div className={shell.topbar}>Incontri cristiani con rispetto, sicurezza e valori comuni</div>
      <div className={shell.headerInner}>
        <a className={shell.brand} href={itPublicUrl()}>
          <Image src={staticAsset("/brand/single-cristiani-ch.svg")} alt="single-cristiani.ch – Incontri per single cristiani" width={300} height={75} priority />
        </a>
        <nav aria-label="Navigazione principale" className={shell.nav}>
          <a href={itPublicUrl()}>Pagina iniziale</a>
          {IT_CITIES.map((city) => <a key={city.slug} href={itCityUrl(city.slug)}>{city.name}</a>)}
          <a href={itMagazineUrl()}>Magazine</a>
          <a href={itPublicUrl(IT_ABOUT_SLUG)}>Chi siamo</a>
        </nav>
        <div className={shell.actions}>
          <a className={shell.login} href={IT_PLATFORM.loginUrl}>Accedi</a>
          <a className={shell.primary} href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">Iscriviti gratis</a>
        </div>
      </div>
    </header>
    {IT_PLATFORM_ITALIAN ? null : <p className={itStyles.notice} role="note">
      <strong>La piattaforma in italiano è in costruzione.</strong> Registrazione, profili e messaggi sono già disponibili in tedesco su{" "}
      <a href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">christlich-verliebt.ch</a>.
    </p>}
    {children}
    <footer className={shell.footer}>
      <div className={shell.footerCta}>
        <div><span>La fede unisce</span><h2>Trova una persona che condivide i tuoi valori.</h2></div>
        <a href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">Iscriviti gratis ora</a>
      </div>
      <div className={shell.footerGrid}>
        <section><h3>Città in Ticino</h3>{IT_CITIES.map((city) => <a key={city.slug} href={itCityUrl(city.slug)}>Single cristiani a {city.name}</a>)}<a href={itCityUrl()}>Incontri in Ticino</a><a href={itMagazineUrl()}>Magazine</a></section>
        <section><h3>Account</h3><a href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">{IT_PLATFORM_ITALIAN ? "Registrazione gratuita" : "Registrazione gratuita (in tedesco)"}</a><a href={IT_PLATFORM.loginUrl}>Accedi</a></section>
        <section><h3>Lingua e Paesi</h3><a href={itPublicUrl()} hrefLang="it-CH">Italiano · Ticino</a><a href={publicUrl("ch")} hrefLang="de-CH" lang="de-CH">Deutsch · Svizzera</a>
          <span className={itStyles.flagsLabel}>christlich-verliebt in tedesco</span>
          <div className={shell.flags}>{MARKET_CODES.map((code) => <a key={code} href={publicUrl(code)} hrefLang={getMarket(code).locale} aria-label={`${IT_COUNTRY_NAMES[code]}: ${getMarket(code).domain}`} title={`${IT_COUNTRY_NAMES[code]} · ${getMarket(code).domain}`}><Flag market={code} /></a>)}</div>
        </section>
        <section><h3>Servizio</h3><a href={itPublicUrl(IT_ABOUT_SLUG)}>Chi siamo</a><a href={itPublicUrl("note-legali")}>Note legali</a><a href={itPublicUrl("privacy")}>Protezione dei dati</a><a href={publicUrl("ch", "/datenschutz.html")} hrefLang="de-CH">Protezione dei dati della piattaforma</a></section>
      </div>
      <p className={shell.legal}>single-cristiani.ch è la guida in italiano per la piattaforma svizzera christlich-verliebt.ch: registrazione, profili e messaggi si trovano su christlich-verliebt.ch{IT_PLATFORM_ITALIAN ? "" : ", per ora in lingua tedesca"}.</p>
    </footer>
  </div>;
}

/** Ländernamen für die Flaggen im Footer (Links auf christlich-verliebt.de/.at/.ch). */
const IT_COUNTRY_NAMES: Record<string, string> = { de: "Germania", at: "Austria", ch: "Svizzera" };

const FACT_ICONS = ["people", "church", "spark", "route"] as const;

/** Belegte Kennzahlen mit Stand statt allgemeiner Hinweise. */
function Facts({ guide }: { guide: ItGuide }) {
  return <div className={styles.facts} role="list">
    {guide.facts.slice(0, 4).map((fact, index) => <div role="listitem" key={fact.label}>
      <CityIcon name={FACT_ICONS[index]} />
      <span>{fact.label}<span className={styles.strongText}>{fact.value}</span><small className={itStyles.factNote}>{fact.note}</small></span>
    </div>)}
  </div>;
}

function Places({ guide, city }: { guide: ItGuide; city: string }) {
  if (!guide.places.length) return null;
  return <section className={itStyles.block} aria-labelledby="luoghi-di-fede">
    <p className={styles.eyebrow}>Chiese e comunità</p>
    <h2 id="luoghi-di-fede">Luoghi di fede a {city}</h2>
    <p className={itStyles.blockIntro}>Gli orari di messe e culti cambiano durante l&apos;anno: li trovi aggiornati sui siti delle parrocchie e delle comunità.</p>
    <ul className={itStyles.placeGrid}>
      {guide.places.map((place) => <li key={place.name} className={itStyles.place}>
        <span className={itStyles.tag}>{place.denomination}</span>
        <h3>{place.name}</h3>
        <p className={itStyles.address}><CityIcon name="pin" />{place.address}</p>
        <p>{place.text}</p>
        {place.url ? <a href={place.url} rel="noopener" target="_blank">Sito ufficiale<span className={itStyles.srOnly}>: {place.name}</span></a> : null}
      </li>)}
    </ul>
  </section>;
}

function Communities({ guide, heading }: { guide: ItGuide; heading: string }) {
  if (!guide.communities.length) return null;
  return <section className={itStyles.block} aria-labelledby="comunita">
    <p className={styles.eyebrow}>Conoscere persone con valori simili</p>
    <h2 id="comunita">{heading}</h2>
    <ul className={itStyles.list}>
      {guide.communities.map((entry) => <li key={entry.name}>
        <CityIcon name="people" />
        <div><h3>{entry.url ? <a href={entry.url} rel="noopener" target="_blank">{entry.name}</a> : entry.name}</h3><p>{entry.text}</p></div>
      </li>)}
    </ul>
  </section>;
}

function Events({ guide, heading }: { guide: ItGuide; heading: string }) {
  if (!guide.events.length) return null;
  return <section className={itStyles.block} aria-labelledby="calendario">
    <p className={styles.eyebrow}>Calendario dell&apos;anno</p>
    <h2 id="calendario">{heading}</h2>
    <ol className={itStyles.timeline}>
      {guide.events.map((event) => <li key={event.name}>
        <span className={itStyles.when}><CityIcon name="calendar" />{event.when}</span>
        <h3>{event.name}</h3>
        <p>{event.text}</p>
      </li>)}
    </ol>
  </section>;
}

function DateSpots({ guide, city }: { guide: ItGuide; city: string }) {
  if (!guide.dateSpots.length) return null;
  return <section className={itStyles.block} aria-labelledby="primo-incontro">
    <p className={styles.eyebrow}>Idee concrete</p>
    <h2 id="primo-incontro">Dove incontrarsi a {city}</h2>
    <ul className={`${itStyles.list} ${itStyles.listTwo}`}>
      {guide.dateSpots.map((spot) => <li key={spot.name}>
        <CityIcon name="cup" />
        <div><h3>{spot.name}</h3><p className={itStyles.address}>{spot.where}</p><p>{spot.text}</p></div>
      </li>)}
    </ul>
  </section>;
}

function Faq({ guide, heading }: { guide: ItGuide; heading: string }) {
  if (!guide.faq.length) return null;
  return <section className={styles.related} aria-labelledby="domande">
    <h2 id="domande">{heading}</h2>
    {guide.faq.map((entry) => <details key={entry.question} className={styles.card}><summary><strong>{entry.question}</strong></summary><p>{entry.answer}</p></details>)}
  </section>;
}

/** Quellen standardmässig zugeklappt, klein und am Seitenende (Projektregel Städteseiten). */
function Sources({ guide }: { guide: ItGuide }) {
  if (!guide.sources.length) return null;
  return <details className={itStyles.sources}>
    <summary>Fonti e verifica dei dati ({guide.sources.length})</summary>
    <p>Le immagini in alto sono illustrazioni generate con IA.</p>
    <ol>{guide.sources.map((source) => <li key={source.url}><a href={source.url} rel="noopener" target="_blank">{source.title}</a></li>)}</ol>
  </details>;
}

function Sections({ sections, kicker, title }: { sections: ItSection[]; kicker: string; title: string }) {
  return <section id="guida" className={styles.guide}>
    <aside className={styles.toc}>
      <p className={styles.eyebrow}>{kicker}</p>
      <h2>{title}</h2>
      <ol>{sections.map((section, index) => <li key={section.heading}><a href={`#capitolo-${index + 1}`}><CityIcon name={section.icon} /><span>{section.heading}</span></a></li>)}</ol>
      <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">Iscriviti gratis</a>
    </aside>
    <div className={styles.sections}>
      {sections.map((section, index) => <article key={section.heading} id={`capitolo-${index + 1}`} className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardIcon}><CityIcon name={section.icon} /></span>
          <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
        </div>
        <h2>{section.heading}</h2>
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: section.html }} />
      </article>)}
    </div>
  </section>;
}

function CityList({ cities, heading, intro }: { cities: { city: ItCity; km?: number }[]; heading: string; intro: string }) {
  const maxKm = Math.max(...cities.map((item) => item.km ?? 0), 1);
  return <section className={styles.neighbours} aria-labelledby="citta-ticino">
    <div>
      <p className={styles.eyebrow}>Città in Ticino</p>
      <h2 id="citta-ticino">{heading}</h2>
      <p>{intro}</p>
    </div>
    <ol className={styles.distances}>
      {cities.map(({ city, km }) => <li key={city.slug}>
        <a href={itCityUrl(city.slug)}>
          {city.heroImage ? <Image src={staticAsset(city.heroImage)} alt={city.heroImageAlt} width={96} height={96} sizes="48px" className={itStyles.cityThumb} /> : <span className={styles.distanceThumb} />}
          <span className={styles.distanceName}>Single cristiani a {city.name}<small>{city.region}</small></span>
          {km !== undefined ? <>
            <span className={styles.distanceBar} style={{ ["--w" as string]: `${Math.max(8, (km / maxKm) * 100)}%` }}><span /></span>
            <span className={styles.distanceKm}>{km} km</span>
          </> : null}
        </a>
      </li>)}
    </ol>
  </section>;
}

/** Ausschnitt der Schweizer Karte auf das Tessin, mit allen fünf Stadtführern; die aktuelle Stadt hervorgehoben. */
function TicinoMap({ active }: { active?: string }) {
  const map = marketMap("ch");
  const box = regionBox("ch", "CH-TI");
  const pad = 14;
  const unit = box.height / 300;
  const current = IT_CITIES.find((city) => city.slug === active);
  return <figure className={`${styles.mapCard} ${itStyles.mapCard}`}>
    <svg className={styles.map} viewBox={`${box.x - pad - 30 * unit} ${box.y - pad} ${box.width + 2 * pad + 90 * unit} ${box.height + 2 * pad}`} role="img" aria-label={current ? `Posizione di ${current.name} in Ticino` : "Le città delle guide in Ticino"}>
      <g>
        {Object.entries(map.regions).map(([code, region]) => <path key={code} d={region.d} className={code === "CH-TI" ? itStyles.mapTicino : styles.mapRegion}><title>{IT_CANTON_NAMES[code] ?? region.name}</title></path>)}
      </g>
      {IT_CITIES.map((city) => {
        const { x, y } = project("ch", city.geo.lat, city.geo.lon);
        const left = city.slug === "locarno" || city.slug === "mendrisio";
        const isActive = city.slug === active;
        const label = <text x={left ? x - 12 * unit : x + 12 * unit} y={y + 6 * unit} textAnchor={left ? "end" : "start"} className={isActive ? itStyles.mapLabelActive : itStyles.mapLabel} style={{ fontSize: `${(isActive ? 24 : 17) * unit}px`, strokeWidth: `${5 * unit}px` }}>{city.name}</text>;
        return isActive
          ? <g key={city.slug}>
            <circle cx={x} cy={y} r={22 * unit} fill="#ce302f" opacity="0.2" className={styles.mapPulse} />
            <circle cx={x} cy={y} r={7 * unit} className={itStyles.mapActiveDot} style={{ strokeWidth: unit }} />
            {label}
          </g>
          : <a key={city.slug} href={itCityUrl(city.slug)} className={styles.mapPin} aria-label={`Single cristiani a ${city.name}`}>
            <circle cx={x} cy={y} r={5 * unit} className={styles.mapDot} style={{ strokeWidth: unit }} />
            {label}
          </a>;
      })}
    </svg>
    <figcaption>{current ? <><span className={styles.strongText}>{current.name}</span> · Canton Ticino</> : <><span className={itStyles.capitalize}>{IT_GUIDE_COUNT}</span> guide · <span className={styles.strongText}>Canton Ticino</span></>}</figcaption>
  </figure>;
}

export function Hero({ crumbs, badge, title, lead, primary, image, imageAlt, active }: { crumbs: { label: string; href: string | null }[]; badge: string; title: string; lead: string; primary: string; image: string | null; imageAlt: string; active?: string }) {
  return <section className={`${styles.hero} ${itStyles.hero}${image ? "" : ` ${itStyles.heroPlain}`}`}>
    {image ? <Image className={styles.heroImage} src={staticAsset(image)} alt={imageAlt} width={1600} height={900} sizes="100vw" priority /> : null}
    <div className={`${styles.heroShade} ${itStyles.heroShade}`} aria-hidden="true" />
    <div className={styles.heroGrid}>
      <div className={styles.heroCopy}>
        <nav className={styles.breadcrumbs} aria-label="Percorso di navigazione">
          <ol>{crumbs.map((crumb) => <li key={crumb.label}>{crumb.href ? <a href={crumb.href}>{crumb.label}</a> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol>
        </nav>
        <span className={styles.regionBadge}><RegionShape market="ch" region="CH-TI" />{badge}</span>
        <h1>{title}</h1>
        <p className={styles.heroLead}>{lead}</p>
        <div className={styles.heroActions}>
          <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">{primary}</a>
          <a className={styles.buttonGhost} href="#guida">Leggi la guida</a>
        </div>
      </div>
      <TicinoMap active={active} />
    </div>
    {image ? <p className={`${styles.heroCredit} ${itStyles.heroCredit}`}>Immagine illustrativa generata con IA</p> : null}
  </section>;
}

export function ItHomePage() {
  return <main className={styles.page}>
    <Hero crumbs={[{ label: "Svizzera italiana", href: null }]} badge="Ticino · Svizzera" title={IT_HOME.title} lead={IT_HOME.lead} primary="Conosci single cristiani" image={IT_HOME.heroImage} imageAlt={IT_HOME.heroImageAlt} />
    <Facts guide={IT_HOME.guide} />
    <CityList cities={IT_CITIES.map((city) => ({ city }))} heading="Scegli la tua città" intro="Guide per Lugano, Bellinzona, Locarno, Mendrisio, Chiasso e Biasca: chiese con indirizzo, appuntamenti dell'anno, luoghi per il primo incontro e collegamenti in treno." />
    <Sections sections={IT_HOME.sections} kicker="La guida" title="La guida al Ticino" />
    <Communities guide={IT_HOME.guide} heading="Gruppi e proposte in tutto il Ticino" />
    <Events guide={IT_HOME.guide} heading="Appuntamenti di fede in Ticino" />
    <ItCtaBand heading="Pronto per il primo incontro in Ticino?" />
    <Faq guide={IT_HOME.guide} heading="Domande frequenti" />
    <Sources guide={IT_HOME.guide} />
  </main>;
}

/** Flirtradar wie auf den deutschen Stadtseiten (CtaBand in city-page.tsx), Grafik auf Italienisch mit Tessin-Umriss, Ziel die deutsche Registrierung. */
function ItCtaBand({ heading }: { heading: string }) {
  return <section className={styles.ctaBand}>
    <div className={styles.ctaCopy}>
      <p className={styles.eyebrow}>La fede unisce</p>
      <h2>{heading}</h2>
      <ul className={styles.trust}>
        <li><CityIcon name="shield" />Profili controllati dalla redazione</li>
        <li><CityIcon name="check" />Registrazione e profilo di base gratuiti</li>
        <li><CityIcon name="pin" />Ricerca per codice postale in tutto il Ticino</li>
      </ul>
      <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">{IT_PLATFORM_ITALIAN ? "Iscriviti gratis" : "Iscriviti gratis (sito in tedesco)"}</a>
    </div>
    <a className={styles.radar} href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={staticAsset("/brand/radar-single-cristiani.svg")} alt="Ricerca in Canton Ticino: single cristiani vicino a te, iscrizione gratuita" width={320} height={480} loading="lazy" decoding="async" />
    </a>
  </section>;
}

/** Autorenkasten unter Magazinartikeln: wer schreibt, mit Link auf Chi siamo (dort Vita, Arbeitsweise, Kontakt). */
export function ItAuthorBox() {
  return <aside className={itStyles.authorBox} aria-labelledby="autore">
    <Image src={staticAsset(IT_AUTHOR.image)} alt={`Ritratto di ${IT_AUTHOR.name}`} width={80} height={96} />
    <div>
      <p className={styles.eyebrow}>Chi scrive</p>
      <h2 id="autore">{IT_AUTHOR.name}</h2>
      <p>Si occupa di online dating dal 2008 e dal 2016 collabora con la ICONY GmbH come esperto di dating di christlich-verliebt. Cura le guide per le città del Ticino e il magazine di single-cristiani.ch.</p>
      <a href={itAuthorUrl()}>Chi siamo e come lavoriamo</a>
    </div>
  </aside>;
}

export function ItCityPage({ city }: { city: ItCity }) {
  const nearest = nearestItCities(city.slug);
  return <main className={styles.page}>
    <Hero crumbs={[{ label: "Svizzera italiana", href: itPublicUrl() }, { label: "Incontri in Ticino", href: itCityUrl() }, { label: city.name, href: null }]} badge={`${city.region} · Ticino`} title={city.title} lead={city.lead} primary={`Conosci single cristiani a ${city.name}`} image={city.heroImage} imageAlt={city.heroImageAlt} active={city.slug} />

    <Facts guide={city.guide} />

    <section className={styles.widget} data-icony-city-widget>
      <div className={styles.widgetCopy}>
        <p className={styles.live}><i aria-hidden="true" />Attivi vicino a te</p>
        <h2>Chi cerca ora vicino a {city.name}</h2>
        <p>Single cristiani da {city.name} e dintorni per cui fede, valori comuni e una relazione sincera sono importanti: conoscersi con la fede come base comune, senza fretta.</p>
        <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">{IT_PLATFORM_ITALIAN ? "Iscriviti e conosci" : "Iscriviti (sito in tedesco)"}</a>
      </div>
      <div className={styles.widgetFrame}>
        <iframe
          src={itWidgetUrl(city.postcode)}
          title={`Single cristiani attivi da ${city.name} e dintorni`}
          width="440"
          height="300"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </section>

    <Sections sections={city.sections} kicker="La tua guida" title={`${city.name} per single cristiani`} />
    <Places guide={city.guide} city={city.name} />
    <Communities guide={city.guide} heading={`Comunità e gruppi a ${city.name}`} />
    <Events guide={city.guide} heading={`Appuntamenti dell'anno a ${city.name}`} />
    <DateSpots guide={city.guide} city={city.name} />
    <ItCtaBand heading={`Pronto per il primo incontro a ${city.name}?`} />
    <CityList cities={nearest} heading="L'amore non conosce confini comunali" intro={`Le altre guide in Ticino, in linea d'aria da ${city.name}:`} />
    <Faq guide={city.guide} heading={`Domande su ${city.name}`} />
    <Sources guide={city.guide} />
  </main>;
}
