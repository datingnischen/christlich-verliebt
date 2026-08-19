import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getChildPages, getPage, getPages, normalizeContentPath, pageLabel, registrationUrl, renderedContentHtml, selectPageImage } from "@/lib/content";
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

export default async function PublicPageRoute({ params }: Props) {
  const page = await activePage(params);
  const children = getChildPages(page);
  const register = registrationUrl(page);
  const heroImage = selectPageImage(page);
  const contentHtml = renderedContentHtml(page);
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
      <section className={styles.layout}>
        <article className={styles.article}>
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
        <aside className={styles.sidebar}>
          <div className={styles.cta}><span>Gemeinsame Werte</span><h2>Christliche Singles kennenlernen</h2><p>Erstelle kostenlos Dein Profil und entdecke Menschen, denen Glaube, Respekt und eine ehrliche Beziehung wichtig sind.</p><a href={register}>Jetzt kostenlos starten</a></div>
          <div className={styles.trust}><h2>Sicher kennenlernen</h2><ul><li>Redaktionell kontrollierte Profile</li><li>Kostenlose Basis-Mitgliedschaft</li><li>Persönlicher Support</li><li>Dating mit gemeinsamen Werten</li></ul></div>
        </aside>
      </section>
      {children.length ? <section className={styles.children}><div className={styles.sectionHeading}><p className={styles.eyebrow}>{page.family === "location-hub" ? "Regionen entdecken" : "Weiterlesen"}</p><h2>{page.family === "location-hub" ? "Christliche Partnersuche in Deiner Nähe" : "Aktuelle Beiträge und Ratgeber"}</h2></div><div className={styles.grid}>{children.map(child => { const image = selectPageImage(child); return <article className={styles.card} key={child.path}>{image ? <Image src={image} alt={`Stadtansicht und christliche Partnersuche: ${child.heroTitle}`} width={640} height={380} /> : <div className={styles.cardFallback}>✦</div>}<div><span>{pageLabel(child)}</span><h3>{child.heroTitle}</h3><p>{excerpt(child.description)}</p><a href={previewPath(child.market, child.path)}>Mehr erfahren</a></div></article>; })}</div></section> : null}
    </main>
  </SiteShell>;
}
