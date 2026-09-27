import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { buildSearchIndex, normalizeSearch, SEARCH_PATH, searchIndex } from "../lib/search.ts";

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
