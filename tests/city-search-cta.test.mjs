import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MARKET_CODES, citySearchUrl, getMarket, individualSearchUrl } from "../lib/markets.ts";
import cityWidgets from "../data/city-widgets.json" with { type: "json" };

const citySource = await readFile(new URL("../components/city-page.tsx", import.meta.url), "utf8");

// Christian, 18.11.2026: Die PLZ muss immer mit in die Suche, sonst startet die Stadtkarte ohne Umkreis.
test("die Stadtkarte verlinkt die Suche mit der PLZ der Stadt", () => {
  assert.match(citySource, /href=\{citySearchUrl\(page\.market, cityWidget\.postcode\)\}/);
});

test("citySearchUrl hängt die PLZ des Marktes an, sonst offene Suche", () => {
  assert.equal(citySearchUrl("de", "34117"), "https://christlich-verliebt.de/suche/?plz=34117&AID=location");
  assert.equal(citySearchUrl("at", "1010"), "https://christlich-verliebt.at/suche/?plz=1010&AID=location");
  assert.equal(citySearchUrl("ch", "8001"), "https://christlich-verliebt.ch/suche/?plz=8001&AID=location");
  assert.equal(citySearchUrl("de", "1010"), individualSearchUrl("de"));
  assert.equal(citySearchUrl("at", "34117"), individualSearchUrl("at"));
  assert.equal(citySearchUrl("de", null), individualSearchUrl("de"));
});

test("jede Stadt mit Widget hat eine PLZ, die zur Suche ihres Marktes passt", () => {
  const widgets = cityWidgets.widgets ?? cityWidgets;
  assert.ok(widgets.length > 0);
  for (const widget of widgets) {
    assert.ok(MARKET_CODES.includes(widget.market), widget.path);
    assert.equal(
      citySearchUrl(widget.market, widget.postcode),
      `https://${getMarket(widget.market).domain}/suche/?plz=${widget.postcode}&AID=location`,
      `${widget.market}:${widget.path}`,
    );
  }
});
