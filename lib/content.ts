import provenanceSnapshot from "@/data/asset-provenance.json";
import snapshot from "@/data/public-pages.json";
import type { MarketCode } from "@/lib/markets";

export type PublicPage = {
  market: MarketCode;
  locale: string;
  domain: string;
  path: string;
  sourceUrl: string;
  canonical: string;
  family: "home" | "location-hub" | "location" | "magazine-hub" | "magazine" | "guide-hub" | "guide" | "editorial";
  title: string;
  description: string;
  heroTitle: string;
  contentHtml: string;
};

const pages = snapshot.pages as PublicPage[];
const pageIndex = new Map(pages.map((page) => [`${page.market}:${page.path}`, page]));
const assetSources = new Map(
  (provenanceSnapshot as { localPath: string; sourceUrl: string }[])
    .map((asset) => [asset.localPath, asset.sourceUrl]),
);

export function normalizeContentPath(slug?: string[]): string {
  return !slug?.length ? "/" : `/${slug.join("/")}/`;
}

export function getPage(market: MarketCode, path: string): PublicPage | null {
  return pageIndex.get(`${market}:${path}`) ?? null;
}

export function getPages(market?: MarketCode): PublicPage[] {
  return market ? pages.filter((page) => page.market === market) : pages;
}

export function getChildPages(page: PublicPage): PublicPage[] {
  if (page.family === "location-hub") return pages.filter((item) => item.market === page.market && item.family === "location");
  if (page.family === "magazine-hub") return pages.filter((item) => item.market === page.market && item.family === "magazine");
  if (page.family === "guide-hub") return pages.filter((item) => item.market === page.market && item.family === "guide");
  return [];
}

export function registrationUrl(page: PublicPage): string {
  const aid = page.family === "location" || page.family === "location-hub"
    ? "location"
    : page.family === "magazine" || page.family === "magazine-hub"
      ? "magazin"
      : null;
  const base = `https://${page.domain}/registration/`;
  return aid ? `${base}?aid=${aid}` : base;
}

export function renderedContentHtml(page: PublicPage): string {
  const registration = registrationUrl(page).replace(/&/g, "&amp;");
  const escapedDomain = page.domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.contentHtml.replace(
    new RegExp(`href=(["'])https://${escapedDomain}/registration/?(?:\\?[^"']*)?\\1`, "gi"),
    (_match, quote) => `href=${quote}${registration}${quote}`,
  );
}

export function selectPageImage(page: PublicPage): string | null {
  const images = [...page.contentHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]);
  if (!images.length) return null;
  const slug = page.path.split("/").filter(Boolean).at(-1)?.replace(/-/g, "") ?? "";
  return images
    .map((image, index) => {
      const source = (assetSources.get(image) ?? image).toLowerCase();
      const compactSource = source.replace(/[^a-z0-9]/g, "");
      let score = -index;
      if (slug && compactSource.includes(slug)) score += 20;
      if (/statistik|infografik|logo|seal|siegel|badge|icon|testbericht/.test(source)) score -= 100;
      if (/stadt|city|panorama|skyline|kirche|church|dom|muenster/.test(source)) score += 8;
      return { image, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.image ?? null;
}

export function pageLabel(page: PublicPage): string {
  if (page.family === "location" || page.family === "location-hub") return "Christliche Partnersuche vor Ort";
  if (page.family === "magazine" || page.family === "magazine-hub") return "Magazin für Glaube, Liebe und Beziehung";
  if (page.family === "guide" || page.family === "guide-hub") return "Ratgeber für christliche Singles";
  return "Glaube verbindet";
}
