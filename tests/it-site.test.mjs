import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";
import { IT_ABOUT, IT_ABOUT_SLUG, IT_AUTHOR, IT_CANTON_NAMES, IT_CITIES, itAuthorId, itAuthorUrl, itCityUrl, itMagazineUrl, itPublicUrl } from "../lib/it-pilot.ts";
import { IT_ARTICLES } from "../lib/it-magazine.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const live = (path) => proxy(new NextRequest(`https://single-cristiani.ch${path}`, { headers: { host: "single-cristiani.ch" } }));

test("Chi siamo: eigene indexierbare Seite, in Sitemap, Navigation und Fußzeile, Meta-Längen eingehalten", async () => {
  assert.equal(itAuthorUrl(), "https://single-cristiani.ch/chi-siamo/");
  assert.equal(itAuthorId(), "https://single-cristiani.ch/chi-siamo/#person");
  assert.ok(IT_ABOUT.metaTitle.length <= 60, `${IT_ABOUT.metaTitle.length}`);
  assert.ok(IT_ABOUT.description.length >= 110 && IT_ABOUT.description.length <= 155, `${IT_ABOUT.description.length}`);
  assert.match(live(`/${IT_ABOUT_SLUG}/`).headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/chi-siamo\/$/);
  assert.match(await live("/sitemap.xml").text(), /<loc>https:\/\/single-cristiani\.ch\/chi-siamo\/<\/loc>/);
  const page = await read("app/[market]/it/[[...slug]]/page.tsx");
  assert.match(page, /slug\[0\] === IT_ABOUT_SLUG/);
  assert.match(page, /\{ market: "ch", slug: \[IT_ABOUT_SLUG\] \}/);
  const shell = await read("components/it-pages.tsx");
  assert.equal((shell.match(/itPublicUrl\(IT_ABOUT_SLUG\)/g) ?? []).length, 2, "Chi siamo in Navigation und Fußzeile");
  const about = await read("components/it-about.tsx");
  // Kein Betreibername auf Chi siamo (nur in den Note legali); Autor mit Vita und Profil-Links, Kontakt, Hinweis auf KI-Bilder und -Werkzeuge, Registrierung als deutsch gekennzeichnet.
  assert.doesNotMatch(about, /Mogge/);
  assert.match(about, /kontakt\[a\]m-perfect\.de/);
  assert.match(about, /generate con intelligenza artificiale/);
  assert.match(about, /strumenti di intelligenza artificiale/);
  assert.doesNotMatch(about, /href=\{IT_PLATFORM\.registrationUrl\}(?! hrefLang="de-CH")/);
  assert.ok(IT_AUTHOR.sameAs.includes("https://www.amazon.com/author/christian-m-haas"));
  assert.ok(IT_AUTHOR.sameAs.includes("https://christlich-verliebt.de/magazin/christian-m-haas/"));
});

test("Footer: Flaggen für Deutschland, Österreich und Schweiz verlinken die deutschen Plattformen", async () => {
  const pages = await read("components/it-pages.tsx");
  assert.match(pages, /MARKET_CODES\.map\(\(code\) => <a key=\{code\} href=\{publicUrl\(code\)\} hrefLang=\{getMarket\(code\)\.locale\}/);
  assert.match(pages, /<Flag market=\{code\} \/>/);
  assert.match(pages, /de: "Germania", at: "Austria", ch: "Svizzera"/);
  const shell = await read("components/site-shell.tsx");
  assert.match(shell, /export function Flag\(/);
});

test("Flirtradar: italienische Radar-Grafik im CTA-Band auf Start- und Stadtseiten", async () => {
  const svg = await read("public/brand/radar-single-cristiani.svg");
  assert.match(svg, /Single cristiani/);
  assert.match(svg, /Iscriviti gratis/);
  // Kanton sichtbar: Überschrift und Umriss von CH-TI aus data/city-map.json.
  assert.match(svg, /CANTON TICINO/);
  const ticino = JSON.parse(await read("data/city-map.json")).ch.regions["CH-TI"].d;
  assert.ok(svg.includes(`<path d="${ticino}" transform=`), "Tessin-Umriss fehlt");
  assert.doesNotMatch(svg, /Deiner|anmelden|Umkreissuche/);
  const pages = await read("components/it-pages.tsx");
  assert.match(pages, /radar-single-cristiani\.svg/);
  assert.equal((pages.match(/<ItCtaBand heading=/g) ?? []).length, 2, "Startseite und Stadtseite");
});

test("JSON-LD: Herausgeber, Website und Autor als Knoten; Artikel und Chi siamo verweisen per @id", async () => {
  const page = await read("app/[market]/it/[[...slug]]/page.tsx");
  assert.match(page, /"@type": "Organization", "@id": organizationId, name: IT_PUBLISHER\.name, url: itPublicUrl\(\)/);
  assert.doesNotMatch(page, /legalName|Mogge/);
  assert.match(page, /"@type": "WebSite", "@id": websiteId/);
  assert.match(page, /author: \{ "@id": itAuthorId\(\) \}, publisher: \{ "@id": organizationId \}/);
  assert.match(page, /page\.kind === "about" \? "AboutPage" : "WebPage"/);
  assert.match(page, /isPartOf: \{ "@id": websiteId \}/);
});

test("Artikel: Autorenkasten mit Link auf Chi siamo, Autorname verlinkt", async () => {
  const hubs = await read("components/it-hubs.tsx");
  assert.match(hubs, /<ItAuthorBox \/>/);
  assert.match(hubs, /di <a href=\{itAuthorUrl\(\)\}>\{article\.author\}<\/a>/);
  const pages = await read("components/it-pages.tsx");
  assert.match(pages, /export function ItAuthorBox\(\)/);
  assert.match(pages, /<a href=\{itAuthorUrl\(\)\}>Chi siamo e come lavoriamo<\/a>/);
});

test("Sprache und Barrierefreiheit: <html lang> wird auf it-CH gestellt, keine leeren Alt-Texte, Kantonsnamen italienisch", async () => {
  const pages = await read("components/it-pages.tsx");
  assert.match(pages, /document\.documentElement\.lang="it-CH";/);
  for (const file of ["components/it-pages.tsx", "components/it-hubs.tsx", "components/it-about.tsx", "components/it-legal.tsx"]) {
    assert.doesNotMatch(await read(file), /alt=""/, `${file}: leeres alt`);
  }
  assert.match(pages, /<title>\{IT_CANTON_NAMES\[code\] \?\? region\.name\}<\/title>/);
  const map = JSON.parse(await read("data/city-map.json"));
  for (const code of Object.keys(map.ch.regions)) assert.ok(IT_CANTON_NAMES[code], `${code} ohne italienischen Namen`);
  assert.equal(IT_CANTON_NAMES["CH-TI"], "Canton Ticino");
});

test("llms.txt und favicon der eigenen Domain", async () => {
  const llms = live("/llms.txt");
  assert.equal(llms.status, 200);
  assert.match(llms.headers.get("content-type") ?? "", /text\/plain/);
  const text = await llms.text();
  assert.match(text, /^# single-cristiani\.ch\n/);
  for (const city of IT_CITIES) assert.ok(text.includes(`](${itCityUrl(city.slug)})`), city.slug);
  for (const article of IT_ARTICLES) assert.ok(text.includes(`](${itMagazineUrl(article.slug)})`), article.slug);
  assert.ok(text.includes(`](${itPublicUrl(IT_ABOUT_SLUG)})`));
  assert.match(text, /\n## Optional\n/);
  const favicon = live("/favicon.ico");
  assert.equal(favicon.status, 308);
  assert.match(favicon.headers.get("location") ?? "", /\/brand\/icon\.png$/);
  // Deutsche Domains behalten ihr Verhalten (favicon.ico wird durchgereicht).
  const german = proxy(new NextRequest("https://christlich-verliebt.de/favicon.ico", { headers: { host: "christlich-verliebt.de" } }));
  assert.equal(german.headers.get("location"), null);
});

test("Magazin: mindestens drei Artikel, jeder mit Hero-Alt, Lead, Kategorie und ab 450 Wörtern", () => {
  assert.ok(IT_ARTICLES.length >= 3, `${IT_ARTICLES.length} Artikel`);
  for (const article of IT_ARTICLES) {
    assert.ok(article.heroImageAlt.length > 20, `${article.slug}: Alt-Text`);
    assert.ok(article.lead.length > 60 && article.category.length > 3, `${article.slug}: Lead/Kategorie`);
    const words = article.sections.map((section) => section.html.replace(/<[^>]+>/g, " ")).join(" ").split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 450, `${article.slug}: ${words} Wörter`);
    assert.ok(article.readingMinutes >= 2 && article.readingMinutes <= 12, `${article.slug}: Lesezeit`);
  }
});
