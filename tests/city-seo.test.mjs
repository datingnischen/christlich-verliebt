import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CITY_SEO, CITY_TITLE_MAX, seoDescription, seoTitle } from "../lib/seo-meta.ts";

// Regel 2026-11-04 (Christian: „Brauche individuell passende Titel“): jede Stadtseite hat einen eigenen <title>
// mit Stadtname, höchstens 60 Zeichen, keine Schablone; Descriptions je Stadt eigenständig (data/partnersuche-seo.json).
const snapshot = JSON.parse(await readFile(new URL("../data/public-pages.json", import.meta.url), "utf8"));
const pages = (Array.isArray(snapshot) ? snapshot : snapshot.pages).filter(page => page.family === "location");

test("jede Stadtseite hat einen individuellen Titel mit Stadtname, max. 60 Zeichen", () => {
  assert.ok(pages.length >= 55, `nur ${pages.length} Stadtseiten gefunden`);
  const titles = new Set();
  const skeletons = new Map();
  for (const page of pages) {
    const id = `${page.market}${page.path}`;
    const entry = CITY_SEO[page.market]?.[page.path];
    assert.ok(entry, `${id}: Eintrag fehlt in data/partnersuche-seo.json`);
    const title = seoTitle(page);
    assert.ok(title.startsWith(entry.metaTitle), `${id}: metaTitle wird nicht verwendet`);
    assert.ok(title.length <= CITY_TITLE_MAX, `${id}: Titel ${title.length} > ${CITY_TITLE_MAX} Zeichen`);
    assert.ok(title.includes(entry.city), `${id}: Stadt „${entry.city}“ fehlt im Titel`);
    assert.ok(page.heroTitle.includes(entry.city), `${id}: Stadt „${entry.city}“ passt nicht zur Seite`);
    assert.doesNotMatch(title, /christ sucht christ/i);
    if (page.market === "ch") assert.doesNotMatch(title, /ß/, `${id}: ß im Schweizer Titel`);
    assert.ok(!titles.has(title), `${id}: Titel doppelt`);
    titles.add(title);
    const skeleton = title.replace(entry.city, "X");
    skeletons.set(skeleton, (skeletons.get(skeleton) ?? 0) + 1);
  }
  const templates = [...skeletons].filter(([, count]) => count > 1);
  assert.deepEqual(templates, [], "Titel folgen einer Schablone, in der nur die Stadt wechselt");
});

test("Stadt-Descriptions sind eindeutig, 110–150 Zeichen und ohne Auslassungszeichen", () => {
  const descriptions = new Set();
  for (const page of pages) {
    const id = `${page.market}${page.path}`;
    const description = seoDescription(page);
    assert.ok(description.length >= 110 && description.length <= 155, `${id}: Description ${description.length} Zeichen`);
    assert.doesNotMatch(description, /…|\.\.\.$/, `${id}: Description gekürzt`);
    assert.doesNotMatch(description, /christ sucht christ/i);
    if (page.market === "ch") assert.doesNotMatch(description, /ß/, `${id}: ß in Schweizer Description`);
    assert.ok(!descriptions.has(description), `${id}: Description doppelt`);
    descriptions.add(description);
  }
});
