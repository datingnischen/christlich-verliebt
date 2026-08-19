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

export function publicUrl(market: MarketCode, pathname = "/"): string {
  const path = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `https://${getMarket(market).domain}${path}`;
}

export function previewPath(market: MarketCode, pathname = "/"): string {
  const path = pathname === "/" ? "" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `/${market}${path}`;
}
