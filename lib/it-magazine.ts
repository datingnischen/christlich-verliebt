import data from "../data/it-magazine.json" with { type: "json" };

/** Magazin von single-cristiani.ch (/magazine/<articolo>/). Artikel als Daten, Quellen erscheinen eingeklappt am Ende. */
export type ItArticleSection = { heading: string; html: string };
export type ItArticleSource = { title: string; url: string };
export type ItArticle = {
  slug: string;
  metaTitle: string;
  title: string;
  description: string;
  lead: string;
  category: string;
  heroImage: string;
  heroImageAlt: string;
  author: string;
  published: string;
  modified: string;
  readingMinutes: number;
  sections: ItArticleSection[];
  sources: ItArticleSource[];
};

export const IT_MAGAZINE = data.hub;
/** Neueste zuerst. */
export const IT_ARTICLES = [...(data.articles as ItArticle[])].sort((a, b) => b.published.localeCompare(a.published));

export function getItArticle(slug: string): ItArticle | null {
  return IT_ARTICLES.find((article) => article.slug === slug) ?? null;
}

/** „20 ottobre 2026“ – fest auf it-CH, unabhängig von der Server-Locale. */
export function formatItDate(iso: string): string {
  return new Intl.DateTimeFormat("it-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Zurich" }).format(new Date(`${iso}T12:00:00Z`));
}
