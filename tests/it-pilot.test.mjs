import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";
import { IT_CITIES, IT_HOME, IT_PILOT_INDEXABLE, IT_PLATFORM, IT_PLATFORM_ITALIAN, itCityUrl, itMagazineUrl, itPublicUrl, itWidgetUrl, nearestItCities } from "../lib/it-pilot.ts";
import { IT_ARTICLES, IT_MAGAZINE } from "../lib/it-magazine.ts";

test("Italienische Variante: Vorschau /ch/it/ und single-cristiani.ch landen auf derselben Route", () => {
  const preview = proxy(new NextRequest("https://christlich-verliebt.vercel.app/ch/it/incontri/lugano/", { headers: { host: "christlich-verliebt.vercel.app" } }));
  assert.match(preview.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/incontri\/lugano\/$/);
  const live = proxy(new NextRequest("https://single-cristiani.ch/incontri/lugano/", { headers: { host: "single-cristiani.ch" } }));
  assert.match(live.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/incontri\/lugano\/$/);
  const article = proxy(new NextRequest("https://single-cristiani.ch/magazine/parlare-di-fede-al-primo-appuntamento/", { headers: { host: "single-cristiani.ch" } }));
  assert.match(article.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/magazine\/parlare-di-fede-al-primo-appuntamento\/$/);
  const home = proxy(new NextRequest("https://www.single-cristiani.ch/", { headers: { host: "www.single-cristiani.ch" } }));
  assert.match(home.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it$/);
  const legal = proxy(new NextRequest("https://single-cristiani.ch/privacy/", { headers: { host: "single-cristiani.ch" } }));
  assert.match(legal.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/privacy\/$/);
});

test("Sechs Tessiner Städte mit PLZ, Schweizer ICONY-Fenster und Live-URLs unter /it/", () => {
  assert.deepEqual(IT_CITIES.map((city) => city.slug), ["lugano", "bellinzona", "locarno", "mendrisio", "chiasso", "biasca"]);
  for (const city of IT_CITIES) {
    assert.match(city.postcode, /^6\d{3}$/);
    assert.equal(itWidgetUrl(city.postcode), `https://js.icony.com/frame/?h=300&id=christlichverliebtch&pc=CE302F&z=${city.postcode}&ds=&ctr=41&it=1`);
  }
  assert.equal(itPublicUrl(), "https://single-cristiani.ch/");
  assert.equal(itCityUrl("chiasso"), "https://single-cristiani.ch/incontri/chiasso/");
  assert.equal(itCityUrl(), "https://single-cristiani.ch/incontri/");
  assert.equal(itMagazineUrl(), "https://single-cristiani.ch/magazine/");
  assert.equal(nearestItCities("mendrisio")[0].city.slug, "chiasso");
  assert.equal(nearestItCities("biasca")[0].city.slug, "bellinzona");
  assert.match(IT_PLATFORM.registrationUrl, /^https:\/\/christlich-verliebt\.ch\/registration\/\?AID=location$/);
});

test("SEO-Texte: Titel höchstens 60, Descriptions 110–155 Zeichen, keine leeren Alt-Texte", () => {
  for (const page of [IT_HOME, ...IT_CITIES, IT_MAGAZINE, ...IT_ARTICLES]) {
    assert.ok(page.metaTitle.length <= 60, `${page.metaTitle}: ${page.metaTitle.length}`);
    assert.ok(page.description.length >= 110 && page.description.length <= 155, `${page.title}: ${page.description.length}`);
    for (const section of page.sections ?? []) assert.doesNotMatch(section.html, /alt=""/);
  }
});

test("Indexierbar, Registrierung bis zur italienischen ICONY-Oberfläche mit Hinweis auf Deutsch", async () => {
  assert.equal(IT_PILOT_INDEXABLE, true);
  assert.equal(IT_PLATFORM_ITALIAN, false);
  const pages = await readFile(new URL("../components/it-pages.tsx", import.meta.url), "utf8");
  assert.match(pages, /IT_PLATFORM_ITALIAN \? null : <p className=\{itStyles\.notice\} role="note">/);
  assert.match(pages, /La piattaforma in italiano è in costruzione/);
  // Jeder Registrierungslink kündigt die deutschsprachige Zielseite an.
  assert.doesNotMatch(pages, /href=\{IT_PLATFORM\.registrationUrl\}(?! hrefLang="de-CH")/);
  const page = await readFile(new URL("../app/(italiano)/[market]/it/[[...slug]]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /robots: \{ index: IT_PILOT_INDEXABLE && page\.kind !== "legal", follow: true \}/);
  assert.match(page, /market !== "ch"/);
});

test("single-cristiani.ch: Schrägstrich, internes Präfix und alte /it/-Adressen leiten auf die eigene Domain", () => {
  const host = (url) => new NextRequest(url, { headers: { host: new URL(url).host } });
  assert.equal(proxy(host("https://single-cristiani.ch/magazine")).headers.get("location"), "https://single-cristiani.ch/magazine/");
  assert.equal(proxy(host("https://single-cristiani.ch/ch/it/incontri/locarno/")).headers.get("location"), "https://single-cristiani.ch/incontri/locarno/");
  // Alte Stadtadressen ohne /incontri/ (bis 2026-10-20) leiten direkt auf die neue Adresse.
  assert.equal(proxy(host("https://single-cristiani.ch/lugano")).headers.get("location"), "https://single-cristiani.ch/incontri/lugano/");
  assert.equal(proxy(host("https://single-cristiani.ch/ch/it/locarno/")).headers.get("location"), "https://single-cristiani.ch/incontri/locarno/");
  assert.equal(proxy(host("https://christlich-verliebt.ch/it/mendrisio/")).headers.get("location"), "https://single-cristiani.ch/incontri/mendrisio/");
  assert.equal(proxy(host("https://christlich-verliebt.vercel.app/ch/it/locarno/")).headers.get("location"), "https://christlich-verliebt.vercel.app/ch/it/incontri/locarno/");
  assert.equal(proxy(host("https://christlich-verliebt.ch/it")).headers.get("location"), "https://single-cristiani.ch/");
  // Deutsche Schweizer Seiten bleiben unverändert.
  assert.match(proxy(host("https://christlich-verliebt.ch/partnersuche/bern/")).headers.get("x-middleware-rewrite") ?? "", /\/ch\/partnersuche\/bern\/$/);
});

test("single-cristiani.ch: robots erlaubt das Crawlen und nennt die Sitemap mit allen Seiten", async () => {
  const robots = proxy(new NextRequest("https://single-cristiani.ch/robots.txt", { headers: { host: "single-cristiani.ch" } }));
  const robotsText = await robots.text();
  assert.match(robotsText, /User-agent: \*\nAllow: \//);
  assert.match(robotsText, /Sitemap: https:\/\/single-cristiani\.ch\/sitemap\.xml/);
  const sitemap = proxy(new NextRequest("https://single-cristiani.ch/sitemap.xml", { headers: { host: "single-cristiani.ch" } }));
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  for (const city of IT_CITIES) assert.match(xml, new RegExp(`<loc>https://single-cristiani\\.ch/incontri/${city.slug}/</loc>`));
  assert.doesNotMatch(xml, /note-legali|privacy/);
});

test("Eigene Rechtstexte: Betreiber, Vercel Web Analytics und ICONY-Profilfenster sind beschrieben", async () => {
  const legal = await readFile(new URL("../components/it-legal.tsx", import.meta.url), "utf8");
  assert.match(legal, /Christian Mogge Internetdienstleistungen/);
  assert.match(legal, /Vercel Web Analytics/);
  assert.match(legal, /scartato dopo 24 ore/);
  assert.match(legal, /non la conservazione delle statistiche aggregate/);
  assert.match(legal, /js\.icony\.com/);
  const shell = await readFile(new URL("../components/it-pages.tsx", import.meta.url), "utf8");
  assert.match(shell, /itPublicUrl\("note-legali"\)/);
  assert.match(shell, /itPublicUrl\("privacy"\)/);
});

test("Magazin: Artikel mit Datum, Autor, Quellen und Links nur auf bestehende Stadtseiten", async () => {
  assert.ok(IT_ARTICLES.length >= 1);
  const slugs = new Set(IT_CITIES.map((city) => city.slug));
  for (const article of IT_ARTICLES) {
    assert.match(article.slug, /^[a-z0-9-]+$/);
    assert.match(article.modified, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(article.author, "Christian M. Haas");
    assert.ok(article.sources.length > 0);
    for (const section of article.sections) {
      for (const [, slug] of section.html.matchAll(/single-cristiani\.ch\/incontri\/([a-z-]+)\//g)) assert.ok(slugs.has(slug), slug);
      assert.doesNotMatch(section.html, /single-cristiani\.ch\/(?!incontri\/|magazine\/)[a-z]/);
    }
  }
  const hubs = await readFile(new URL("../components/it-hubs.tsx", import.meta.url), "utf8");
  // Quellen eingeklappt (details ohne open), Artikel mit „Aggiornato il …“.
  assert.match(hubs, /<details className=\{hub\.sources\}>/);
  assert.match(hubs, /Aggiornato il/);
});

test("Stadtführer mit belegten Angaben: Kennzahlen, Kirchen mit Adresse, Termine, Treffpunkte, FAQ und Quellen", async () => {
  for (const city of IT_CITIES) {
    const { guide } = city;
    // Titelbild liefert Codex: bis dahin null (kein Platzhalter), Alt-Text steht trotzdem schon fest.
    if (city.heroImage) assert.ok(existsSync(new URL(`../public${city.heroImage}`, import.meta.url)), `${city.heroImage} fehlt`);
    assert.ok(city.heroImageAlt.length > 20, `${city.slug}: Alt-Text`);
    assert.ok(guide.facts.length >= 4, `${city.slug}: Kennzahlen`);
    for (const fact of guide.facts) assert.ok(fact.value && fact.note, `${city.slug}: ${fact.label} ohne Wert/Stand`);
    assert.ok(guide.places.length >= 5, `${city.slug}: Glaubensorte`);
    for (const place of guide.places) {
      assert.match(place.address, /\d{4}\s+\S/, `${city.slug}: ${place.name} ohne PLZ/Ort`);
      assert.ok(place.text.length >= 60, `${city.slug}: ${place.name} zu knapp`);
      if (place.url) assert.match(place.url, /^https:\/\//);
    }
    assert.ok(guide.events.length >= 3, `${city.slug}: Termine`);
    assert.ok(guide.dateSpots.length >= 4, `${city.slug}: Treffpunkte`);
    assert.ok(guide.faq.length >= 3, `${city.slug}: FAQ`);
    assert.ok(guide.sources.length >= 5, `${city.slug}: Quellen`);
    for (const source of guide.sources) assert.match(source.url, /^https?:\/\//);
    // Dauerhaft gültige Inhalte: keine Fahrzeiten und keine Jahresangaben ab 2025 in Texten (Statistik-Stichtage nur in den Kennzahlen).
    const text = JSON.stringify({ sections: city.sections, places: guide.places, communities: guide.communities, events: guide.events, dateSpots: guide.dateSpots, faq: guide.faq });
    assert.doesNotMatch(text.replace(/Ticino in cifre 2026|https?:[^"\s]+/g, ""), /\b20(?:2[5-9]|[3-9]\d)\b/, `${city.slug}: Jahresangabe`);
    assert.doesNotMatch(text, /\d+\s*minuti di treno|a \d+ minuti/,`${city.slug}: Fahrzeit`);
    // Keine Floskel-Abschnitte mehr: jeder Abschnitt nennt etwas Konkretes (Link oder Zahl).
    for (const section of city.sections) assert.match(section.html, /<a href="https:|\d/, `${city.slug}: ${section.heading} ohne Beleg`);
  }
  assert.ok(IT_HOME.guide.facts.length >= 4);
  assert.ok(IT_HOME.guide.faq.length >= 5);
  const pages = await readFile(new URL("../components/it-pages.tsx", import.meta.url), "utf8");
  // Quellen eingeklappt (details ohne open), 13 px, am Seitenende.
  assert.match(pages, /<details className=\{itStyles\.sources\}>/);
  assert.doesNotMatch(pages, /<details[^>]*\bopen\b/);
  const css = await readFile(new URL("../components/it-pages.module.css", import.meta.url), "utf8");
  assert.match(css, /\.sources \{[^}]*font-size: 13px/);
});
