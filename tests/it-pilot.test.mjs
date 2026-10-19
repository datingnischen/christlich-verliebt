import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";
import { IT_CITIES, IT_HOME, IT_PILOT_INDEXABLE, IT_PLATFORM, itPublicUrl, itWidgetUrl, nearestItCities } from "../lib/it-pilot.ts";

test("Italienische Variante: Vorschau /ch/it/ und Live-Host /it/ landen auf derselben Route", () => {
  const preview = proxy(new NextRequest("https://christlich-verliebt.vercel.app/ch/it/lugano/", { headers: { host: "christlich-verliebt.vercel.app" } }));
  assert.match(preview.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/lugano\/$/);
  const live = proxy(new NextRequest("https://christlich-verliebt.ch/it/lugano/", { headers: { host: "christlich-verliebt.ch" } }));
  assert.match(live.headers.get("x-middleware-rewrite") ?? "", /\/ch\/it\/lugano\/$/);
});

test("Fünf Tessiner Städte mit PLZ, Schweizer ICONY-Fenster und Live-URLs unter /it/", () => {
  assert.deepEqual(IT_CITIES.map((city) => city.slug), ["lugano", "bellinzona", "locarno", "mendrisio", "chiasso"]);
  for (const city of IT_CITIES) {
    assert.match(city.postcode, /^6\d{3}$/);
    assert.equal(itWidgetUrl(city.postcode), `https://js.icony.com/frame/?h=300&id=christlichverliebtch&pc=CE302F&z=${city.postcode}&ds=&ctr=41&it=1`);
  }
  assert.equal(itPublicUrl(), "https://christlich-verliebt.ch/it/");
  assert.equal(itPublicUrl("chiasso"), "https://christlich-verliebt.ch/it/chiasso/");
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
  assert.match(page, /robots: \{ index: IT_PILOT_INDEXABLE, follow: true \}/);
  assert.match(page, /market !== "ch"/);
});
