import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItCityPage, ItHomePage, ItShell } from "@/components/it-pages";
import { ItAboutPage } from "@/components/it-about";
import { ItArticlePage, ItCitiesPage, ItMagazinePage } from "@/components/it-hubs";
import { IT_LEGAL, ItLegalPage, type ItLegalSlug } from "@/components/it-legal";
import { IT_ABOUT, IT_ABOUT_SLUG, IT_AUTHOR, IT_CITIES, IT_CITY_BASE, IT_HOME, IT_LEGAL_PAGES, IT_MAGAZINE_BASE, IT_PILOT_INDEXABLE, IT_PUBLISHER, getItCity, itAuthorId, itAuthorUrl, itCityUrl, itMagazineUrl, itPublicUrl } from "@/lib/it-pilot";
import { IT_ARTICLES, IT_MAGAZINE, getItArticle } from "@/lib/it-magazine";
import { publicUrl } from "@/lib/markets";
import { safeJsonLd } from "@/lib/site-entities";
import { staticAsset } from "@/lib/static-asset";

type Props = { params: Promise<{ market: string; slug?: string[] }> };

// Italienische Variante: Vorschau /ch/it/…, live single-cristiani.ch (proxy.ts). Städte unter /incontri/<città>/,
// Magazin unter /magazine/<articolo>/ – wie /partnersuche/ und /magazin/ auf christlich-verliebt.
export function generateStaticParams() {
  return [
    { market: "ch", slug: undefined },
    { market: "ch", slug: [IT_CITY_BASE] },
    ...IT_CITIES.map((city) => ({ market: "ch", slug: [IT_CITY_BASE, city.slug] })),
    { market: "ch", slug: [IT_MAGAZINE_BASE] },
    ...IT_ARTICLES.map((article) => ({ market: "ch", slug: [IT_MAGAZINE_BASE, article.slug] })),
    { market: "ch", slug: [IT_ABOUT_SLUG] },
    ...IT_LEGAL_PAGES.map((slug) => ({ market: "ch", slug: [slug] })),
  ];
}
export const dynamicParams = false;

async function resolve(params: Props["params"]) {
  const { market, slug = [] } = await params;
  if (market !== "ch" || slug.length > 2) notFound();
  if (!slug.length) return { kind: "home" as const, url: itPublicUrl(), metaTitle: IT_HOME.metaTitle, title: IT_HOME.title, description: IT_HOME.description };
  if (slug.length === 1 && slug[0] === IT_ABOUT_SLUG) {
    return { kind: "about" as const, url: itPublicUrl(IT_ABOUT_SLUG), metaTitle: IT_ABOUT.metaTitle, title: IT_ABOUT.title, description: IT_ABOUT.description };
  }
  if (slug.length === 1 && (IT_LEGAL_PAGES as readonly string[]).includes(slug[0])) {
    const legal = slug[0] as ItLegalSlug;
    return { kind: "legal" as const, url: itPublicUrl(legal), metaTitle: IT_LEGAL[legal].metaTitle, title: IT_LEGAL[legal].title, description: IT_LEGAL[legal].description, legal };
  }
  if (slug[0] === IT_CITY_BASE) {
    if (slug.length === 1) return { kind: "cities" as const, url: itCityUrl(), metaTitle: "Incontri Ticino: single cristiani nella tua città", title: "Incontri in Ticino per single cristiani", description: "Incontri Ticino per single cristiani: guide per Lugano, Bellinzona, Locarno, Mendrisio e Chiasso con chiese, comunità e idee per un primo appuntamento." };
    const city = getItCity(slug[1]);
    if (!city) notFound();
    return { kind: "city" as const, url: itCityUrl(city.slug), metaTitle: city.metaTitle, title: city.title, description: city.description, city };
  }
  if (slug[0] === IT_MAGAZINE_BASE) {
    if (slug.length === 1) return { kind: "magazine" as const, url: itMagazineUrl(), metaTitle: IT_MAGAZINE.metaTitle, title: IT_MAGAZINE.title, description: IT_MAGAZINE.description };
    const article = getItArticle(slug[1]);
    if (!article) notFound();
    return { kind: "article" as const, url: itMagazineUrl(article.slug), metaTitle: article.metaTitle, title: article.title, description: article.description, article };
  }
  notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolve(params);
  const image = page.kind === "city" ? page.city : page.kind === "article" ? page.article : IT_HOME;
  return {
    title: { absolute: page.metaTitle },
    description: page.description,
    alternates: { canonical: page.url, languages: page.kind === "home" ? { "it-CH": page.url, "de-CH": publicUrl("ch") } : undefined },
    // Inhaltsseiten indexierbar (lib/it-pilot.ts), Rechtstexte wie auf den deutschen Seiten noindex.
    robots: { index: IT_PILOT_INDEXABLE && page.kind !== "legal", follow: true },
    openGraph: { title: page.title, description: page.description, url: page.url, locale: "it_CH", type: page.kind === "article" ? "article" : "website", siteName: "single-cristiani.ch", images: [{ url: staticAsset(image.heroImage), width: 1600, height: 900, alt: image.heroImageAlt }] },
  };
}

export default async function ItPilot({ params }: Props) {
  const page = await resolve(params);
  // Herausgeber (Marke single-cristiani.ch), Website und Autor als eigene Knoten; Artikel und Chi siamo verweisen per @id darauf.
  const organizationId = `${itPublicUrl()}#organization`;
  const websiteId = `${itPublicUrl()}#website`;
  const author = { "@type": "Person", "@id": itAuthorId(), name: IT_AUTHOR.name, url: itAuthorUrl(), image: staticAsset(IT_AUTHOR.image), jobTitle: IT_AUTHOR.jobTitle, worksFor: { "@id": organizationId }, sameAs: IT_AUTHOR.sameAs };
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": organizationId, name: IT_PUBLISHER.name, url: itPublicUrl(), logo: { "@type": "ImageObject", url: staticAsset(IT_PUBLISHER.logo) } },
    { "@type": "WebSite", "@id": websiteId, url: itPublicUrl(), name: IT_PUBLISHER.name, inLanguage: "it-CH", publisher: { "@id": organizationId } },
    { "@type": page.kind === "about" ? "AboutPage" : "WebPage", "@id": `${page.url}#webpage`, url: page.url, name: page.title, description: page.description, inLanguage: "it-CH", isPartOf: { "@id": websiteId }, ...(page.kind === "about" ? { about: { "@id": organizationId }, mentions: { "@id": itAuthorId() } } : {}) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Svizzera italiana", item: itPublicUrl() },
      ...(page.kind === "cities" || page.kind === "city" ? [{ "@type": "ListItem", position: 2, name: "Incontri in Ticino", item: itCityUrl() }] : []),
      ...(page.kind === "city" ? [{ "@type": "ListItem", position: 3, name: page.city.name, item: page.url }] : []),
      ...(page.kind === "magazine" || page.kind === "article" ? [{ "@type": "ListItem", position: 2, name: "Magazine", item: itMagazineUrl() }] : []),
      ...(page.kind === "article" ? [{ "@type": "ListItem", position: 3, name: page.title, item: page.url }] : []),
      ...(page.kind === "legal" || page.kind === "about" ? [{ "@type": "ListItem", position: 2, name: page.title, item: page.url }] : []),
    ] },
    ...(page.kind === "article" ? [{ "@type": "Article", "@id": `${page.url}#article`, headline: page.article.title, description: page.description, inLanguage: "it-CH", datePublished: page.article.published, dateModified: page.article.modified, image: staticAsset(page.article.heroImage), mainEntityOfPage: { "@id": `${page.url}#webpage` }, author: { "@id": itAuthorId() }, publisher: { "@id": organizationId } }] : []),
    ...(page.kind === "article" || page.kind === "about" ? [author] : []),
    ...(page.kind === "home" || page.kind === "city" ? [{ "@type": "FAQPage", "@id": `${page.url}#faq`, inLanguage: "it-CH", mainEntity: (page.kind === "city" ? page.city : IT_HOME).guide.faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })) }] : []),
  ] };
  return <ItShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }} />
    {page.kind === "home" ? <ItHomePage />
      : page.kind === "legal" ? <ItLegalPage slug={page.legal} />
      : page.kind === "about" ? <ItAboutPage />
      : page.kind === "cities" ? <ItCitiesPage />
      : page.kind === "magazine" ? <ItMagazinePage />
      : page.kind === "article" ? <ItArticlePage article={page.article} />
      : <ItCityPage city={page.city} />}
  </ItShell>;
}
