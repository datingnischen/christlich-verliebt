import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SiteShell } from "@/components/site-shell";
import { aboutCanonical, ABOUT_REVIEWS_PATH, ABOUT_SOCIAL_PATH, hasAboutSubpages, REVIEW_PORTALS, SOCIAL_CHANNELS } from "@/lib/about";
import { getMarket, isMarketCode, MARKET_CODES, previewPath, publicUrl, type MarketCode } from "@/lib/markets";
import pageStyles from "../[[...slug]]/page.module.css";
import styles from "./about.module.css";

type Props = { params: Promise<{ market: string }> };

export function generateStaticParams() {
  return MARKET_CODES.map(market => ({ market }));
}
export const dynamicParams = false;

const DESCRIPTION = "Wer hinter christlich-verliebt steht, wie wir Profile prüfen, wie Mitglieder uns bewerten und wo Du uns auf Social Media findest.";

async function activeMarket(params: Props["params"]): Promise<MarketCode> {
  const { market } = await params;
  if (!isMarketCode(market)) notFound();
  return market;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const market = await activeMarket(params);
  const config = getMarket(market);
  const title = `Über uns: Wer hinter ${config.domain} steht`;
  const canonical = aboutCanonical(market);
  return {
    title: { absolute: title },
    description: DESCRIPTION,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description: DESCRIPTION, url: canonical, locale: config.locale.replace("-", "_"), type: "website" },
  };
}

const AUTHOR_PATH = "/magazin/christian-m-haas/";
const AUTHOR = {
  name: "Christian M. Haas",
  jobTitle: "Datingexperte & Autor",
  image: "/brand/christian-m-haas.jpg",
  bio: "Christian M. Haas beschäftigt sich seit 2008 mit Online-Dating und hat sich auf Plattformen für bestimmte Zielgruppen spezialisiert. Seit 2016 arbeitet er mit der ICONY GmbH zusammen und ist Datingexperte von christlich-verliebt: Er schreibt und begleitet das Magazin mit praxisnahen Ratgebern zur seriösen Partnersuche für gläubige Singles im DACH-Raum. Sein Fokus: Menschen mit gemeinsamen Werten und Glauben zusammenzuführen – respektvoll, sicher und authentisch.",
  topics: ["Christliche Partnersuche", "Profil & Kommunikation", "Sicherheit beim Kennenlernen", "Glaube im Profil"],
  facts: ["Seit 2008 im Online-Dating aktiv", "2008–2016 Entwicklung und Betrieb von Singlebörsen", "Seit 2016 Zusammenarbeit mit ICONY und Datingexperte von christlich-verliebt", "Buch „Dating ohne Bullshit“ (2026)"],
  sameAs: ["https://www.linkedin.com/in/christian-m-haas-457323379", "https://gravatar.com/automatic8c1daff973", "https://datingnischen.de/christian"],
};

// Das Autorenprofil gibt es nur auf .de; .at und .ch verlinken es absolut auf der Live-Domain.
function authorUrl(market: MarketCode) {
  return market === "de" ? previewPath("de", AUTHOR_PATH) : `${publicUrl("de", AUTHOR_PATH)}/`;
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function aboutGraph(market: MarketCode) {
  const config = getMarket(market);
  const home = publicUrl(market);
  const canonical = aboutCanonical(market);
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Startseite", item: home },
        { "@type": "ListItem", position: 2, name: "Über uns", item: canonical },
      ] },
      { "@type": "Organization", "@id": `${home}#organization`, name: config.domain, url: home, parentOrganization: { "@type": "Organization", name: "ICONY GmbH" }, sameAs: SOCIAL_CHANNELS.map(channel => channel.href) },
      { "@type": "Person", "@id": "https://christlich-verliebt.de/magazin/christian-m-haas/#person", name: AUTHOR.name, jobTitle: AUTHOR.jobTitle, url: "https://christlich-verliebt.de/magazin/christian-m-haas/", image: `https://${config.domain}${AUTHOR.image}`, sameAs: AUTHOR.sameAs },
      { "@type": "AboutPage", "@id": `${canonical}#webpage`, url: canonical, name: "Über uns", description: DESCRIPTION, inLanguage: config.locale, breadcrumb: { "@id": `${canonical}#breadcrumb` }, about: { "@id": `${home}#organization` }, mentions: { "@id": "https://christlich-verliebt.de/magazin/christian-m-haas/#person" } },
    ],
  };
}

export default async function AboutPage({ params }: Props) {
  const market = await activeMarket(params);
  const config = getMarket(market);
  const registration = publicUrl(market, "/registration/");
  const subpages = hasAboutSubpages(market);
  const editorial = market === "de"
    ? { kicker: "Magazin", title: "Wissen rund um Glaube und Partnerschaft", text: "Im Magazin geht es um christliches Dating, Beziehungen und die Fragen, die gläubige Singles bewegen.", label: "Zum Magazin", href: previewPath(market, "/magazin/") }
    : market === "ch"
      ? { kicker: "Ratgeber", title: "Orientierung für gläubige Singles", text: "Unsere Ratgeber greifen typische Fragen auf: vom ersten Kontakt über gemeinsame Werte bis zum Gebet für die Partnersuche.", label: "Zu den Ratgebern", href: previewPath(market, "/ratgeber/") }
      : { kicker: "Dating-Tipps", title: "Gut vorbereitet ins Kennenlernen", text: "Unsere Dating-Tipps helfen Dir bei Profil, erster Nachricht und dem ersten Treffen – mit Blick auf das, was Dir wichtig ist.", label: "Zu den Dating-Tipps", href: previewPath(market, "/dating-tipps/") };

  return <SiteShell market={market}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutGraph(market)) }} />
    <main className={pageStyles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><ol><li><a href={previewPath(market)}>Startseite</a></li><li><span aria-current="page">Über uns</span></li></ol></nav>
      <section className={pageStyles.hero}>
        <div>
          <p className={pageStyles.eyebrow}>Über christlich-verliebt</p>
          <h1>Wer hinter {config.domain} steht</h1>
          <p className={pageStyles.lead}>christlich-verliebt ist eine Singlebörse für Christinnen und Christen, denen Glaube, gemeinsame Werte und eine ehrliche Beziehung wichtig sind. Hier erfährst Du, wer die Plattform betreibt, wie andere uns bewerten und wo Du uns auf Social Media findest.</p>
          <ul className={styles.chips} aria-label="Themen auf dieser Seite">
            <li><a href="#wer-wir-sind">Wer wir sind</a></li>
            <li><a href="#autor">Unser Autor</a></li>
            <li><a href="#bewertungen">Bewertungen & Erfahrungen</a></li>
            <li><a href="#social-media">Social Media</a></li>
          </ul>
        </div>
        <div className={pageStyles.heroMark} aria-hidden="true"><span>✦</span><strong>Über uns</strong><small>Glaube · Werte · Vertrauen</small></div>
      </section>

      <section className={styles.section} id="wer-wir-sind" aria-labelledby="wer-wir-sind-title">
        <div className={pageStyles.sectionHeading}>
          <p className={pageStyles.eyebrow}>Wer wir sind</p>
          <h2 id="wer-wir-sind-title">Eine Plattform für christliche Singles</h2>
        </div>
        <article className={styles.author} id="autor" aria-labelledby="autor-title">
          <Image className={styles.authorImage} src={AUTHOR.image} alt={`${AUTHOR.name} – ${AUTHOR.jobTitle}`} width={648} height={800} sizes="(max-width: 760px) 160px, 280px" />
          <div>
            <p className={pageStyles.eyebrow}>Der Mensch hinter dem Magazin</p>
            <h3 id="autor-title"><a href={authorUrl(market)}>{AUTHOR.name}</a></h3>
            <p className={styles.authorRole}>{AUTHOR.jobTitle}</p>
            <p>{AUTHOR.bio}</p>
            <ul className={styles.topics} aria-label={`Schwerpunkte von ${AUTHOR.name}`}>{AUTHOR.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
            <ul className={styles.facts} aria-label="Erfahrung in Kürze">{AUTHOR.facts.map(fact => <li key={fact}>{fact}</li>)}</ul>
            <div className={styles.authorActions}>
              <a href={authorUrl(market)}>Zum Autorenprofil</a>
              <a href={AUTHOR.sameAs[0]} target="_blank" rel="noopener noreferrer nofollow">LinkedIn ↗</a>
            </div>
          </div>
        </article>
        <div className={styles.grid}>
          <article className={styles.card}>
            <p className={pageStyles.eyebrow}>Betrieb & Support</p>
            <h3>Betreut von der ICONY GmbH</h3>
            <p>christlich-verliebt gehört zum ICONY-Netzwerk, das seit 2002 Singlebörsen betreibt. ICONY kümmert sich um Technik, Support und Weiterentwicklung.</p>
            <a href={publicUrl(market, "/impressum.html")}>Zum Impressum</a>
          </article>
          <article className={styles.card}>
            <p className={pageStyles.eyebrow}>Profilprüfung</p>
            <h3>Neue Profile werden geprüft</h3>
            <p>Unser Team prüft neue Profile persönlich. So bleibt die Gemeinschaft respektvoll und seriös.</p>
            <a href={publicUrl(market, "/redaktionelle-kontrolle.html")}>Zur redaktionellen Kontrolle</a>
          </article>
          <article className={styles.card}>
            <p className={pageStyles.eyebrow}>{editorial.kicker}</p>
            <h3>{editorial.title}</h3>
            <p>{editorial.text}</p>
            <a href={editorial.href}>{editorial.label}</a>
          </article>
        </div>
      </section>

      <section className={styles.section} id="bewertungen" aria-labelledby="bewertungen-title">
        <div className={pageStyles.sectionHeading}>
          <p className={pageStyles.eyebrow}>Bewertungen & Erfahrungen</p>
          <h2 id="bewertungen-title">Was andere über uns sagen</h2>
          <p className={styles.intro}>Mitglieder und unabhängige Vergleichsportale bewerten christlich-verliebt regelmäßig. Hier findest Du die wichtigsten Einschätzungen.</p>
        </div>
        <div className={styles.grid}>
          {REVIEW_PORTALS.map(portal => <a className={`${styles.card} ${styles.linkCard}`} href={portal.href} key={portal.href} target="_blank" rel="nofollow noopener noreferrer">
            <h3>{portal.name}</h3>
            <p>{portal.text}</p>
            <span>Bewertung ansehen ↗</span>
          </a>)}
        </div>
        {subpages ? <div className={styles.actions}><a href={previewPath(market, ABOUT_REVIEWS_PATH)}>Alle Bewertungen & Erfahrungen</a></div> : null}
      </section>

      <section className={styles.section} id="social-media" aria-labelledby="social-media-title">
        <div className={pageStyles.sectionHeading}>
          <p className={pageStyles.eyebrow}>Social Media</p>
          <h2 id="social-media-title">Folge uns auf unseren Kanälen</h2>
          <p className={styles.intro}>Impulse zu Liebe, Glaube und Partnerschaft, Erfahrungsberichte und Neuigkeiten rund um die Plattform.</p>
        </div>
        <div className={`${styles.grid} ${styles.gridTwo}`}>
          {SOCIAL_CHANNELS.map(channel => <a className={`${styles.card} ${styles.linkCard}`} href={channel.href} key={channel.href} target="_blank" rel="noopener noreferrer">
            <h3>{channel.name}</h3>
            <p>{channel.text}</p>
            <span>Kanal öffnen ↗</span>
          </a>)}
        </div>
        {subpages ? <div className={styles.actions}><a href={previewPath(market, ABOUT_SOCIAL_PATH)}>Zur Social-Media-Übersicht</a></div> : null}
      </section>

      <section className={styles.section} aria-labelledby="vertrauen-title">
        <div className={pageStyles.sectionHeading}>
          <p className={pageStyles.eyebrow}>Sicherheit & Vertrauen</p>
          <h2 id="vertrauen-title">Darauf kannst Du Dich verlassen</h2>
        </div>
        <div className={styles.grid}>
          <a className={`${styles.card} ${styles.linkCard}`} href={publicUrl(market, "/sicherheit-und-datenschutz.html")}><h3>Sicherheit & Datenschutz</h3><p>Wie wir Deine Daten schützen und worauf Du beim Kennenlernen achten solltest.</p><span>Mehr erfahren →</span></a>
          <a className={`${styles.card} ${styles.linkCard}`} href={publicUrl(market, "/kostenlose-basis-mitgliedschaft.html")}><h3>Kostenlose Basis-Mitgliedschaft</h3><p>Profil anlegen und Dich in Ruhe umschauen, bevor Du Dich für mehr entscheidest.</p><span>Mehr erfahren →</span></a>
          <a className={`${styles.card} ${styles.linkCard}`} href={publicUrl(market, "/unsere-erfolgsgeschichten.html")}><h3>Erfolgsgeschichten</h3><p>Paare erzählen, wie sie sich bei christlich-verliebt kennengelernt haben.</p><span>Mehr erfahren →</span></a>
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Du möchtest christliche Singles kennenlernen?</h2>
        <p>Erstelle kostenlos Dein Profil und entdecke Menschen aus Deiner Region, denen Glaube und gemeinsame Werte wichtig sind.</p>
        <a href={registration}>Jetzt kostenlos registrieren</a>
      </section>
    </main>
  </SiteShell>;
}
