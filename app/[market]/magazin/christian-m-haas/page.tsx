import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getPage, getPages, pageLabel, type PublicPage } from "@/lib/content";
import { previewPath, publicUrl } from "@/lib/markets";
import styles from "./profile.module.css";

// Eigene Profilseite statt der Artikelvorlage; das Autorenprofil gibt es nur auf .de.
const PROFILE_PATH = "/magazin/christian-m-haas/";
const CANONICAL = "https://christlich-verliebt.de/magazin/christian-m-haas/";
const PERSON_ID = `${CANONICAL}#person`;
const PORTRAIT = "/brand/christian-m-haas.jpg";
const BOOK_URL = "https://www.amazon.de/dp/3696371211/";
const REGISTRATION = "https://christlich-verliebt.de/registration/?AID=magazin";

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/christian-m-haas-457323379" },
  { label: "Ausführliche Vita", href: "https://datingnischen.de/christian" },
  { label: "Gravatar", href: "https://gravatar.com/automatic8c1daff973" },
];

const STATS = [
  { value: "2008", label: "im Online-Dating aktiv" },
  { value: "8 Jahre", label: "Singlebörsen entwickelt und betrieben" },
  { value: "2026", label: "Buch „Dating ohne Bullshit“" },
];

const FOCUS = [
  { icon: "heart", title: "Christliche Partnersuche", text: "Wie gläubige Singles online jemanden finden, der ihre Werte teilt." },
  { icon: "profile", title: "Profil & Kommunikation", text: "Authentische Profile und erste Nachrichten, die ehrlich wirken." },
  { icon: "shield", title: "Sicherheit & Date-Vorbereitung", text: "Worauf Du beim Kennenlernen und beim ersten Treffen achten solltest." },
  { icon: "cross", title: "Glaube im Profil", text: "Wie Du Deinen Glauben zeigst, ohne Dich zu verstellen oder zu verstecken." },
  { icon: "people", title: "Community & Moderation", text: "Wie eine respektvolle Gemeinschaft entsteht und geschützt bleibt." },
] as const;

const TIMELINE = [
  { year: "2008", title: "Einstieg ins Online-Dating", text: "Arbeit an Produkt, Inhalten und Community spezialisierter Datingplattformen." },
  { year: "2008–2016", title: "Singlebörsen aufgebaut und betrieben", text: "Entwicklung und Betrieb eigener Plattformen mit PHP, MySQL und Template-Engines." },
  { year: "Danach", title: "Neue technische Lösungen", text: "Umsetzung von Plattform-Lösungen mit dem Java Spring Framework." },
  { year: "Heute", title: "Magazin von christlich-verliebt", text: "Ratgeber, Magazinbeiträge und Qualitätskontrolle für gläubige Singles im DACH-Raum." },
];

const FAQ = [
  { question: "Wer verantwortet den Inhalt?", answer: "Artikel im Magazin werden von Christian M. Haas erstellt bzw. redaktionell begleitet. Hinweise zur Verantwortung findest Du im Impressum." },
  { question: "Wer betreibt christlich-verliebt.de?", answer: "Die Plattform wird von der ICONY GmbH betrieben, die für den technischen Betrieb, den Datenschutz und alle rechtlichen Belange verantwortlich ist." },
];

// Handverlesen: Ratgeber rund um Glaube, Liebe und Partnersuche statt Plattform-Vorstellungen.
const FEATURED_ARTICLES = [
  "/magazin/katholische-singles/",
  "/magazin/trad-wife-rollenbilder-dating/",
  "/magazin/kein-sex-vor-der-ehe/",
  "/magazin/antrag-ohne-ring/",
  "/magazin/top-10-staedte-christliche-singles-deutschland/",
  "/magazin/c-s-lewis/",
];

type Props = { params: Promise<{ market: string }> };

export function generateStaticParams() {
  return [{ market: "de" }];
}
export const dynamicParams = false;

async function profilePage(params: Props["params"]): Promise<PublicPage> {
  const { market } = await params;
  const page = market === "de" ? getPage("de", PROFILE_PATH) : null;
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await profilePage(params);
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.canonical },
    robots: { index: true, follow: true },
    openGraph: { title: page.title, description: page.description, url: page.canonical, locale: "de_DE", type: "profile", images: [{ url: `https://${page.domain}${PORTRAIT}` }] },
  };
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}

function profileGraph(page: PublicPage) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${CANONICAL}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: "https://christlich-verliebt.de/" },
          { "@type": "ListItem", position: 2, name: "Magazin", item: "https://christlich-verliebt.de/magazin/" },
          { "@type": "ListItem", position: 3, name: "Christian M. Haas", item: CANONICAL },
        ],
      },
      { "@type": "ProfilePage", "@id": `${CANONICAL}#profile-page`, url: CANONICAL, name: "Christian M. Haas", inLanguage: "de-DE", breadcrumb: { "@id": `${CANONICAL}#breadcrumb` }, mainEntity: { "@id": PERSON_ID } },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: "Christian M. Haas",
        url: CANONICAL,
        image: `https://${page.domain}${PORTRAIT}`,
        jobTitle: "Datingexperte & Autor",
        knowsAbout: FOCUS.map(item => item.title),
        sameAs: SOCIALS.map(social => social.href),
      },
      {
        "@type": "Book",
        "@id": `${CANONICAL}#dating-ohne-bullshit`,
        name: "Dating ohne Bullshit",
        alternateName: "Der ungeschönte Insiderblick ins Online-Dating-Business",
        isbn: "9783696371210",
        datePublished: "2026-08-21",
        numberOfPages: 136,
        bookFormat: "https://schema.org/Paperback",
        inLanguage: "de-DE",
        url: BOOK_URL,
        image: `https://${page.domain}${bookCover(page)}`,
        author: { "@id": PERSON_ID },
      },
    ],
  };
}

function bookCover(page: PublicPage): string {
  return page.contentHtml.match(/<img\b[^>]*src=["'](\/imported\/de\/[^"']+)["']/i)?.[1] ?? "";
}

function authorArticles(): PublicPage[] {
  return FEATURED_ARTICLES.map(path => getPage("de", path)).filter((page): page is PublicPage => Boolean(page?.heroImage));
}

const icons = {
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  profile: <><circle cx="10" cy="8" r="4" /><path d="M3 20c0-3.5 3-6 7-6 1.2 0 2.3.2 3.2.6" /><path d="m15 18 2 2 4-4" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  cross: <path d="M12 3v18M7 8h10" />,
  people: <><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2 20c0-3 2.7-5 6-5s6 2 6 5M14 15.2c.6-.1 1.3-.2 2-.2 3.3 0 6 2 6 5" /></>,
};

function Icon({ name }: { name: keyof typeof icons }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

export default async function ChristianProfilePage({ params }: Props) {
  const page = await profilePage(params);
  const cover = bookCover(page);
  const articles = authorArticles();
  const articleCount = getPages("de").filter(item => item.family === "magazine" && item.path !== PROFILE_PATH).length;

  return <SiteShell market="de" registrationHref={REGISTRATION}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(profileGraph(page)) }} />
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><ol><li><a href={previewPath("de")}>Startseite</a></li><li><a href={previewPath("de", "/magazin/")}>Magazin</a></li><li><span aria-current="page">Christian M. Haas</span></li></ol></nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Autor & Datingexperte</p>
          <h1>Christian M. Haas</h1>
          <p className={styles.tagline}>Datingexperte für christliche Partnersuche</p>
          <p className={styles.lead}>Seit 2008 beschäftigt sich Christian mit Online-Dating. Für das Magazin von christlich-verliebt schreibt er Ratgeber für gläubige Singles – mit einem Ziel: Menschen mit gemeinsamen Werten und Glauben zusammenzuführen.</p>
          <div className={styles.heroActions}>
            <a href="#artikel">Lesetipps ansehen</a>
            <a href="#buch">Zum Buch</a>
          </div>
          <ul className={styles.socials} aria-label="Christian M. Haas im Netz">
            {SOCIALS.map(social => <li key={social.href}><a href={social.href} target="_blank" rel="noopener noreferrer nofollow">{social.label} ↗</a></li>)}
          </ul>
        </div>
        <div className={styles.portraitWrap}>
          <Image className={styles.portrait} src={PORTRAIT} alt="Christian M. Haas, Datingexperte und Autor des Magazins von christlich-verliebt" width={648} height={800} sizes="(max-width: 900px) 70vw, 380px" priority />
          <div className={styles.badge}><strong>Seit 2008</strong><span>im Online-Dating</span></div>
        </div>
      </section>

      <ul className={styles.stats} aria-label="Christian M. Haas in Zahlen">
        {STATS.map(stat => <li key={stat.value}><strong>{stat.value}</strong><span>{stat.label}</span></li>)}
      </ul>

      <section className={styles.about} aria-labelledby="ueber-christian">
        <div>
          <p className={styles.eyebrow}>Über den Autor</p>
          <h2 id="ueber-christian">Technik, Community und ein klarer Blick auf das, was zählt</h2>
        </div>
        <div className={styles.aboutText}>
          <p>Christian M. Haas hat sich auf Datingplattformen für bestimmte Zielgruppen spezialisiert. Auf christlich-verliebt.de unterstützt er als Experte und Berater das Magazin mit praxisnahen Ratgebern rund um die seriöse Partnersuche für gläubige Singles im DACH-Raum.</p>
          <p>Durch seine langjährige Arbeit an Datingprojekten kennt er beide Seiten: die Technik hinter einer Plattform ebenso wie Community-Aufbau, Inhalte und Suchmaschinenoptimierung.</p>
          <blockquote>Menschen mit gemeinsamen Werten und Glauben zusammenführen – respektvoll, sicher und authentisch.</blockquote>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="schwerpunkte">
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Schwerpunkte</p><h2 id="schwerpunkte">Worüber Christian schreibt</h2></div>
        <div className={styles.focusGrid}>
          {FOCUS.map(item => <article className={styles.focusCard} key={item.title}><span className={styles.focusIcon}><Icon name={item.icon} /></span><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="werdegang">
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Erfahrung in Kürze</p><h2 id="werdegang">Werdegang</h2></div>
        <ol className={styles.timeline}>
          {TIMELINE.map(step => <li key={step.year}><span className={styles.year}>{step.year}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}
        </ol>
      </section>

      {cover ? <section className={styles.book} id="buch" aria-labelledby="buch-titel">
        <a className={styles.bookCover} href={BOOK_URL} target="_blank" rel="nofollow noopener noreferrer"><Image src={cover} alt="Buchcover „Dating ohne Bullshit“ von Christian M. Haas" width={1058} height={1500} sizes="(max-width: 900px) 60vw, 300px" /></a>
        <div>
          <p className={styles.bookKicker}>Neu erschienen</p>
          <h2 id="buch-titel">Dating ohne Bullshit</h2>
          <p className={styles.bookSub}>Der ungeschönte Insiderblick ins Online-Dating-Business</p>
          <p>In seinem Buch berichtet Christian M. Haas offen über den Aufbau von Datingplattformen, unternehmerische Entscheidungen, Rückschläge und die Verantwortung hinter digitalen Begegnungen. Kein klassischer Datingratgeber, sondern ein persönlicher Blick hinter die Kulissen.</p>
          <ul className={styles.bookFacts}><li>Taschenbuch, 1. Auflage</li><li>136 Seiten</li><li>Erschienen am 21. August 2026</li><li>ISBN 978-3-6963-7121-0</li></ul>
          <a className={styles.bookButton} href={BOOK_URL} target="_blank" rel="nofollow noopener noreferrer">„Dating ohne Bullshit“ bei Amazon ansehen ↗</a>
        </div>
      </section> : null}

      {articles.length ? <section className={styles.section} id="artikel" aria-labelledby="artikel-titel">
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Aus dem Magazin</p><h2 id="artikel-titel">Lesetipps von Christian</h2></div>
        <div className={styles.articles}>
          {articles.map(article => <a className={styles.article} href={previewPath("de", article.path)} key={article.path}>
            <Image src={article.heroImage!} alt={`Titelbild: ${article.heroTitle}`} width={480} height={300} sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 380px" />
            <span className={styles.articleBody}><small>{pageLabel(article)}</small><strong>{article.heroTitle}</strong></span>
          </a>)}
        </div>
        <div className={styles.more}><a href={previewPath("de", "/magazin/")}>Alle {articleCount} Artikel im Magazin →</a></div>
      </section> : null}

      <section className={`${styles.section} ${styles.trust}`} aria-labelledby="transparenz">
        <article className={styles.trustCard}>
          <p className={styles.eyebrow}>Transparenzhinweis</p>
          <h2 id="transparenz">Experte im Magazin, klare Verantwortung</h2>
          <p>Christian M. Haas unterstützt christlich-verliebt.de als Experte und Berater im Magazin. Die Singlebörse wird von der ICONY GmbH betrieben, die für den technischen Betrieb, den Datenschutz und alle rechtlichen Belange verantwortlich ist.</p>
          <a href={publicUrl("de", "/impressum.html")}>Zum Impressum</a>
        </article>
        <div className={styles.faq}>
          <p className={styles.eyebrow}>Häufige Fragen</p>
          {FAQ.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Christliche Singles kennenlernen</h2>
        <p>Erstelle kostenlos Dein Profil und entdecke Menschen, denen Glaube, Respekt und eine ehrliche Beziehung wichtig sind.</p>
        <a href={REGISTRATION}>Jetzt kostenlos starten</a>
      </section>
    </main>
  </SiteShell>;
}
