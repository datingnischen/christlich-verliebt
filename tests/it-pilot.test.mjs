import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";
import { IT_CITIES, IT_HOME, IT_PILOT_INDEXABLE, IT_PLATFORM, itPublicUrl, itWidgetUrl, nearestItCities } from "../lib/it-pilot.ts";

test("Italienische Variante: Vorschau /ch/it/ und single-cristiani.ch landen auf derselben Route", () => {
  const preview = proxy(new NextRequest("https://christlich-verliebt.vercel.app/ch/it/lugano/", { headers: { host: "christlich-verliebt.vercel.app" } }));
  assert.match(preview.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/lugano\/$/);
  const live = proxy(new NextRequest("https://single-cristiani.ch/lugano/", { headers: { host: "single-cristiani.ch" } }));
  assert.match(live.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/lugano\/$/);
  const home = proxy(new NextRequest("https://www.single-cristiani.ch/", { headers: { host: "www.single-cristiani.ch" } }));
  assert.match(home.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it$/);
  const legal = proxy(new NextRequest("https://single-cristiani.ch/privacy/", { headers: { host: "single-cristiani.ch" } }));
  assert.match(legal.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/privacy\/$/);
});

test("Fünf Tessiner Städte mit PLZ, Schweizer ICONY-Fenster und Live-URLs unter /it/", () => {
  assert.deepEqual(IT_CITIES.map((city) => city.slug), ["lugano", "bellinzona", "locarno", "mendrisio", "chiasso"]);
  for (const city of IT_CITIES) {
    assert.match(city.postcode, /^6\d{3}$/);
    assert.equal(itWidgetUrl(city.postcode), `https://js.icony.com/frame/?h=300&id=christlichverliebtch&pc=CE302F&z=${city.postcode}&ds=&ctr=41&it=1`);
  }
  assert.equal(itPublicUrl(), "https://single-cristiani.ch/");
  assert.equal(itPublicUrl("chiasso"), "https://single-cristiani.ch/chiasso/");
  assert.equal(nearestItCities("mendrisio")[0].city.slug, "chiasso");
  assert.match(IT_PLATFORM.registrationUrl, /^https:\/\/christlich-verliebt\.ch\/registration\/\?AID=location$/);
});

test("SEO-Texte: Titel höchstens 60, Descriptions 110–155 Zeichen, keine leeren Alt-Texte", () => {
  for (const page of [IT_HOME, ...IT_CITIES]) {
    assert.ok(page.metaTitle.length <= 60, `${page.metaTitle}: ${page.metaTitle.length}`);
    assert.ok(page.description.length >= 110 && page.description.length <= 155, `${page.title}: ${page.description.length}`);
    for (const section of page.sections) assert.doesNotMatch(section.html, /alt=""/);
  }
});

test("Pilot bleibt noindex, bis ICONY die italienische Registrierung ausliefert", async () => {
  assert.equal(IT_PILOT_INDEXABLE, false);
  const page = await readFile(new URL("../app/[market]/it/[[...slug]]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /robots: \{ index: IT_PILOT_INDEXABLE && page\.kind !== "legal", follow: true \}/);
  assert.match(page, /market !== "ch"/);
});

test("single-cristiani.ch: Schrägstrich, internes Präfix und alte /it/-Adressen leiten auf die eigene Domain", () => {
  const host = (url) => new NextRequest(url, { headers: { host: new URL(url).host } });
  assert.equal(proxy(host("https://single-cristiani.ch/lugano")).headers.get("location"), "https://single-cristiani.ch/lugano/");
  assert.equal(proxy(host("https://single-cristiani.ch/ch/it/locarno/")).headers.get("location"), "https://single-cristiani.ch/locarno/");
  assert.equal(proxy(host("https://christlich-verliebt.ch/it/mendrisio/")).headers.get("location"), "https://single-cristiani.ch/mendrisio/");
  assert.equal(proxy(host("https://christlich-verliebt.ch/it")).headers.get("location"), "https://single-cristiani.ch/");
  // Deutsche Schweizer Seiten bleiben unverändert.
  assert.match(proxy(host("https://christlich-verliebt.ch/partnersuche/bern/")).headers.get("x-middleware-rewrite") ?? "", /\/ch\/partnersuche\/bern\/$/);
});

test("single-cristiani.ch: robots erlaubt das Crawlen, Sitemap erst nach Freigabe", async () => {
  const robots = proxy(new NextRequest("https://single-cristiani.ch/robots.txt", { headers: { host: "single-cristiani.ch" } }));
  assert.match(await robots.text(), /User-agent: \*\nAllow: \//);
  const sitemap = proxy(new NextRequest("https://single-cristiani.ch/sitemap.xml", { headers: { host: "single-cristiani.ch" } }));
  assert.equal(sitemap.status, 404);
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
