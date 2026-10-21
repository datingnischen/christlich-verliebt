import Image from "next/image";
import { Hero, ItAuthorBox } from "@/components/it-pages";
import { IT_ABOUT_SLUG, IT_CITIES, IT_HOME, IT_PLATFORM, IT_PLATFORM_ITALIAN, itAuthorUrl, itCityUrl, itMagazineUrl, itPublicUrl } from "@/lib/it-pilot";
import { IT_ARTICLES, IT_MAGAZINE, formatItDate, type ItArticle } from "@/lib/it-magazine";
import { staticAsset } from "@/lib/static-asset";
import styles from "./city-page.module.css";
import hub from "./it-hubs.module.css";

/** Übersicht /incontri/: alle Tessiner Städte (wie /partnersuche/ auf christlich-verliebt). */
export function ItCitiesPage() {
  return <main className={styles.page}>
    <Hero crumbs={[{ label: "Svizzera italiana", href: itPublicUrl() }, { label: "Incontri in Ticino", href: null }]} badge="Ticino · Svizzera" title="Incontri in Ticino per single cristiani" lead="Incontri in Ticino con chi condivide la tua fede: scegli la tua città e trovi chiese, comunità, idee per un primo appuntamento e profili reali di single cristiani della tua zona." primary="Conosci single cristiani" image={IT_HOME.heroImage} imageAlt={IT_HOME.heroImageAlt} />
    <section className={`${styles.prose} ${hub.intro}`} aria-labelledby="come-usare">
      <h2 id="come-usare">Come usare le guide</h2>
      <p>Ogni guida è costruita allo stesso modo. Si apre con i numeri della città e del suo distretto, presi dall&apos;Ufficio di statistica del Cantone Ticino: quanti abitanti, quanti si dichiarano cattolici o riformati, quante economie domestiche sono formate da una sola persona. Seguono le chiese e le comunità con indirizzo e sito ufficiale, perché gli orari di messe e culti cambiano durante l&apos;anno e vanno letti alla fonte. Il calendario raccoglie le feste di fede e gli appuntamenti ricorrenti della zona, dalle processioni della Settimana Santa ai concerti nelle chiese; la sezione «Dove incontrarsi» propone luoghi pubblici e tranquilli per un primo caffè o una passeggiata. Chiudono le domande frequenti e, in fondo, l&apos;elenco delle fonti.</p>
      <p>Il Ticino è una regione di tradizione cattolica, con comunità riformate attive soprattutto a Lugano, Bellinzona e Locarno; allo stesso tempo oltre quattro economie domestiche su dieci sono composte da una persona sola. Le persone che cercano una relazione con la fede come base comune ci sono: la difficoltà è incontrarle fuori dalla propria cerchia. Per questo ogni guida unisce due strade, la vita di comunità e la ricerca per codice postale su christlich-verliebt.ch, la piattaforma svizzera per single cristiani a cui portano i pulsanti «Iscriviti» (per ora in tedesco).</p>
      <p>Scegli la città più vicina a te o quella in cui ti muovi per lavoro: Lugano e il Luganese, Bellinzona e le valli, Locarno e il Lago Maggiore, Mendrisio e Chiasso nel Mendrisiotto. Le distanze in Ticino sono brevi e ogni guida indica anche le città vicine, con i chilometri in linea d&apos;aria.</p>
    </section>
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
    <section className={`${styles.prose} ${hub.intro}`} aria-labelledby="di-cosa-parliamo">
      <h2 id="di-cosa-parliamo">Di che cosa parliamo</h2>
      <p>Il magazine accompagna le guide per le città del Ticino con articoli pratici per chi cerca una relazione in cui la fede non è un dettaglio. I temi ricorrenti sono tre: il primo appuntamento, cioè come parlare di fede senza trasformare l&apos;incontro in un esame; i luoghi e i modi per conoscere single cristiani, in parrocchia, nei gruppi per giovani adulti, nei pellegrinaggi e online; e la sicurezza, dalle regole per il primo incontro ai segnali della truffa dell&apos;amore descritti dalla polizia svizzera.</p>
      <p>Gli articoli nascono da fonti verificabili, indicate in fondo a ogni testo, e sono curati da Christian M. Haas, che si occupa di online dating dal 2008 e collabora con la piattaforma christlich-verliebt dal 2016. Non pubblichiamo contenuti sponsorizzati e aggiorniamo i testi quando cambiano dati, indirizzi o riferimenti: la data in alto indica l&apos;ultima revisione. Chi siamo e come lavoriamo lo spieghiamo nella <a href={itPublicUrl(IT_ABOUT_SLUG)}>pagina Chi siamo</a>.</p>
      <p>Nuovi articoli arrivano quando abbiamo qualcosa di utile da dire, non a scadenza fissa. Se hai una domanda che vorresti vedere trattata, o conosci un gruppo, una comunità o un appuntamento per single cristiani in Ticino, scrivici: l&apos;indirizzo è nella pagina Chi siamo. Per iniziare, le <a href={itCityUrl()}>guide per le città</a> raccolgono chiese, comunità e luoghi per un primo incontro, città per città.</p>
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
