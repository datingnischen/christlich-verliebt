import { getMarket, type MarketCode } from "./markets";

export const ABOUT_ROOT_PATH = "/ueber-uns/";
export const ABOUT_REVIEWS_PATH = "/ueber-uns/bewertungen/";
export const ABOUT_SOCIAL_PATH = "/ueber-uns/social-media/";

// Importierte Hintergrundseiten, die jetzt unter „Über uns“ liegen (wie bei er-sucht-ihn und alleinerziehende-singles).
export const ABOUT_PAGE_MOVES: Partial<Record<MarketCode, Record<string, string>>> = {
  de: {
    "/bewertungen-und-erfahrungen/": ABOUT_REVIEWS_PATH,
    "/social-media/": ABOUT_SOCIAL_PATH,
  },
};

export function movedAboutPath(market: MarketCode, path: string): string {
  return ABOUT_PAGE_MOVES[market]?.[path] ?? path;
}

// Kanonische URL mit Schrägstrich am Ende wie bei allen anderen Seiten.
export function aboutCanonical(market: MarketCode): string {
  return `https://${getMarket(market).domain}${ABOUT_ROOT_PATH}`;
}

export function hasAboutSubpages(market: MarketCode): boolean {
  return Boolean(ABOUT_PAGE_MOVES[market]);
}

// Einzige Quelle für Social-Media-Links (Über uns, Social-Media-Seite) und für Brand.sameAs im JSON-LD.
// brandProfile: true nur für eigene offizielle Profile der Marke; Gruppen, Communities oder Bewertungsportale
// dürfen hier sichtbar stehen, aber ohne brandProfile und damit nicht in sameAs.
export const SOCIAL_CHANNELS = [
  { name: "Facebook", href: "https://www.facebook.com/christlichverliebt/", text: "Neuigkeiten, Inspiration und Beiträge rund um christlich-verliebt.", brandProfile: true },
  { name: "YouTube", href: "https://www.youtube.com/@Christlich-Verliebt", text: "Videos, Erfahrungsberichte und Impulse für Liebe, Glaube und Partnerschaft.", brandProfile: true },
] as const;

export function brandSameAs(): string[] {
  return SOCIAL_CHANNELS.filter(channel => channel.brandProfile).map(channel => channel.href);
}

export const REVIEW_PORTALS = [
  { name: "Trustpilot", href: "https://www.trustpilot.com/review/christlich-verliebt.de", text: "Mitglieder bewerten ihre Erfahrungen mit der Plattform öffentlich und unabhängig." },
  { name: "Singleboersen-Überblick.de", href: "https://singleboersen-ueberblick.de/partnersuche/christlich-verliebt-de/", text: "Vergleichsportal mit Testbericht zu christlich-verliebt.de." },
  { name: "Singleboersen-vergleichen.de", href: "https://www.singleboersen-vergleichen.de/singleportal/christlich-verliebt/", text: "Einordnung im Vergleich mit anderen Singlebörsen." },
] as const;
