import Image from "next/image";
import { Hero, ItAuthorBox } from "@/components/it-pages";
import { IT_CITIES, IT_HOME, IT_PLATFORM, IT_PLATFORM_ITALIAN, itAuthorUrl, itCityUrl, itMagazineUrl, itPublicUrl } from "@/lib/it-pilot";
import { IT_ARTICLES, IT_MAGAZINE, formatItDate, type ItArticle } from "@/lib/it-magazine";
import { staticAsset } from "@/lib/static-asset";
import styles from "./city-page.module.css";
import hub from "./it-hubs.module.css";

/** Übersicht /incontri/: alle Tessiner Städte (wie /partnersuche/ auf christlich-verliebt). */
export function ItCitiesPage() {
  return <main className={styles.page}>
    <Hero crumbs={[{ label: "Svizzera italiana", href: itPublicUrl() }, { label: "Incontri in Ticino", href: null }]} badge="Ticino · Svizzera" title="Incontri in Ticino per single cristiani" lead="Incontri in Ticino con chi condivide la tua fede: scegli la tua città e trovi chiese, comunità, idee per un primo appuntamento e profili reali di single cristiani della tua zona." primary="Conosci single cristiani" image={IT_HOME.heroImage} imageAlt={IT_HOME.heroImageAlt} />
    <section id="guida" className={hub.grid} aria-label="Città in Ticino">
      {IT_CITIES.map((city) => <article key={city.slug} className={hub.tile}>
        <Image src={staticAsset(city.heroImage)} alt={city.heroImageAlt} width={640} height={360} sizes="(max-width: 640px) 100vw, 360px" />
        <div>
          <p className={styles.eyebrow}>{city.region}</p>
          <h2><a href={itCityUrl(city.slug)}>Single cristiani a {city.name}</a></h2>
          <p>{city.description}</p>
        </div>
      </article>)}
    </section>
  </main>;
}

function ArticleTile({ article }: { article: ItArticle }) {
  return <article className={hub.tile}>
    <Image src={staticAsset(article.heroImage)} alt={article.heroImageAlt} width={640} height={360} sizes="(max-width: 640px) 100vw, 360px" />
    <div>
      <p className={styles.eyebrow}>{article.category}</p>
      <h2><a href={itMagazineUrl(article.slug)}>{article.title}</a></h2>
      <p>{article.description}</p>
      <p className={hub.meta}>Aggiornato il {formatItDate(article.modified)} · {article.readingMinutes} min di lettura</p>
    </div>
  </article>;
}

export function Crumbs({ items }: { items: { label: string; href: string | null }[] }) {
  return <nav className={hub.crumbs} aria-label="Percorso di navigazione">
    <ol>{items.map((item) => <li key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>)}</ol>
  </nav>;
}

/** Magazin-Übersicht /magazine/. */
export function ItMagazinePage() {
  return <main className={`${styles.page} ${hub.magazine}`}>
    <header className={hub.head}>
      <Crumbs items={[{ label: "Svizzera italiana", href: itPublicUrl() }, { label: "Magazine", href: null }]} />
      <p className={styles.eyebrow}>Magazine</p>
      <h1>{IT_MAGAZINE.title}</h1>
      <p className={hub.lead}>{IT_MAGAZINE.lead}</p>
    </header>
    <section className={hub.grid} aria-label="Articoli">
      {IT_ARTICLES.map((article) => <ArticleTile key={article.slug} article={article} />)}
    </section>
  </main>;
}

/** Magazinartikel /magazine/<articolo>/ mit „Aggiornato il …“ und eingeklappten Quellen am Ende. */
export function ItArticlePage({ article }: { article: ItArticle }) {
  const more = IT_ARTICLES.filter((entry) => entry.slug !== article.slug).slice(0, 3);
  return <main className={`${styles.page} ${hub.magazine}`}>
    <article className={hub.article}>
      <header className={hub.head}>
        <Crumbs items={[{ label: "Svizzera italiana", href: itPublicUrl() }, { label: "Magazine", href: itMagazineUrl() }, { label: article.title, href: null }]} />
        <p className={styles.eyebrow}>{article.category}</p>
        <h1>{article.title}</h1>
        <p className={hub.lead}>{article.lead}</p>
        <p className={hub.meta}>di <a href={itAuthorUrl()}>{article.author}</a> · Aggiornato il <time dateTime={article.modified}>{formatItDate(article.modified)}</time> · {article.readingMinutes} min di lettura</p>
      </header>
      <figure className={hub.figure}>
        <Image src={staticAsset(article.heroImage)} alt={article.heroImageAlt} width={1600} height={900} sizes="(max-width: 860px) 100vw, 820px" priority />
        <figcaption>Immagine illustrativa generata con IA</figcaption>
      </figure>
      <div className={`${styles.prose} ${hub.body}`}>
        {article.sections.map((section) => <section key={section.heading}>
          <h2>{section.heading}</h2>
          <div dangerouslySetInnerHTML={{ __html: section.html }} />
        </section>)}
      </div>
      <ItAuthorBox />
      <aside className={hub.cta}>
        <h2>Single cristiani nella tua zona</h2>
        <p>Registrazione, profili e messaggi si trovano sulla piattaforma svizzera christlich-verliebt.ch{IT_PLATFORM_ITALIAN ? "" : ", per ora in lingua tedesca: la versione italiana è in costruzione"}.</p>
        <a className={styles.buttonPrimary} href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">Iscriviti gratis</a>
      </aside>
      {article.sources.length ? <details className={hub.sources}>
        <summary>Fonti e trasparenza</summary>
        <ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} rel="noopener">{source.title}</a></li>)}</ul>
      </details> : null}
    </article>
    {more.length ? <section className={hub.grid} aria-label="Altri articoli">{more.map((entry) => <ArticleTile key={entry.slug} article={entry} />)}</section> : null}
  </main>;
}
