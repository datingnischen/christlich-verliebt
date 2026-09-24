import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MARKET_CODES, getMarket, individualSearchUrl } from "../lib/markets.ts";

const pageSource = await readFile(new URL("../app/[market]/[[...slug]]/page.tsx", import.meta.url), "utf8");
const componentSource = await readFile(new URL("../components/city-search-fallback.tsx", import.meta.url), "utf8");

test("city overview renders the individual search fallback", () => {
  assert.match(pageSource, /import \{ CitySearchFallback \} from "@\/components\/city-search-fallback"/);
  assert.match(pageSource, /page\.family === "location-hub" \? <CitySearchFallback market=\{page\.market\} \/>/);
  assert.match(componentSource, /href=\{individualSearchUrl\(market\)\}/);
  assert.match(componentSource, /Zur individuellen Suche/);
});

test("individual search links point to /suche/ on the live domain of each market", () => {
  for (const market of MARKET_CODES) {
    const url = individualSearchUrl(market);
    assert.equal(url, `https://${getMarket(market).domain}/suche/?AID=location`);
    assert.doesNotMatch(url, /vercel\.app/);
  }
});
