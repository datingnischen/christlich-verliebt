import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { buildSearchIndex, normalizeSearch, SEARCH_PATH, searchIndex, stripBrandSuffix } from "../lib/search.ts";

const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const exists = path => access(new URL(`../${path}`, import.meta.url)).then(() => true, () => false);

test("site search lives below /ueber-uns/ per market, never as root /suche", async () => {
  assert.equal(SEARCH_PATH, "/ueber-uns/suche/");
  assert.ok(await exists("app/[market]/ueber-uns/suche/page.tsx"));
  assert.equal(await exists("app/[market]/suche"), false);
  assert.equal(await exists("app/suche"), false);
  const pages = JSON.parse(await source("data/public-pages.json")).pages;
  assert.equal(pages.some(page => page.path === SEARCH_PATH), false);
});

test("search page is noindex with a query-free canonical and stays out of the sitemap", async () => {
  const page = await source("app/[market]/ueber-uns/suche/page.tsx");
  assert.match(page, /robots: \{ index: false, follow: true \}/);
  assert.match(page, /canonical: publicUrl\(market, SEARCH_PATH\)/);
  const sitemap = await source("app/[market]/sitemap-data.xml/route.ts");
  assert.doesNotMatch(sitemap, /SEARCH_PATH|suche/);
});

test("header and about hub link the search", async () => {
  assert.match(await source("components/site-shell.tsx"), /previewPath\(market, SEARCH_PATH\)/);
  assert.match(await source("app/[market]/ueber-uns/page.tsx"), /<SiteSearchForm market=\{market\} \/>/);
});

test("search normalises umlauts and ranks title hits first", () => {
  assert.equal(normalizeSearch("Zürich Straße"), normalizeSearch("zuerich strasse"));
  assert.equal(normalizeSearch("Café"), "cafe");
  const index = buildSearchIndex([
    { market: "de", path: "/magazin/a/", family: "magazine", title: "Glaube im Alltag", heroTitle: "", description: "Ein Text über München.", contentHtml: "<p>Mehr</p>" },
    { market: "de", path: "/partnersuche/muenchen/", family: "location", title: "Christliche Singles in München", heroTitle: "", description: "", contentHtml: "<p>Stadt</p>" },
    { market: "de", path: "/", family: "home", title: "München Start", heroTitle: "", description: "", contentHtml: "" },
  ]);
  const hits = searchIndex(index, "muenchen");
  assert.deepEqual(hits.map(hit => hit.path), ["/partnersuche/muenchen/", "/magazin/a/"]);
  assert.equal(hits[0].section, "Stadt");
  assert.deepEqual(searchIndex(index, "   "), []);
});

test("search results drop the imported brand suffix from titles", () => {
  assert.equal(stripBrandSuffix("Sehr starke Gebete - Christlich-Verliebt.de"), "Sehr starke Gebete");
  assert.equal(stripBrandSuffix("Advent – Bedeutung– christlich-verliebt.de"), "Advent – Bedeutung");
  assert.equal(stripBrandSuffix("Das Gebet \"Das Vater unser\"- Christlich-Verliebt.de"), "Das Gebet \"Das Vater unser\"");
  assert.equal(stripBrandSuffix("Glaube | Christlich-Verliebt"), "Glaube");
  assert.equal(stripBrandSuffix("Christlich-verliebt auf Social Media"), "Christlich-verliebt auf Social Media");
  const [entry] = buildSearchIndex([{ market: "de", path: "/magazin/g/", family: "magazine", title: "Gebete - Christlich-Verliebt.de", heroTitle: "Gebete", description: "", contentHtml: "" }]);
  assert.equal(entry.title, "Gebete");
  assert.doesNotMatch(entry.titleKey, /verliebt/);
});

test("search drops a glued brand prefix but keeps titles about the brand", () => {
  assert.equal(stripBrandSuffix("Christlich-Verliebt.de Dietrich Bonhoeffer"), "Dietrich Bonhoeffer");
  assert.equal(stripBrandSuffix("Christlich-Verliebt.de Samuel Koch - Christlich-Verliebt.de"), "Samuel Koch");
  assert.equal(stripBrandSuffix("christlich-verliebt.ch Glaube"), "Glaube");
  assert.equal(stripBrandSuffix("Christlich-verliebt.de – die christliche Singlebörse"), "Christlich-verliebt.de – die christliche Singlebörse");
  assert.equal(stripBrandSuffix("Christlich-Verliebt.de"), "Christlich-Verliebt.de");
});

test("no magazine title starts with the brand; page overrides are applied to the snapshot", async () => {
  const pages = JSON.parse(await source("data/public-pages.json")).pages;
  const overrides = JSON.parse(await source("data/page-overrides.json")).pages;
  const brandPrefix = /^\s*christlich[\s-]?verliebt(?:\.(?:de|at|ch))?\b/i;
  // Ausnahme: das Porträt der eigenen Singlebörse, dort ist die Marke das Thema.
  const offenders = pages.filter(page => page.family.startsWith("magazine") && page.path !== "/magazin/christlich-verliebt-de/")
    .filter(page => brandPrefix.test(page.title) || brandPrefix.test(page.heroTitle) || brandPrefix.test(page.description));
  assert.deepEqual(offenders.map(page => `${page.market}:${page.path}`), []);
  assert.ok(overrides.length >= 11);
  for (const override of overrides) {
    const page = pages.find(item => item.market === override.market && item.path === override.path);
    assert.ok(page, `${override.market}:${override.path} missing`);
    for (const [field, change] of Object.entries(override.fields)) {
      assert.equal(page[field], change.to, `${override.path} ${field}`);
      assert.doesNotMatch(change.to, /sein Botschaft|Ihre Kampf|die Glaube|in der KZ|zur Glaube/);
    }
  }
  const [bonhoeffer] = searchIndex(buildSearchIndex(pages.filter(page => page.market === "de")), "Bonhoeffer");
  assert.equal(bonhoeffer.path, "/magazin/dietrich-bonhoeffer/");
  assert.equal(bonhoeffer.title, "Dietrich Bonhoeffer");
});

test("search ranks by relevance tier, then by frequency, then alphabetically", () => {
  const page = (path, family, title, description, contentHtml) => ({ market: "de", path, family, title, heroTitle: "", description, contentHtml });
  const index = buildSearchIndex([
    page("/partnersuche/augsburg/", "location", "Christliche Partnersuche in Augsburg", "", "<p>Nahe München.</p>"),
    page("/partnersuche/berlin/", "location", "Christliche Partnersuche in Berlin", "", "<p>Weit weg von München.</p>"),
    page("/magazin/staedte/", "magazine", "Top Städte - Christlich-Verliebt.de", "", "<p>München, München und nochmals München.</p>"),
    page("/magazin/bayern/", "magazine", "Glaube in Bayern", "Kirchen in München entdecken.", "<p>Text</p>"),
    page("/magazin/muenchen-tipps/", "magazine", "München für Paare", "", "<p>Tipps</p>"),
    page("/magazin/leben/", "magazine", "Leben und Glauben in München", "", "<p>Mehr</p>"),
    page("/partnersuche/muenchen/", "location", "Christliche Partnersuche in München", "", "<p>Stadt</p>"),
  ]);
  assert.deepEqual(searchIndex(index, "München").map(hit => hit.path), [
    "/partnersuche/muenchen/",
    "/magazin/muenchen-tipps/",
    "/magazin/leben/",
    "/magazin/bayern/",
    "/magazin/staedte/",
    "/partnersuche/augsburg/",
    "/partnersuche/berlin/",
  ]);
  const hits = searchIndex(index, "münchen");
  assert.equal(hits.find(hit => hit.path === "/magazin/staedte/").count, 3);
  assert.equal(hits.find(hit => hit.path === "/magazin/staedte/").title, "Top Städte");
});
