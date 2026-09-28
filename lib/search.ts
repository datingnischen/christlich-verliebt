import type { PublicPage } from "./content";

// Seitensuche unter „Über uns“ (/ueber-uns/suche/): nginx reicht /suche/ an ICONY weiter, darum liegt sie hier.
export const SEARCH_PATH = "/ueber-uns/suche/";
export const SEARCH_LIMIT = 50;

export type SearchEntry = {
  path: string;
  section: string;
  title: string;
  excerpt: string;
  titleKey: string;
  nameKeys: string[];
  excerptKey: string;
  textKey: string;
};

// score = Relevanzstufe (5 exakter Titel/Stadtname … 1 nur im Text), count = Vorkommen des Suchbegriffs.
export type SearchHit = SearchEntry & { score: number; count: number };

// Marken-Zusatz aus dem Import („… - Christlich-Verliebt.de“, „| Christlich-Verliebt“) – nur für die Anzeige in der Suche.
const BRAND_SUFFIX = /\s*[-–—|:]\s*christlich[\s-]?verliebt(?:\.(?:de|at|ch))?\s*$/iu;
// Marken-Präfix ohne Trenner („Christlich-Verliebt.de Dietrich Bonhoeffer“) – nur mit Domain-Endung, damit
// Titel, in denen die Marke Thema ist („Christlich-verliebt auf Social Media“, „Christlich-verliebt.de – die …“), bleiben.
const BRAND_PREFIX = /^\s*christlich[\s-]?verliebt\.(?:de|at|ch)\s+(?=[^\s\-–—|:])/iu;
export function stripBrandSuffix(title: string): string {
  const stripped = title.replace(BRAND_PREFIX, "").replace(BRAND_SUFFIX, "").trim();
  return stripped || title;
}

// Kleinschreibung, Umlaute als ae/oe/ue/ss, übrige Diakritika weg: „Zürich“ findet „zuerich“ und umgekehrt.
export function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const ENTITIES: Record<string, string> = { amp: "&", quot: "\"", apos: "'", nbsp: " ", lt: "<", gt: ">", bdquo: "„", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…" };

export function plainText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

export function sectionLabel(page: Pick<PublicPage, "family" | "path">): string {
  if (page.path.startsWith("/ueber-uns/")) return "Über uns";
  if (page.family === "location") return "Stadt";
  if (page.family === "location-hub") return "Partnersuche";
  if (page.family === "magazine" || page.family === "magazine-hub") return "Magazin";
  if (page.family === "guide" || page.family === "guide-hub") return "Ratgeber";
  if (page.path === "/faq/") return "FAQ";
  return "Seite";
}

function shorten(text: string, max = 180): string {
  return text.length > max ? `${text.slice(0, max - 3).replace(/\s+\S*$/, "").trim()}…` : text;
}

export function buildSearchIndex(pages: PublicPage[]): SearchEntry[] {
  return pages.filter(page => page.family !== "home").map(page => {
    const text = plainText(page.contentHtml);
    const title = stripBrandSuffix(page.title);
    const heroTitle = stripBrandSuffix(page.heroTitle);
    const excerpt = shorten(page.description || text);
    const citySlug = page.family === "location" ? page.path.split("/").filter(Boolean).at(-1) ?? "" : "";
    return {
      path: page.path,
      section: sectionLabel(page),
      title,
      excerpt,
      titleKey: normalizeSearch(`${title} ${heroTitle}`),
      nameKeys: [title, heroTitle, citySlug.replace(/-/g, " ")].map(normalizeSearch).filter(Boolean),
      excerptKey: normalizeSearch(page.description),
      textKey: normalizeSearch(`${page.description} ${text}`),
    };
  });
}

function occurrences(haystack: string, needle: string): number {
  let count = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) count++;
  return count;
}

// Relevanz: Titel (exakt/Stadtname > beginnt mit > enthält) vor Auszug vor Text; alle Suchwörter müssen vorkommen.
// Innerhalb einer Stufe entscheidet die Häufigkeit des Suchbegriffs, erst danach das Alphabet.
function relevance(entry: SearchEntry, needle: string, terms: string[]): number {
  const all = (key: string) => terms.every(term => key.includes(term));
  if (entry.nameKeys.includes(needle)) return 5;
  if (entry.nameKeys.some(key => key.startsWith(needle))) return 4;
  if (all(entry.titleKey)) return 3;
  if (all(entry.excerptKey)) return 2;
  return 1;
}

export function searchIndex(index: SearchEntry[], query: string, limit = SEARCH_LIMIT): SearchHit[] {
  const needle = normalizeSearch(query);
  if (!needle) return [];
  const terms = needle.split(" ");
  const hits: SearchHit[] = [];
  for (const entry of index) {
    if (!terms.every(term => entry.titleKey.includes(term) || entry.textKey.includes(term))) continue;
    const haystack = `${entry.titleKey} ${entry.textKey}`;
    const phrase = occurrences(haystack, needle);
    const count = phrase || Math.min(...terms.map(term => occurrences(haystack, term)));
    hits.push({ ...entry, score: relevance(entry, needle, terms), count });
  }
  return hits
    .sort((a, b) => b.score - a.score || b.count - a.count || a.title.localeCompare(b.title, "de"))
    .slice(0, limit);
}
