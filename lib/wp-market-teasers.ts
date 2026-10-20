import pagesSnapshot from "../data/public-pages.json" with { type: "json" };
import type { MarketCode } from "./markets.ts";
import { teaserImageUrl } from "./teaser-image.ts";
import type { SourceEntry, SourceMedia } from "./wp-rest-compat.ts";

/**
 * AT/CH-Knoten der WordPress-kompatiblen Schnittstelle (https://christlich-verliebt.at|ch/magazin/wp-json/wp/v2/posts).
 *
 * Hintergrund (Heiko, 2026-10-20): Die .at/.ch-Startseiten von ICONY holten ihre drei Magazin-Teaser von der
 * .de-Schnittstelle. Die Bilder kamen dann von christlich-verliebt.de, die CSP der ICONY-Startseiten (`img-src 'self'`)
 * blockte sie, und die Links führten ins .de-Magazin. Ein Magazin gibt es nur in Deutschland. Darum liefert der
 * Länderknoten die drei größten Städteseiten des Landes als „Beiträge“: Link, Bild und Text auf der Landesdomain.
 *
 * Auswahl nach Einwohnern unter den vorhandenen Stadtseiten mit Bild: AT Wien, Graz, Linz; CH Zürich, Basel, Bern
 * (Genf hat keine Stadtseite; Bern liegt knapp vor Lausanne).
 */

export type MarketTeaserCode = "at" | "ch";

type CityPage = { market: MarketCode; path: string; canonical: string; family: string; title: string; description: string; heroImage: string | null };

// Bildmaße und Dateigröße der Dateien in public/imported/<land>/ (per Test gegen die Dateien geprüft).
export const TEASER_CITIES: Record<MarketTeaserCode, { slug: string; width: number; height: number; bytes: number }[]> = {
  at: [
    { slug: "wien", width: 1000, height: 563, bytes: 133573 },
    { slug: "graz", width: 1000, height: 752, bytes: 159358 },
    { slug: "linz", width: 1000, height: 663, bytes: 132841 },
  ],
  ch: [
    { slug: "zuerich", width: 1000, height: 761, bytes: 169885 },
    { slug: "basel", width: 1000, height: 666, bytes: 134766 },
    { slug: "bern", width: 1000, height: 666, bytes: 171777 },
  ],
};

// Feste Datumswerte: Reihenfolge = Einwohnerzahl (neuester „Beitrag“ zuerst).
const DATES = ["2026-10-20T12:00:00", "2026-10-20T11:00:00", "2026-10-20T10:00:00"];
const ID_BASE: Record<MarketTeaserCode, number> = { at: 910_000, ch: 920_000 };

export function isMarketTeaserCode(value: unknown): value is MarketTeaserCode {
  return value === "at" || value === "ch";
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Die drei Städteseiten des Marktes als Beiträge; dateGmt ist bereits umgerechnet (Ortszeit -> GMT). */
export function marketTeaserEntries(market: MarketTeaserCode, origin: string, toGmt: (local: string) => string): SourceEntry[] {
  const pages = pagesSnapshot.pages as unknown as CityPage[];
  return TEASER_CITIES[market].map((teaser, index): SourceEntry => {
    const path = `/partnersuche/${teaser.slug}/`;
    const page = pages.find((item) => item.market === market && item.family === "location" && item.path === path);
    if (!page?.heroImage) throw new Error(`Stadtseite ${market}${path} mit Bild fehlt in data/public-pages.json`);
    const id = ID_BASE[market] + index + 1;
    const date = DATES[index];
    const dateGmt = toGmt(date);
    const excerpt = `<p>${escapeHtml(page.description)}</p>\n`;
    const media: SourceMedia = {
      id: 1_000_000 + id,
      slug: `${market}-${teaser.slug}`,
      title: escapeHtml(page.title),
      altText: page.title.trim(),
      sourceUrl: teaserImageUrl(`${origin}/magazin/wp-json`, page.heroImage),
      mimeType: "image/jpeg",
      width: teaser.width,
      height: teaser.height,
      bytes: teaser.bytes,
      imagePath: page.heroImage,
      date,
      dateGmt,
      post: id,
    };
    return {
      id,
      slug: teaser.slug,
      link: `${origin}${path}`,
      title: escapeHtml(page.title),
      excerpt,
      content: excerpt,
      date,
      dateGmt,
      modified: date,
      modifiedGmt: dateGmt,
      author: 1,
      categories: [],
      tags: [],
      media,
    };
  });
}
