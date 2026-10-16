import type { PublicPage } from "./content";
import { stripBrandSuffix } from "./search";

/**
 * Suchmaschinen-Titel und Meta-Descriptions zur Laufzeit glätten (Seobility-Crawl 16.10.2026), ohne die importierten
 * Seitendaten zu ändern. Google und Seobility messen in Pixeln: Titel Arial 20px (Grenze 580 px), Descriptions
 * Arial 14px (Grenze 1.000 px). Überschriften, Linktexte und Seiteninhalte bleiben unverändert.
 */
export const TITLE_SUFFIX = " | Christlich-Verliebt";
export const TITLE_MAX_WIDTH = 570;
export const META_DESCRIPTION_MAX = 150;
export const META_DESCRIPTION_MAX_WIDTH = 980;
const MIN_SENTENCE_LENGTH = 90;

// Zeichenbreiten von Arial 20px (Canvas measureText), wie sie Google/Seobility für die Titelbreite ansetzen.
const ARIAL_20: Record<string, number> = {
  '0': 11.12, '1': 11.12, '2': 11.12, '3': 11.12, '4': 11.12, '5': 11.12, '6': 11.12, '7': 11.12, '8': 11.12, '9': 11.12,
  a: 11.12, b: 11.12, c: 10, d: 11.12, e: 11.12, f: 5.56, g: 11.12, h: 11.12, i: 4.44, j: 4.44, k: 10, l: 4.44, m: 16.66,
  n: 11.12, o: 11.12, p: 11.12, q: 11.12, r: 6.66, s: 10, t: 5.56, u: 11.12, v: 10, w: 14.44, x: 10, y: 10, z: 10,
  A: 13.34, B: 13.34, C: 14.44, D: 14.44, E: 13.34, F: 12.22, G: 15.56, H: 14.44, I: 5.56, J: 10, K: 13.34, L: 11.12,
  M: 16.66, N: 14.44, O: 15.56, P: 13.34, Q: 15.56, R: 14.44, S: 13.34, T: 12.22, U: 14.44, V: 13.34, W: 18.88, X: 13.34,
  Y: 13.34, Z: 12.22, ä: 11.12, ö: 11.12, ü: 11.12, Ä: 13.34, Ö: 15.56, Ü: 14.44, ß: 12.22, ' ': 5.56, '.': 5.56, ',': 5.56,
  ':': 5.56, ';': 5.56, '!': 5.56, '?': 11.12, '-': 6.66, '–': 11.12, '—': 20, '|': 5.2, '&': 13.34, '(': 6.66, ')': 6.66,
  '/': 5.56, '’': 4.44, '„': 6.66, '“': 6.66, '”': 6.66, '"': 7.1, "'": 3.82, '+': 11.68, '%': 17.78, '#': 11.12, '*': 7.78,
};

export function titleWidth(text: string) {
  let width = 0;
  for (const char of text) width += ARIAL_20[char] ?? 11.12;
  return width;
}
export function descriptionWidth(text: string) { return titleWidth(text) * 0.7; }

// Kürzere Titel (nur <title>) für Seiten, deren Titel allein schon über 570 px liegt; H1 und Linktexte bleiben.
const TITLE_OVERRIDES: Record<string, string> = {
  "/magazin/antrag-ohne-ring/": "Antrag ohne Ring: Verlobung ohne großes Symbol",
};

/** Seitentitel ohne alte Domain-Anhänge („- Christlich-Verliebt.de“), mit Marke nur, wenn sie noch in 570 px passt. */
export function seoTitle(page: Pick<PublicPage, "path" | "title">): string {
  const base = (TITLE_OVERRIDES[page.path] ?? stripBrandSuffix(page.title)).trim();
  if (/christlich[\s-]verliebt/i.test(base)) return base;
  const branded = `${base}${TITLE_SUFFIX}`;
  return titleWidth(branded) <= TITLE_MAX_WIDTH ? branded : base;
}

export function seoDescription(page: Pick<PublicPage, "description">): string {
  return clampMetaDescription(page.description);
}

export function clampMetaDescription(text?: string | null, max = META_DESCRIPTION_MAX): string {
  if (!text) return "";
  const normalized = String(text).replace(/\s+/g, " ").replace(/\s*(?:\[(?:…|\.\.\.)\]|\.\.\.|…)\s*$/, "").trim();
  if (normalized.length <= max && descriptionWidth(normalized) <= META_DESCRIPTION_MAX_WIDTH) return normalized;
  let end = Math.min(normalized.length, max);
  while (end > 0 && descriptionWidth(normalized.slice(0, end)) > META_DESCRIPTION_MAX_WIDTH - 12) end--;
  const window = normalized.slice(0, end);
  let sentenceEnd = -1;
  for (const match of window.matchAll(/[.!?](?=\s|$)/g)) sentenceEnd = match.index ?? sentenceEnd;
  if (sentenceEnd + 1 >= MIN_SENTENCE_LENGTH) return window.slice(0, sentenceEnd + 1);
  const cut = window.slice(0, -1);
  const lastSpace = cut.lastIndexOf(" ");
  const words = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–—-]+$/, "");
  return `${words} …`;
}
