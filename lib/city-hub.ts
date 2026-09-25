import { locationName, renderedContentHtml, type PublicPage } from "@/lib/content";
import { marketMap, project, regionName } from "@/lib/city-map";
import { marketCities, splitSections, stripTags, type CityPoint, type GuideSection } from "@/lib/city-page";
import { previewPath } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

export type HubContent = { introImage: string | null; before: GuideSection[]; after: GuideSection[]; credit: string | null };

// Linkliste der Städte im ICONY-Text: wird durch die Städtesuche ersetzt, die an ihrer Stelle steht.
const CITY_LIST = /<div class="ic-row">\s*(?:<div class="ic-col[^"]*">\s*<ul>[\s\S]*?<\/ul>\s*<\/div>\s*)+<\/div>/;

/** ICONY-Übersichtstext ohne doppelten Titel, Registrierungsbutton und Bildnachweis-Zeile, geteilt an der Städteliste. */
export function parseHubContent(page: PublicPage): HubContent {
  let html = renderedContentHtml(page);
  html = html.replace(/^\s*<div class="panel[^"]*">\s*/, "");
  html = html.replace(/^[^<]+/, ""); // Titelzeile ohne Tag, steht schon als H1 im Hero
  html = html.replace(/<div class="ic-row m-t-40">[\s\S]*$/, "");
  const credit = html.match(/<p>\s*Bildquelle:\s*(https:\/\/[^\s<]+)\s*<\/p>/);
  if (credit) html = html.replace(credit[0], "");
  html = html.replace(/<p>(?:\s|&nbsp;)*<\/p>/g, "").replace(/\n{3,}/g, "\n\n");

  const list = CITY_LIST.exec(html);
  let beforeHtml = list ? html.slice(0, list.index) : "";
  // Aufmacherbild der Einleitung steht neben dem Text statt darüber.
  const introImage = beforeHtml.match(/^\s*<p>\s*(<img[^>]*>)\s*<\/p>/);
  if (introImage) beforeHtml = beforeHtml.slice(introImage[0].length);
  const afterHtml = list ? html.slice(list.index + list[0].length) : html;
  const sections = (part: string) => stripTags(part) || /<img/.test(part) ? splitSections(part.trim()) : [];
  return { introImage: introImage?.[1] ?? null, before: sections(beforeHtml), after: sections(afterHtml), credit: credit?.[1] ?? null };
}

export type HubCity = { name: string; href: string; image: string | null; region: string; regionName: string };
export type HubRegion = { code: string; name: string; cities: HubCity[] };

export function hubRegions(hub: PublicPage): HubRegion[] {
  const regions = new Map<string, HubRegion>();
  for (const { page, geo } of marketCities(hub)) {
    const name = regionName(hub.market, geo.region);
    const region = regions.get(geo.region) ?? { code: geo.region, name, cities: [] };
    region.cities.push({
      name: locationName(page),
      href: previewPath(page.market, page.path),
      image: page.heroImage ? staticAsset(page.heroImage) : null,
      region: geo.region,
      regionName: name,
    });
    regions.set(geo.region, region);
  }
  return [...regions.values()].sort((a, b) => b.cities.length - a.cities.length || a.name.localeCompare(b.name, "de"));
}

export type PlacedPin = { point: CityPoint; x: number; y: number; label: { x: number; y: number; anchor: "start" | "middle" | "end" } | null };

type Box = { x1: number; y1: number; x2: number; y2: number };
const overlaps = (a: Box, b: Box) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

/**
 * Setzt die Städtenamen gierig um die Punkte, ohne Überlappung mit anderen Namen oder Punkten.
 * Enge Städte (Ruhrgebiet) zuerst; was keinen Platz findet, zeigt seinen Namen nur beim Überfahren.
 */
export function placeLabels(hub: PublicPage, cities: CityPoint[], fontSize: number, room: number): PlacedPin[] {
  const map = marketMap(hub.market);
  const pins = cities.map(point => ({ point, ...project(hub.market, point.geo.lat, point.geo.lon) }));
  const dot = fontSize * 0.45;
  const boxes: Box[] = pins.map(pin => ({ x1: pin.x - dot, y1: pin.y - dot, x2: pin.x + dot, y2: pin.y + dot }));
  const crowd = (pin: (typeof pins)[number]) => pins.filter(other => Math.hypot(other.x - pin.x, other.y - pin.y) < fontSize * 4).length;
  const order = [...pins].sort((a, b) => crowd(b) - crowd(a));
  const placed = new Map<string, PlacedPin["label"]>();
  const gap = fontSize * 0.6;
  for (const pin of order) {
    const width = locationName(pin.point.page).length * fontSize * 0.56;
    const h = fontSize;
    const candidates: { x: number; y: number; anchor: "start" | "middle" | "end"; box: Box }[] = [
      { x: pin.x + gap, y: pin.y + h * 0.35, anchor: "start", box: { x1: pin.x + gap, y1: pin.y - h * 0.6, x2: pin.x + gap + width, y2: pin.y + h * 0.4 } },
      { x: pin.x - gap, y: pin.y + h * 0.35, anchor: "end", box: { x1: pin.x - gap - width, y1: pin.y - h * 0.6, x2: pin.x - gap, y2: pin.y + h * 0.4 } },
      { x: pin.x, y: pin.y - gap, anchor: "middle", box: { x1: pin.x - width / 2, y1: pin.y - gap - h * 0.9, x2: pin.x + width / 2, y2: pin.y - gap + h * 0.1 } },
      { x: pin.x, y: pin.y + gap + h * 0.8, anchor: "middle", box: { x1: pin.x - width / 2, y1: pin.y + gap - h * 0.1, x2: pin.x + width / 2, y2: pin.y + gap + h * 0.9 } },
      { x: pin.x + gap * 0.7, y: pin.y - gap * 0.7, anchor: "start", box: { x1: pin.x + gap * 0.7, y1: pin.y - gap * 0.7 - h * 0.9, x2: pin.x + gap * 0.7 + width, y2: pin.y - gap * 0.7 + h * 0.1 } },
      { x: pin.x + gap * 0.7, y: pin.y + gap * 0.7 + h * 0.8, anchor: "start", box: { x1: pin.x + gap * 0.7, y1: pin.y + gap * 0.7 - h * 0.1, x2: pin.x + gap * 0.7 + width, y2: pin.y + gap * 0.7 + h * 0.9 } },
      { x: pin.x - gap * 0.7, y: pin.y - gap * 0.7, anchor: "end", box: { x1: pin.x - gap * 0.7 - width, y1: pin.y - gap * 0.7 - h * 0.9, x2: pin.x - gap * 0.7, y2: pin.y - gap * 0.7 + h * 0.1 } },
      { x: pin.x - gap * 0.7, y: pin.y + gap * 0.7 + h * 0.8, anchor: "end", box: { x1: pin.x - gap * 0.7 - width, y1: pin.y + gap * 0.7 - h * 0.1, x2: pin.x - gap * 0.7, y2: pin.y + gap * 0.7 + h * 0.9 } },
    ];
    const own = boxes[pins.indexOf(pin)];
    const fit = candidates.find(candidate =>
      candidate.box.x1 >= -room && candidate.box.x2 <= map.width + room && candidate.box.y1 >= 0 && candidate.box.y2 <= map.height
      && boxes.every(box => box === own || !overlaps(candidate.box, box)));
    if (fit) boxes.push(fit.box);
    placed.set(pin.point.page.path, fit ? { x: fit.x, y: fit.y, anchor: fit.anchor } : null);
  }
  return pins.map(pin => ({ point: pin.point, x: pin.x, y: pin.y, label: placed.get(pin.point.page.path) ?? null }));
}
