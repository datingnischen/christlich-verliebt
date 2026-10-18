// „Weiterlesen im Magazin“: vier verwandte Beiträge am Ende jedes Magazinbeitrags.
// Semrush (Trello #1249, 2026-10-18): 16 Beiträge hatten nur einen eingehenden internen Link (die Magazin-
// Übersicht). Die Auswahl rotiert ab dem aktuellen Beitrag, zuerst innerhalb der eigenen Kategorie, damit
// jeder Beitrag von mehreren anderen verlinkt wird und nicht immer dieselben vier Ziele bekommen. Zwei der vier
// Plätze rotieren über alle Beiträge, damit auch Beiträge ohne Kategorie-Geschwister (z. B. „Beziehung & Werte“)
// von mindestens zwei anderen Beiträgen verlinkt werden.
// Reine Funktionen ohne Datenimport, damit die Tests sie direkt laden können (lib/content.ts bindet die Daten an).

export const RELATED_COUNT = 4;
const SAME_CATEGORY_SLOTS = 2;
export const MAGAZINE_AUTHOR_PROFILE = "/magazin/christian-m-haas/";

export type RelatedCandidate = {
  path: string;
  heroTitle: string;
  categories: string[];
};

function rotateFrom<T extends { path: string }>(items: T[], currentPath: string): T[] {
  const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));
  const index = sorted.findIndex((item) => item.path > currentPath);
  const start = index === -1 ? 0 : index;
  return [...sorted.slice(start), ...sorted.slice(0, start)].filter((item) => item.path !== currentPath);
}

export function pickRelatedArticles<T extends RelatedCandidate>(page: RelatedCandidate, articles: T[], count = RELATED_COUNT): T[] {
  const candidates = articles.filter((item) => item.path !== page.path && item.path !== MAGAZINE_AUTHOR_PROFILE);
  const sameCategory = candidates.filter((item) => item.categories.some((slug) => page.categories.includes(slug)));
  const picked = rotateFrom(sameCategory, page.path).slice(0, Math.max(0, count - (RELATED_COUNT - SAME_CATEGORY_SLOTS)));
  if (picked.length < count) {
    const chosen = new Set(picked.map((item) => item.path));
    for (const item of rotateFrom(candidates, page.path)) {
      if (picked.length >= count) break;
      if (!chosen.has(item.path)) picked.push(item);
    }
  }
  return picked;
}

// Führendes Emoji der WordPress-Titel entfernen (wie die Karten der Magazin-Übersicht).
export function cleanArticleTitle(title: string): string {
  return title.replace(/^\p{Extended_Pictographic}\s*/u, "").trim();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function relatedArticlesHtml(links: { href: string; title: string }[]): string {
  if (!links.length) return "";
  const items = links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.title)}</a></li>`).join("\n");
  return `\n<section class="magazine-related" aria-labelledby="weiterlesen-im-magazin">\n<h2 id="weiterlesen-im-magazin">Weiterlesen im Magazin</h2>\n<ul>\n${items}\n</ul>\n</section>\n`;
}
