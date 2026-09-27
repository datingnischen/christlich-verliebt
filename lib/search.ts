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
  textKey: string;
};

export type SearchHit = SearchEntry & { score: number };

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
  if (page.path === "/dating-tipps/") return "Dating-Tipps";
  return "Seite";
}

function shorten(text: string, max = 180): string {
  return text.length > max ? `${text.slice(0, max - 3).replace(/\s+\S*$/, "").trim()}…` : text;
}

export function buildSearchIndex(pages: PublicPage[]): SearchEntry[] {
  return pages.filter(page => page.family !== "home").map(page => {
    const text = plainText(page.contentHtml);
    return {
      path: page.path,
      section: sectionLabel(page),
      title: page.title,
      excerpt: shorten(page.description || text),
      titleKey: normalizeSearch(`${page.title} ${page.heroTitle}`),
      textKey: normalizeSearch(`${page.description} ${text}`),
    };
  });
}

// Titel-Treffer zählen deutlich mehr als Treffer in Beschreibung oder Text; alle Suchwörter müssen vorkommen.
export function searchIndex(index: SearchEntry[], query: string, limit = SEARCH_LIMIT): SearchHit[] {
  const needle = normalizeSearch(query);
  if (!needle) return [];
  const terms = needle.split(" ");
  const hits: SearchHit[] = [];
  for (const entry of index) {
    let score = 0;
    let matchedAll = true;
    for (const term of terms) {
      const inTitle = entry.titleKey.includes(term);
      const inText = entry.textKey.includes(term);
      if (!inTitle && !inText) { matchedAll = false; break; }
      score += (inTitle ? 10 : 0) + (inText ? 1 : 0);
    }
    if (!matchedAll) continue;
    if (entry.titleKey.includes(needle)) score += 20;
    hits.push({ ...entry, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de")).slice(0, limit);
}
