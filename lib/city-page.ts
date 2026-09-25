import { getPage, getPages, locationName, renderedContentHtml, type PublicPage } from "@/lib/content";
import { cityGeo, type CityGeo } from "@/lib/city-geo";
import { staticAsset } from "@/lib/static-asset";

export type GuideSection = { id: string; heading: string | null; html: string };
export type FitValue = { emoji: string; label: string; score: number; html: string };
export type FitFactor = { score: number; introHtml: string; values: FitValue[]; methodHref: string | null };
export type RelatedCity = { page: PublicPage; label: string };
export type CityContent = {
  sections: GuideSection[];
  fit: FitFactor | null;
  related: RelatedCity[];
  credit: string | null;
  minutes: number;
};

const RELATED_HEADING = /<h[2-6]>[^<]*(?:Nicht aus|Weitere Regionen|Weitere regionale Links)[\s\S]*$/i;
const FIT_BLOCK = /<h3>\s*⭐\s*Christen-Fit-Faktor:\s*(\d+)\s*\/\s*100\s*<\/h3>([\s\S]*?)<p>\s*📖[\s\S]*?<\/p>/;

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/, "");
}

/** Innerer Text der ICONY-Box ohne doppelten Titel und ohne die beiden Registrierungs-Buttons. */
function articleBody(html: string) {
  const start = html.search(/<div class="text-content[^"]*">/);
  let body = start >= 0 ? html.slice(html.indexOf(">", start) + 1) : html;
  body = body.replace(/<\/div>\s*<div class="">[\s\S]*$/, "");
  return body.trim();
}

function parseFit(html: string): { fit: FitFactor | null; rest: string } {
  const match = FIT_BLOCK.exec(html);
  if (!match) return { fit: null, rest: html };
  const block = match[0];
  const values = [...block.matchAll(/<p><strong>(\S+)\s+([^<:]+):\s*(\d+)\s*\/\s*100<\/strong>(?:<br\s*\/?>)?([\s\S]*?)<\/p>/g)].map(value => ({
    emoji: value[1],
    label: value[2].replace(/&amp;/g, "&").trim(),
    score: Number(value[3]),
    html: value[4].trim(),
  }));
  // Erklärsatz direkt nach der Grafik (die Grafik selbst ersetzt die gezeichnete Wertung).
  const intro = match[2].split(/<h3>/)[0].match(/<p>(?!\s*<img)([\s\S]*?)<\/p>/)?.[1]?.trim() ?? "";
  const methodHref = block.match(/📖[\s\S]*?href="([^"]+)"/)?.[1] ?? null;
  return { fit: { score: Number(match[1]), introHtml: intro, values, methodHref }, rest: html.replace(block, "") };
}

function parseRelated(page: PublicPage, tail: string): RelatedCity[] {
  const seen = new Set<string>([page.path]);
  const related: RelatedCity[] = [];
  for (const link of tail.matchAll(/<a href="https:\/\/(?:www\.)?christlich-verliebt\.(?:de|at|ch)(\/partnersuche\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const path = link[1].endsWith("/") ? link[1] : `${link[1]}/`;
    const target = getPage(page.market, path);
    if (!target || target.family !== "location" || seen.has(path)) continue;
    seen.add(path);
    related.push({ page: target, label: stripTags(link[2]) });
  }
  return related;
}

/** Teilt den Text an h2 (oder h3, wenn es kaum h2 gibt), damit jeder Abschnitt als Karte erscheint. */
function splitSections(html: string): GuideSection[] {
  const h2 = (html.match(/<h2[\s>]/g) ?? []).length;
  const level = h2 >= 2 ? "h2" : "h3";
  const parts = html.split(new RegExp(`(?=<${level}[\\s>])`));
  const used = new Set<string>();
  return parts
    .map(part => part.trim())
    .filter(part => stripTags(part) || /<img/.test(part))
    .map((part, index) => {
      const match = part.match(new RegExp(`^<${level}[^>]*>([\\s\\S]*?)</${level}>`));
      const heading = match ? stripTags(match[1]) : null;
      let id = heading ? slugify(heading) || `abschnitt-${index + 1}` : "einleitung";
      while (used.has(id)) id = `${id}-${index + 1}`;
      used.add(id);
      return { id, heading, html: match ? part.slice(match[0].length).trim() : part };
    });
}

export function parseCityContent(page: PublicPage): CityContent {
  let html = articleBody(renderedContentHtml(page));

  // Verlinkungsblock und Bildnachweis am Ende: werden als Chips bzw. im Hero gezeigt.
  const tailMatch = RELATED_HEADING.exec(html);
  const tail = tailMatch?.[0] ?? "";
  if (tailMatch) html = html.slice(0, tailMatch.index);
  const credit = tail.match(/(https:\/\/(?:www\.)?pixabay\.com\/[^\s<"]+)/)?.[1] ?? null;

  const { fit, rest } = parseFit(html);
  html = rest;

  // Titelbild steht schon im Hero, leere Überschriften stammen aus dem WordPress-Editor.
  if (page.heroImage) {
    const hero = staticAsset(page.heroImage).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`<(p|h2)>\\s*<img[^>]*src="${hero}"[^>]*/?>\\s*</\\1>`), "");
  }
  html = html.replace(/<h([2-6])>(?:\s|&nbsp;)*<\/h\1>/g, "");

  const words = stripTags(html).split(" ").length + (fit ? stripTags(fit.values.map(value => value.html).join(" ")).split(" ").length : 0);
  return {
    sections: splitSections(html.trim()),
    fit,
    related: parseRelated(page, tail),
    credit,
    minutes: Math.max(1, Math.round(words / 200)),
  };
}

export type CityPoint = { page: PublicPage; geo: CityGeo };

export function marketCities(page: PublicPage): CityPoint[] {
  return getPages(page.market)
    .filter(item => item.family === "location")
    .map(item => ({ page: item, geo: cityGeo(item.market, item.path) }))
    .filter((item): item is CityPoint => Boolean(item.geo))
    .sort((a, b) => locationName(a.page).localeCompare(locationName(b.page), "de"));
}

export function distanceKm(a: CityGeo, b: CityGeo) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

export function nearestCities(page: PublicPage, count = 5) {
  const geo = cityGeo(page.market, page.path);
  if (!geo) return [];
  return marketCities(page)
    .filter(item => item.page.path !== page.path)
    .map(item => ({ ...item, km: distanceKm(geo, item.geo) }))
    .filter(item => item.km > 0)
    .sort((a, b) => a.km - b.km)
    .slice(0, count);
}

export type SectionIcon = "church" | "cup" | "people" | "tree" | "calendar" | "phone" | "heart" | "pin" | "spark" | "music" | "book";

/** Symbol je Abschnitt aus Stichworten der Überschrift – rein dekorativ. */
export function sectionIcon(heading: string | null): SectionIcon {
  const h = (heading ?? "").toLowerCase();
  if (/online|internet|app\b|digital|plattform/.test(h)) return "phone";
  if (/fazit|liebe|herz|beziehung|verlieb|zueinander|date/.test(h)) return "heart";
  if (/kirch|gottesdienst|gemeinde|kloster|glaube|spirituell|gebet|dom\b|kathedral/.test(h)) return "church";
  if (/konzert|musik|chor|singen/.test(h)) return "music";
  if (/event|veranstalt|fest|termin|treffen/.test(h)) return "calendar";
  if (/café|cafe|kaffee|restaurant|bar\b|bars|genuss|kulinar|ausgehen/.test(h)) return "cup";
  if (/sport|verein|hobby|freizeit|gemeinsam|bewegung|aktiv|gruppe/.test(h)) return "people";
  if (/natur|see|park|berg|wander|spazier|hinaus|draußen|rhein|fluss/.test(h)) return "tree";
  if (/stadtteil|umland|ort|treffpunkt|location|viertel|region|überblick|stadt/.test(h)) return "pin";
  if (/tipp|strateg|chance|warum|wie\b|so funktioniert/.test(h)) return "spark";
  return "book";
}
