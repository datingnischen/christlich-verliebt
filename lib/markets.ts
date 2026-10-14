export const MARKET_CODES = ["de", "at", "ch"] as const;
export type MarketCode = (typeof MARKET_CODES)[number];

export type MarketConfig = {
  code: MarketCode;
  countryName: string;
  domain: string;
  locale: "de-DE" | "de-AT" | "de-CH";
  logoPath: string;
  heading: string;
};

const MARKETS: Record<MarketCode, MarketConfig> = {
  de: { code: "de", countryName: "Deutschland", domain: "christlich-verliebt.de", locale: "de-DE", logoPath: "/brand/christlich-verliebt-de.svg", heading: "Christliche Singles mit gemeinsamen Werten finden" },
  at: { code: "at", countryName: "Österreich", domain: "christlich-verliebt.at", locale: "de-AT", logoPath: "/brand/christlich-verliebt-at.svg", heading: "Christliche Partnersuche in Österreich" },
  ch: { code: "ch", countryName: "Schweiz", domain: "christlich-verliebt.ch", locale: "de-CH", logoPath: "/brand/christlich-verliebt-ch.svg", heading: "Christliche Partnersuche in der Schweiz" },
};

export function isMarketCode(value: string): value is MarketCode {
  return MARKET_CODES.includes(value as MarketCode);
}

export function getMarket(code: MarketCode): MarketConfig {
  return MARKETS[code];
}

const FILE_PATH_PATTERN = /\/[^/]*\.[a-z0-9]+$/i;

// Seitenpfade enden immer auf "/" (wie die ICONY-Plattform). Dateien (/sitemap.xml, *.html, *.png) bleiben
// ohne; Query und Anker wandern hinter den Schrägstrich.
export function withTrailingSlash(pathname: string): string {
  const match = pathname.match(/^([^?#]*)(.*)$/);
  const path = match?.[1] ?? pathname;
  const suffix = match?.[2] ?? "";
  if (!path || path.endsWith("/") || FILE_PATH_PATTERN.test(path)) {
    return `${path || "/"}${suffix}`;
  }
  return `${path}/${suffix}`;
}

export function publicUrl(market: MarketCode, pathname = "/"): string {
  const trimmed = pathname.replace(/^\/+/, "");
  return `https://${getMarket(market).domain}${withTrailingSlash(`/${trimmed}`)}`;
}

// Individuelle ICONY-Suche: nur auf der Live-Domain vorhanden, nie auf dem Vercel-Host.
export function individualSearchUrl(market: MarketCode): string {
  return `https://${getMarket(market).domain}/suche/?AID=location`;
}

/** Vercel-Pfad einer Marktseite mit Länderpräfix: previewHref("at", "/faq") → "/at/faq/". */
export function previewHref(market: MarketCode, pathname = "/"): string {
  const trimmed = pathname.replace(/^\/+/, "");
  return withTrailingSlash(`/${market}/${trimmed}`);
}

/**
 * href einer eigenen Seite im HTML. Seit dem Reverse-Proxy-Livegang (Oktober 2026) holt nginx die Seiten der
 * Live-Domains unter dem Upstream-Pfad /de/…, /at/…, /ch/…; ein relativer Link mit Präfix landete deshalb auf
 * christlich-verliebt.de/de/magazin/… (404). Darum steht im HTML die absolute Live-URL ohne Präfix. Auf
 * Vorschau-Hosts (localhost, *.vercel.app) biegt components/preview-links.tsx die Links nach dem Laden auf
 * den Vercel-Pfad mit Präfix um (previewHref), damit Klicks in der Vorschau bleiben.
 */
export function previewPath(market: MarketCode, pathname = "/"): string {
  return publicUrl(market, pathname);
}

/** true auf localhost und *.vercel.app – dort zeigen die Links auf die Vorschau statt der Live-Domain. */
export function isPreviewHost(hostname = ""): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

// Seiten der ICONY-Plattform: nie in Next.js gerendert, Links bleiben auch in der Vorschau auf der Live-Domain.
const PLATFORM_PATH_PATTERN = /^\/(?:login|registration|hilfe|kontakt|suche|gutschein|dating-tipps)(?:\/|$)|\.html$/i;

export function isPlatformPath(pathname: string): boolean {
  return PLATFORM_PATH_PATTERN.test(pathname.replace(/[?#].*$/, ""));
}
