import Image from "next/image";
import { CityIcon } from "@/components/city-icons";
import { RegionShape } from "@/components/city-map";
import { PreviewLinks } from "@/components/preview-links";
import { IT_CITIES, IT_HOME, IT_PLATFORM, itPublicUrl, itWidgetUrl, nearestItCities, type ItCity, type ItSection } from "@/lib/it-pilot";
import { getMarket, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import shell from "./site-shell.module.css";
import styles from "./city-page.module.css";
import itStyles from "./it-pages.module.css";

/** Kopf und Fuß der italienischen Variante. lang="it-CH" am Wrapper, weil das Root-Layout statisch lang="de" setzt. */
export function ItShell({ children }: { children: React.ReactNode }) {
  const config = getMarket("ch");
  return <div className={shell.shell} lang="it-CH">
    <PreviewLinks />
    <header className={shell.header}>
      <div className={shell.topbar}>Incontri cristiani con rispetto, sicurezza e valori comuni</div>
      <div className={shell.headerInner}>
        <a className={shell.brand} href={itPublicUrl()}>
          <Image src={staticAsset(config.logoPath)} alt={`${config.domain} Logo`} width={300} height={48} priority />
        </a>
        <nav aria-label="Navigazione principale" className={shell.nav}>
          <a href={itPublicUrl()}>Pagina iniziale</a>
          {IT_CITIES.map((city) => <a key={city.slug} href={itPublicUrl(city.slug)}>{city.name}</a>)}
        </nav>
        <div className={shell.actions}>
          <a className={shell.login} href={IT_PLATFORM.loginUrl}>Accedi</a>
          <a className={shell.primary} href={IT_PLATFORM.registrationUrl}>Iscriviti gratis</a>
        </div>
      </div>
    </header>
    {children}
    <footer className={shell.footer}>
      <div className={shell.footerCta}>
        <div><span>La fede unisce</span><h2>Trova una persona che condivide i tuoi valori.</h2></div>
        <a href={IT_PLATFORM.registrationUrl}>Iscriviti gratis ora</a>
      </div>
      <div className={shell.footerGrid}>
        <section><h3>Città in Ticino</h3>{IT_CITIES.map((city) => <a key={city.slug} href={itPublicUrl(city.slug)}>Single cristiani a {city.name}</a>)}</section>
        <section><h3>Account</h3><a href={IT_PLATFORM.registrationUrl}>Registrazione gratuita</a><a href={IT_PLATFORM.loginUrl}>Accedi</a></section>
        <section><h3>Lingua</h3><a href={publicUrl("ch")} hrefLang="de-CH" lang="de-CH">Deutsch</a><a href={itPublicUrl()} hrefLang="it-CH">Italiano</a></section>
        <section><h3>Servizio</h3><a href={publicUrl("ch", "/datenschutz.html")}>Protezione dei dati</a><a href={publicUrl("ch", "/impressum.html")}>Impressum</a></section>
      </div>
      <p className={shell.legal}>Su christlich-verliebt.ch contano valori comuni, uno scambio rispettoso e la sincerità nel conoscersi.</p>
    </footer>
  </div>;
}

function Sections({ sections, kicker, title }: { sections: ItSection[]; kicker: string; title: string }) {
  return <section id="guida" className={styles.guide}>
    <aside className={styles.toc}>
      <p className={styles.eyebrow}>{kicker}</p>
      <h2>{title}</h2>
      <ol>{sections.map((section, index) => <li key={section.heading}><a href={`#capitolo-${index + 1}`}><CityIcon name={section.icon} /><span>{section.heading}</span></a></li>)}</ol>
      <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl}>Iscriviti gratis</a>
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
        <a href={itPublicUrl(city.slug)}>
          <Image src={staticAsset(city.heroImage)} alt="" width={96} height={96} sizes="48px" className={itStyles.cityThumb} />
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

function Hero({ crumbs, badge, title, lead, primary, image, imageAlt }: { crumbs: { label: string; href: string | null }[]; badge: string; title: string; lead: string; primary: string; image: string; imageAlt: string }) {
  return <section className={`${styles.hero} ${itStyles.hero}`}>
    <Image className={styles.heroImage} src={staticAsset(image)} alt={imageAlt} width={1600} height={900} sizes="100vw" priority />
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
          <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl}>{primary}</a>
          <a className={styles.buttonGhost} href="#guida">Leggi la guida</a>
        </div>
      </div>
    </div>
    <p className={`${styles.heroCredit} ${itStyles.heroCredit}`}>Immagine illustrativa generata con IA</p>
  </section>;
}

export function ItHomePage() {
  return <main className={styles.page}>
    <Hero crumbs={[{ label: "Svizzera italiana", href: null }]} badge="Ticino · Svizzera" title={IT_HOME.title} lead={IT_HOME.lead} primary="Conosci single cristiani" image={IT_HOME.heroImage} imageAlt={IT_HOME.heroImageAlt} />
    <CityList cities={IT_CITIES.map((city) => ({ city }))} heading="Scegli la tua città" intro="Guide per incontri cristiani a Lugano, Bellinzona, Locarno, Mendrisio e Chiasso, con profili reali dalla tua zona." />
    <Sections sections={IT_HOME.sections} kicker="La guida" title="Fede e amore in Ticino" />
    <section className={styles.related} aria-labelledby="domande">
      <h2 id="domande">Domande frequenti</h2>
      {IT_HOME.faq.map((entry) => <details key={entry.question} className={styles.card}><summary><strong>{entry.question}</strong></summary><p>{entry.answer}</p></details>)}
    </section>
  </main>;
}

export function ItCityPage({ city }: { city: ItCity }) {
  const nearest = nearestItCities(city.slug);
  return <main className={styles.page}>
    <Hero crumbs={[{ label: "Svizzera italiana", href: itPublicUrl() }, { label: city.name, href: null }]} badge={`${city.region} · Ticino`} title={city.title} lead={city.lead} primary={`Conosci single cristiani a ${city.name}`} image={city.heroImage} imageAlt={city.heroImageAlt} />

    <div className={styles.facts} role="list">
      <div role="listitem"><CityIcon name="pin" /><span>Ricerca intorno a<span className={styles.strongText}>{city.name}</span></span></div>
      {nearest[0] ? <div role="listitem"><CityIcon name="route" /><span>Città più vicina<span className={styles.strongText}>{nearest[0].city.name} · {nearest[0].km} km</span></span></div> : null}
      <div role="listitem"><CityIcon name="check" /><span>Iscrizione<span className={styles.strongText}>gratuita</span></span></div>
    </div>

    <section className={styles.widget} data-icony-city-widget>
      <div className={styles.widgetCopy}>
        <p className={styles.live}><i aria-hidden="true" />Attivi vicino a te</p>
        <h2>Chi cerca ora vicino a {city.name}</h2>
        <p>Single cristiani da {city.name} e dintorni per cui fede, valori comuni e una relazione sincera sono importanti.</p>
        <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl}>Iscriviti e conosci</a>
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
    <CityList cities={nearest} heading="L'amore non conosce confini comunali" intro={`Le altre guide in Ticino, in linea d'aria da ${city.name}:`} />
  </main>;
}
