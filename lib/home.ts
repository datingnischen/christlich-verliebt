import { getPage, renderedContentHtml, type PublicPage } from "@/lib/content";
import { splitSections, stripTags, type GuideSection } from "@/lib/city-page";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

export type HomeContent = { intro: GuideSection | null; sections: GuideSection[]; credits: string[]; minutes: number };

/** ICONY-Startseitentext ohne Wrapper, Titelbild (steht im Hero) und Bildnachweis-Zeile. */
export function parseHomeContent(page: PublicPage): HomeContent {
  let html = renderedContentHtml(page);
  html = html.replace(/^\s*<div class="text-container[^"]*">/, "").replace(/<\/div>\s*$/, "");
  html = html.replace(/<\/?section>/g, "");
  const creditLine = html.match(/<p>\s*Bildquelle:([\s\S]*?)<\/p>/);
  if (creditLine) html = html.replace(creditLine[0], "");
  const credits = creditLine ? [...creditLine[1].matchAll(/https:\/\/[^\s<]+/g)].map(match => match[0]) : [];
  if (page.heroImage) {
    const hero = staticAsset(page.heroImage).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`<p>\\s*(?:<strong>)?\\s*<img[^>]*src="${hero}"[^>]*/?>\\s*(?:</strong>)?\\s*</p>`), "");
  }
  // Import-Fehler: Der FAQ-Link der deutschen Startseite zeigte auf die FAQ eines anderen Projekts.
  html = html.replace(/href="https:\/\/dich-mit-stich\.de\/faq\/?"/g, `href="${publicUrl(page.market, "/faq/")}/"`);
  html = html.replace(/<p>(?:\s|&nbsp;)*<\/p>/g, "");
  // Listen, deren Punkte schon mit einem Emoji beginnen, brauchen kein zusätzliches Häkchen.
  html = html.replace(/<ul>((?:\s*<li>\s*\p{Extended_Pictographic}[\s\S]*?<\/li>)+\s*)<\/ul>/gu, '<ul class="emoji-list">$1</ul>');
  // Abschnitte ohne Text und ohne Bild weglassen.
  const sections = splitSections(html.trim()).filter(section => stripTags(section.html) || /<img/.test(section.html));
  const [first, ...rest] = sections;
  return {
    intro: first ?? null,
    sections: rest,
    credits,
    minutes: Math.max(1, Math.round(stripTags(html).split(" ").length / 200)),
  };
}

// Handverlesene Einstiegsartikel je Markt (AT hat keinen eigenen Ratgeber).
const TEASER_PATHS: Partial<Record<MarketCode, string[]>> = {
  de: ["/magazin/top-10-staedte-christliche-singles-deutschland/", "/magazin/katholische-singles/", "/magazin/antrag-ohne-ring/"],
  ch: ["/ratgeber/christliche-partnersuche-tipps/", "/ratgeber/erste-nachricht-an-christliche-singles/", "/ratgeber/partnersuche-ab-50/"],
};

export function homeTeasers(market: MarketCode): PublicPage[] {
  return (TEASER_PATHS[market] ?? []).map(path => getPage(market, path)).filter((page): page is PublicPage => Boolean(page));
}
