import snapshot from "@/data/public-pages.json";
import categorySnapshot from "@/data/magazine-categories.json";
import cityImageSnapshot from "@/data/city-image-overrides.json";
import cityWidgetSnapshot from "@/data/city-widgets.json";
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
  heroImage: string | null;
  categories: string[];
  contentHtml: string;
};

export type MagazineCategory = {
  count: number;
  id: number;
  link: string;
  name: string;
  slug: string;
};

export type CityImageCredit = {
  artist: string;
  license: string;
  sourcePage: string;
};

export type CityWidget = {
  market: MarketCode;
  path: string;
  postcode: string;
  sourceUrl: string;
  widgetUrl: string;
};

const pages = snapshot.pages as PublicPage[];
const pageIndex = new Map(pages.map((page) => [`${page.market}:${page.path}`, page]));
const magazineCategories = categorySnapshot.categories as MagazineCategory[];
const cityImageCredits = new Map<string, CityImageCredit>(cityImageSnapshot.images.map(image => [image.localPath, {
  artist: image.artist,
  license: image.license,
  sourcePage: image.sourcePage,
}]));
const CITY_WIDGET_PATTERNS: Record<MarketCode, RegExp> = {
  de: /^https:\/\/js\.icony\.com\/frame\/\?h=300&id=christlichverliebt&pc=CE302F&z=([0-9]{5})&ds=&ctr=49&it=1$/,
  at: /^https:\/\/js\.icony\.com\/frame\/\?h=300&id=christlichverliebtat&pc=CE302F&z=([0-9]{4})&ds=&ctr=43&it=1$/,
  ch: /^https:\/\/js\.icony\.com\/frame\/\?h=300&id=christlichverliebtch&pc=CE302F&z=([0-9]{4})&ds=&ctr=41&it=1$/,
};
const cityWidgets = new Map((cityWidgetSnapshot.widgets as CityWidget[]).map(widget => {
  const match = CITY_WIDGET_PATTERNS[widget.market].exec(widget.widgetUrl);
  if (!match || match[1] !== widget.postcode || !widget.path.startsWith("/partnersuche/")) {
    throw new Error(`Invalid city widget contract for ${widget.market}:${widget.path}`);
  }
  return [`${widget.market}:${widget.path}`, widget];
}));
const LOCATION_NAME_OVERRIDES: Record<string, string> = {
  duesseldorf: "Düsseldorf",
  "frankfurt-am-main": "Frankfurt am Main",
  koeln: "Köln",
  muenchen: "München",
  muenster: "Münster",
  nuernberg: "Nürnberg",
  "st-gallen": "St. Gallen",
  "st-poelten": "St. Pölten",
  wuerzburg: "Würzburg",
  zuerich: "Zürich",
};


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

export function getMagazineCategories(): MagazineCategory[] {
  return magazineCategories;
}

export function getCityImageCredit(page: PublicPage): CityImageCredit | null {
  return page.heroImage ? cityImageCredits.get(page.heroImage) ?? null : null;
}

export function getCityWidget(page: PublicPage): CityWidget | null {
  return page.family === "location" ? cityWidgets.get(`${page.market}:${page.path}`) ?? null : null;
}

export function locationName(page: PublicPage): string {
  const slug = page.path.split("/").filter(Boolean).at(-1) ?? "";
  return LOCATION_NAME_OVERRIDES[slug] ?? slug.split("-").map(part => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}

export function cardLinkLabel(page: PublicPage): string {
  return page.family === "location" ? `Christliche Singles in ${locationName(page)}` : "Mehr erfahren";
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
  const normalized = page.contentHtml.replace(
    new RegExp(`href=(["'])https://${escapedDomain}/registration/?(?:\\?[^"']*)?\\1`, "gi"),
    (_match, quote) => `href=${quote}${registration}${quote}`,
  );
  return normalized.replace(
    /<a\b(?![^>]*\bclass=)([^>]*\bhref=(["'])https:\/\/[^"']+\/registration\/?[^"']*\2[^>]*)>/gi,
    '<a class="registration-cta"$1>',
  );
}

export function selectPageImage(page: PublicPage): string | null {
  return page.heroImage;
}

export function pageLabel(page: PublicPage): string {
  if (page.family === "location" || page.family === "location-hub") return "Christliche Partnersuche vor Ort";
  if (page.family === "magazine" || page.family === "magazine-hub") return "Magazin für Glaube, Liebe und Beziehung";
  if (page.family === "guide" || page.family === "guide-hub") return "Ratgeber für christliche Singles";
  return "Glaube verbindet";
}
