import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { cardLinkLabel, getChildPages, getCityImageCredit, getMagazineCategories, getPage, getPages, normalizeContentPath, pageLabel, registrationUrl, renderedContentHtml, selectPageImage, type PublicPage } from "@/lib/content";
import { isMarketCode, previewPath } from "@/lib/markets";
import styles from "./page.module.css";

type Props = { params: Promise<{ market: string; slug?: string[] }> };

export function generateStaticParams() {
  return getPages().map(page => ({ market: page.market, slug: page.path === "/" ? undefined : page.path.split("/").filter(Boolean) }));
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
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.canonical },
    robots: { index: true, follow: true },
    openGraph: { title: page.title, description: page.description, url: page.canonical, locale: page.locale.replace("-", "_"), type: "website", ...(hero ? { images: [{ url: `https://${page.domain}${hero}` }] } : {}) },
  };
}

function excerpt(text: string) {
  return text.length > 165 ? `${text.slice(0, 162).trim()}…` : text;
}

function ContentCard({ child }: { child: PublicPage }) {
  const image = selectPageImage(child);
  const credit = getCityImageCredit(child);
  return <article className={styles.card}>
    {image ? <Image src={image} alt={child.family === "location" ? `Stadtansicht und christliche Partnersuche: ${child.heroTitle}` : `Titelbild: ${child.heroTitle}`} width={640} height={380} /> : <div className={styles.cardFallback}>✦</div>}
    {credit ? <a className={styles.imageCredit} href={credit.sourcePage} target="_blank" rel="nofollow noopener">Bild: {credit.artist} · {credit.license}</a> : null}
    <div><span>{pageLabel(child)}</span><h3>{child.heroTitle}</h3><p>{excerpt(child.description)}</p><a href={previewPath(child.market, child.path)}>{cardLinkLabel(child)}</a></div>
  </article>;
}

export default async function PublicPageRoute({ params }: Props) {
  const page = await activePage(params);
  const children = getChildPages(page);
  const register = registrationUrl(page);
  const heroImage = selectPageImage(page);
  const contentHtml = renderedContentHtml(page);
  const categoryGroups = page.family === "magazine-hub"
    ? getMagazineCategories().map(category => ({ ...category, pages: children.filter(child => child.categories.includes(category.slug)) })).filter(category => category.pages.length)
    : [];
  const categorizedPaths = new Set(categoryGroups.flatMap(category => category.pages.map(child => child.path)));
  const uncategorizedMagazinePages = page.family === "magazine-hub" ? children.filter(child => !categorizedPaths.has(child.path)) : [];
  return <SiteShell market={page.market} registrationHref={register}>
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{pageLabel(page)}</p>
          <h1>{page.heroTitle}</h1>
          {page.description ? <p className={styles.lead}>{page.description}</p> : null}
          <div className={styles.heroActions}><a href={register}>Kostenlos registrieren</a>{page.family !== "location-hub" ? <a href={previewPath(page.market, "/partnersuche/")}>Singles nach Region entdecken</a> : null}</div>
        </div>
        {heroImage
          ? <Image className={styles.heroImage} src={heroImage} alt={page.heroTitle} width={640} height={640} priority />
          : <div className={styles.heroMark} aria-hidden="true"><span>✦</span><strong>Glaube</strong><small>Liebe · Vertrauen · Nähe</small></div>}
      </section>
      {categoryGroups.length ? <nav className={styles.categoryNav} id="magazin-kategorien" aria-label="Magazinkategorien"><div><span>Magazin-Themen</span><strong>Direkt zur Kategorie springen</strong></div>{categoryGroups.map(category => <a href={`#kategorie-${category.slug}`} key={category.slug}>{category.name}<small>{category.pages.length}</small></a>)}</nav> : null}
      <section className={styles.layout}>
        <article className={styles.article}>
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
        <aside className={styles.sidebar}>
          <div className={styles.cta}><span>Gemeinsame Werte</span><h2>Christliche Singles kennenlernen</h2><p>Erstelle kostenlos Dein Profil und entdecke Menschen, denen Glaube, Respekt und eine ehrliche Beziehung wichtig sind.</p><a href={register}>Jetzt kostenlos starten</a></div>
          <div className={styles.trust}><h2>Sicher kennenlernen</h2><ul><li>Redaktionell kontrollierte Profile</li><li>Kostenlose Basis-Mitgliedschaft</li><li>Persönlicher Support</li><li>Dating mit gemeinsamen Werten</li></ul></div>
        </aside>
      </section>
      {categoryGroups.length ? <section className={styles.children}><div className={styles.sectionHeading}><p className={styles.eyebrow}>Magazin entdecken</p><h2>Artikel nach Themen</h2></div>{categoryGroups.map(category => <section className={styles.categoryGroup} id={`kategorie-${category.slug}`} key={category.slug}><div className={styles.categoryHeading}><div><p className={styles.eyebrow}>Kategorie</p><h3>{category.name}</h3></div><a href="#magazin-kategorien">Alle Themen ↑</a></div><div className={styles.grid}>{category.pages.map(child => <ContentCard child={child} key={`${category.slug}:${child.path}`} />)}</div></section>)}{uncategorizedMagazinePages.length ? <section className={styles.categoryGroup} id="kategorie-weitere"><div className={styles.categoryHeading}><div><p className={styles.eyebrow}>Kategorie</p><h3>Weitere Beiträge</h3></div><a href="#magazin-kategorien">Alle Themen ↑</a></div><div className={styles.grid}>{uncategorizedMagazinePages.map(child => <ContentCard child={child} key={child.path} />)}</div></section> : null}</section> : children.length ? <section className={styles.children}><div className={styles.sectionHeading}><p className={styles.eyebrow}>{page.family === "location-hub" ? "Regionen entdecken" : "Weiterlesen"}</p><h2>{page.family === "location-hub" ? "Christliche Partnersuche in Deiner Nähe" : "Aktuelle Beiträge und Ratgeber"}</h2></div><div className={styles.grid}>{children.map(child => <ContentCard child={child} key={child.path} />)}</div></section> : null}
    </main>
  </SiteShell>;
}
