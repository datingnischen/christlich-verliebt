import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { pages } = JSON.parse(await readFile(new URL("../data/public-pages.json", import.meta.url), "utf8"));

// „Lаusanne“ mit kyrillischem а stand im Titel und im Hub-Link: Google las ein anderes Wort (Semrush, 2026-10-28).
test("keine kyrillischen Buchstaben in deutschsprachigen Seitendaten", () => {
  const hits = pages.flatMap(page => ["title", "heroTitle", "description", "contentHtml"]
    .filter(field => /[Ѐ-ӿ]/.test(page[field] ?? ""))
    .map(field => `${page.market}${page.path} ${field}`));
  assert.deepEqual(hits, []);
});

// Schweizer Hochdeutsch kennt kein ß; auf .ch wirkt es wie übernommener deutscher Text.
test("christlich-verliebt.ch schreibt ss statt ß", () => {
  const hits = pages.filter(page => page.market === "ch")
    .filter(page => ["title", "heroTitle", "description", "contentHtml"].some(field => (page[field] ?? "").includes("ß")))
    .map(page => page.path);
  assert.deepEqual(hits, []);
});

test("CH-Descriptions liegen zwischen 110 und 150 Zeichen", () => {
  const off = pages.filter(page => page.market === "ch")
    .filter(page => page.description.length < 110 || page.description.length > 150)
    .map(page => `${page.path} (${page.description.length})`);
  assert.deepEqual(off, []);
});
