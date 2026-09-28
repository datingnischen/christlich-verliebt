import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CityHub } from "@/components/city-hub";
import { CityPage } from "@/components/city-page";
import { FaqPage } from "@/components/faq-page";
import { HomePage } from "@/components/home-page";
import { MAGAZINE_DESCRIPTION, MAGAZINE_TITLE, MagazineHub } from "@/components/magazine-hub";
import { SiteShell } from "@/components/site-shell";
import { VideoEmbed } from "@/components/video-embed";
import { cardLinkLabel, formatUpdated, getChildPages, getCityImageCredit, getPage, getPages, normalizeContentPath, pageLabel, registrationUrl, renderedContentHtml, selectPageImage, type PublicPage } from "@/lib/content";
import { getVideo, videoDurationLabel, videoJsonLd } from "@/lib/videos";
import { faqDescription, faqJsonLd, faqTitle, isFaqPage, parseFaq } from "@/lib/faq";
import { isMarketCode, previewPath, publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import styles from "./page.module.css";

type Props = { params: Promise<{ market: string; slug?: string[] }> };

// Seiten mit eigener Route (z. B. app/[market]/magazin/christian-m-haas) nicht doppelt erzeugen.
const DEDICATED_ROUTES = new Set(["de:/magazin/christian-m-haas/"]);

export function generateStaticParams() {
  return getPages().filter(page => !DEDICATED_ROUTES.has(`${page.market}:${page.path}`)).map(page => ({ market: page.market, slug: page.path === "/" ? undefined : page.path.split("/").filter(Boolean) }));
}
export const dynamicParams = false;

async function activePage(params: Props["params"]) {
  const { market, slug } = await params;
  if (!isMarketCode(market)) notFound();
  const page = getPage(market, normalizeContentPath(slug));
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await activePage(params);
  const hero = selectPageImage(page);
  const faq = isFaqPage(page) ? parseFaq(page.contentHtml) : null;
  const magazine = page.family === "magazine-hub";
  const title = faq ? faqTitle(page) : magazine ? MAGAZINE_TITLE : page.title;
  const description = faq ? faqDescription(page, faq) : magazine ? MAGAZINE_DESCRIPTION : page.description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: page.canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: page.canonical, locale: page.locale.replace("-", "_"), type: "website", ...(hero ? { images: [{ url: hero }] } : {}) },
  };
}

function excerpt(text: string) {
  return text.length > 165 ? `${text.slice(0, 162).trim()}…` : text;
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function ContentCard({ child }: { child: PublicPage }) {
  const image = selectPageImage(child);
  return <article className={styles.card}>
    {image ? <Image src={image} alt={child.family === "location" ? `Stadtansicht und christliche Partnersuche: ${child.heroTitle}` : `Titelbild: ${child.heroTitle}`} width={640} height={380} /> : <div className={styles.cardFallback}>✦</div>}
    <div><span>{pageLabel(child)}</span><h3>{child.heroTitle}</h3><p>{excerpt(child.description)}</p><a className={child.family === "location" ? styles.cardButton : undefined} href={previewPath(child.market, child.path)}>{cardLinkLabel(child)}</a></div>
  </article>;
}

export default async function PublicPageRoute({ params }: Props) {
  const page = await activePage(params);
  const children = getChildPages(page);
  const register = registrationUrl(page);
  if (page.family === "location") return <SiteShell market={page.market} registrationHref={register}><CityPage page={page} /></SiteShell>;
  if (page.family === "location-hub") return <SiteShell market={page.market} registrationHref={register}><CityHub page={page} /></SiteShell>;
  if (page.family === "home") return <SiteShell market={page.market} registrationHref={register}><HomePage page={page} /></SiteShell>;
  if (page.family === "magazine-hub") return <SiteShell market={page.market} registrationHref={register}><MagazineHub page={page} /></SiteShell>;
  const heroImage = selectPageImage(page);
  const heroCredit = getCityImageCredit(page);
  const contentHtml = renderedContentHtml(page);
  const faq = isFaqPage(page) ? parseFaq(contentHtml) : null;
  const faqGraph = faq ? faqJsonLd(page, faq, faqTitle(page), faqDescription(page, faq)) : null;
  // Eigene Videoartikel: Video oben im Artikel (Zwei-Klick), im Hero nur ein Play-Verweis statt des Titelbilds.
  const video = getVideo(page.videoId);
  const videoGraph = video ? { "@context": "https://schema.org", ...videoJsonLd(video, `${page.canonical}#video`) } : null;
  return <SiteShell market={page.market} registrationHref={register}>
    {faqGraph ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqGraph) }} /> : null}
    {videoGraph ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(videoGraph) }} /> : null}
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{faq ? "Hilfe & Antworten" : pageLabel(page)}</p>
          <h1>{page.heroTitle}</h1>
          {faq ? <p className={styles.lead}>{faq.intro ?? faqDescription(page, faq)}</p> : page.description ? <p className={styles.lead}>{page.description}</p> : null}
          {page.updated ? <p className={styles.updated}>Aktualisiert am {formatUpdated(page.updated)}</p> : null}
          <div className={styles.heroActions}><a href={register}>Kostenlos registrieren</a><a href={previewPath(page.market, "/partnersuche/")}>Singles nach Region entdecken</a></div>
        </div>
        {video
          ? <div className={styles.heroMedia}><a className={styles.heroVideo} href="#video"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span><strong>Video</strong><small>{videoDurationLabel(video)} mit Christian M. Haas</small></a></div>
          : heroImage
          ? <div className={styles.heroMedia}><Image className={styles.heroImage} src={heroImage} alt={page.heroTitle} width={640} height={640} priority />{heroCredit ? <p className={styles.heroCredit}>Bild: <a href={heroCredit.sourcePage} target="_blank" rel="nofollow noopener">{heroCredit.artist} · {heroCredit.license}</a></p> : null}</div>
          : <div className={styles.heroMark} aria-hidden="true"><span>✦</span><strong>Glaube</strong><small>Liebe · Vertrauen · Nähe</small></div>}
      </section>
      {faq ? <FaqPage faq={faq} market={page.market} registrationHref={register} /> : contentHtml.trim() ? <section className={styles.layout}>
        <article className={styles.article}>
          {video ? <VideoEmbed video={video} priority /> : null}
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
        <aside className={styles.sidebar}>
          <div className={styles.cta}><span>Gemeinsame Werte</span><h2>Christliche Singles kennenlernen</h2><p>Erstelle kostenlos Dein Profil und entdecke Menschen, denen Glaube, Respekt und eine ehrliche Beziehung wichtig sind.</p><a href={register}>Jetzt kostenlos starten</a></div>
          <TrustCard market={page.market} />
          <a className={styles.radarCard} href={register}><img src={staticAsset("/brand/umkreissuche-radar.svg")} alt="Umkreissuche: Christliche Singles in Deiner Nähe – kostenlos anmelden" width={320} height={480} loading="lazy" decoding="async" /></a>
        </aside>
      </section> : null}
      {children.length ? <section className={styles.children}><div className={styles.sectionHeading}><p className={styles.eyebrow}>Weiterlesen</p><h2>Aktuelle Beiträge und Ratgeber</h2></div><div className={styles.grid}>{children.map(child => <ContentCard child={child} key={child.path} />)}</div></section> : null}
    </main>
  </SiteShell>;
}

const trustIcon = {
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  profile: <><circle cx="10" cy="8" r="4" /><path d="M3 20c0-3.5 3-6 7-6 1.2 0 2.3.2 3.2.6" /><path d="m15 18 2 2 4-4" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></>,
  gift: <><rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M3 7h18v3H3zM12 7v13" /><path d="M12 7C10.5 4 7 4 7 6s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1" /></>,
  chat: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
};

function TrustIcon({ name }: { name: keyof typeof trustIcon }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{trustIcon[name]}</svg>;
}

function TrustCard({ market }: { market: MarketCode }) {
  const items = [
    { icon: "profile", title: "Redaktionell kontrollierte Profile", text: "Unser Team prüft neue Profile persönlich", href: "/redaktionelle-kontrolle.html" },
    { icon: "lock", title: "Sicherheit & Datenschutz", text: "Deine Daten bleiben geschützt", href: "/sicherheit-und-datenschutz.html" },
    { icon: "gift", title: "Kostenlose Basis-Mitgliedschaft", text: "Profil anlegen und in Ruhe umschauen", href: "/kostenlose-basis-mitgliedschaft.html" },
    { icon: "chat", title: "Persönlicher Support", text: "Echte Menschen helfen Dir weiter", href: "/hilfe/" },
  ] as const;
  return <div className={styles.trust}>
    <div className={styles.trustHead}><span className={styles.trustBadge}><TrustIcon name="shield" /></span><div><span>Dein Vertrauen zählt</span><h2>Sicher kennenlernen</h2></div></div>
    <ul className={styles.trustList}>{items.map(item => <li key={item.href}><a href={publicUrl(market, item.href)}><span className={styles.trustIcon}><TrustIcon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span><span className={styles.trustArrow} aria-hidden="true">→</span></a></li>)}</ul>
    <a className={styles.trustFoot} href={publicUrl(market, "/unsere-erfolgsgeschichten.html")}><TrustIcon name="heart" />Paare, die sich hier gefunden haben</a>
  </div>;
}
