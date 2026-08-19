import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const snapshot = JSON.parse(await readFile(new URL("../data/public-pages.json", import.meta.url), "utf8"));
const pages = snapshot.pages;
const provenance = JSON.parse(await readFile(new URL("../data/asset-provenance.json", import.meta.url), "utf8"));
const cityImageOverrides = JSON.parse(await readFile(new URL("../data/city-image-overrides.json", import.meta.url), "utf8"));
const magazineCategories = JSON.parse(await readFile(new URL("../data/magazine-categories.json", import.meta.url), "utf8"));
const sourceByAsset = new Map(provenance.map(asset => [asset.localPath, asset.sourceUrl]));

test("contains public editorial inventories for DE, AT and CH", () => {
  const counts = Object.fromEntries(["de", "at", "ch"].map(market => [market, pages.filter(page => page.market === market).length]));
  assert.ok(counts.de >= 90, `DE only has ${counts.de} pages`);
  assert.ok(counts.at >= 20, `AT only has ${counts.at} pages`);
  assert.ok(counts.ch >= 25, `CH only has ${counts.ch} pages`);
  for (const market of ["de", "at", "ch"]) {
    assert.ok(pages.some(page => page.market === market && page.path === "/"));
    assert.ok(pages.some(page => page.market === market && page.path === "/partnersuche/"));
  }
  assert.equal(pages.some(page => page.path === "/magazin/beispiel-seite/"), false);
});

test("DE location hub uses city cards instead of a duplicate city link list", () => {
  const hub = pages.find(page => page.market === "de" && page.path === "/partnersuche/");
  assert.ok(hub, "DE location hub is missing");
  assert.doesNotMatch(hub.contentHtml, /umfassende Liste mit Städten und Regionen/i);
  assert.doesNotMatch(hub.contentHtml, /<a\b[^>]*href=["'][^"']+\/partnersuche\/(?!["'])/i);
  assert.ok(pages.some(page => page.market === "de" && page.family === "location"));
});

test("location cards use descriptive city-specific anchor text", async () => {
  const source = await readFile(new URL("../lib/content.ts", import.meta.url), "utf8");
  const pageSource = await readFile(new URL("../app/[market]/[[...slug]]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Christliche Singles in \$\{locationName\(page\)\}/);
  assert.match(pageSource, />\{cardLinkLabel\(child\)\}<\/a>/);
});

test("snapshot excludes executable markup and private member media", () => {
  const html = pages.map(page => page.contentHtml).join("\n");
  assert.doesNotMatch(html, /<(?:script|iframe|form|input|button|select|textarea)\b/i);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /(?:href|src)=["']\s*(?:javascript|data|file):/i);
  assert.doesNotMatch(html, /cdn[123]\.icony-hosting\.de|\/user-media\//i);
  assert.doesNotMatch(html, /class=["'][^"']*grid-view/i);
});

test("canonicals and imported resources stay market-specific", () => {
  for (const page of pages) {
    assert.equal(new URL(page.canonical).hostname, page.domain);
    assert.equal(new URL(page.canonical).pathname, page.path);
    const sources = [...page.contentHtml.matchAll(/src=["']([^"']+)/gi)].map(match => match[1]);
    assert.ok(sources.every(src => src.startsWith("/imported/")), `${page.path} has remote src`);
  }
});

test("every referenced imported asset exists on disk", async () => {
  const sources = new Set(pages.flatMap(page => [page.heroImage, ...[...page.contentHtml.matchAll(/src=["']([^"']+)/gi)].map(match => match[1])]).filter(Boolean));
  for (const source of sources) {
    if (!source.startsWith("/imported/") && !source.startsWith("/city-images/")) continue;
    await access(new URL(`../public${source}`, import.meta.url));
  }
});

test("every location card has a real local image with provenance", async () => {
  const locations = pages.filter(page => page.family === "location");
  assert.equal(locations.length, 51);
  assert.ok(locations.every(page => page.heroImage), "A location still uses the decorative fallback");
  assert.equal(cityImageOverrides.images.length, 20);
  for (const image of cityImageOverrides.images) {
    assert.match(image.sourcePage, /^https:\/\/commons\.wikimedia\.org\//);
    assert.ok(image.license || image.rightsStatus.includes("Public domain"));
    await access(new URL(`../public${image.localPath}`, import.meta.url));
  }
});

test("magazine categories are imported and rendered as jump targets", async () => {
  assert.deepEqual(magazineCategories.categories.map(category => category.name), [
    "Allgemein",
    "Beziehung & Werte",
    "Christliche Feiertage",
    "Christliche Persönlichkeiten",
    "Christliche Singlebörsen",
  ]);
  const categorized = pages.filter(page => page.family === "magazine" && page.categories.length);
  assert.ok(categorized.length >= 59, `Only ${categorized.length} magazine articles have categories`);
  const source = await readFile(new URL("../app/[market]/[[...slug]]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /id="magazin-kategorien"/);
  assert.match(source, /id=\{`kategorie-\$\{category\.slug\}`\}/);
});

test("WordPress magazine articles retain local editorial images and audio", () => {
  const article = pages.find(page => page.market === "de" && page.path === "/magazin/antrag-ohne-ring/");
  assert.ok(article, "WordPress reference article is missing");
  assert.match(article.contentHtml, /<img\b[^>]*src=["']\/imported\/de\//i);
  assert.match(article.contentHtml, /<audio\b[^>]*controls/i);
  assert.match(article.contentHtml, /<source\b[^>]*src=["']\/imported\/de\/[^"']+\.mp3/i);
});

test("location heroes prefer real city imagery over statistics graphics", () => {
  for (const page of pages.filter(page => page.family === "location" && page.heroImage)) {
    assert.doesNotMatch(sourceByAsset.get(page.heroImage) ?? "", /statistik|infografik/i, page.path);
  }
});

test("location and magazine registration contexts are wired", async () => {
  const source = await readFile(new URL("../lib/content.ts", import.meta.url), "utf8");
  assert.match(source, /family === "location"/);
  assert.match(source, /\?aid=\$\{aid\}/);
  assert.match(source, /"magazin"/);
  assert.match(source, /renderedContentHtml/);
  assert.match(source, /selectPageImage/);
  assert.match(source, /registration-cta/);
  const pageSource = await readFile(new URL("../app/[market]/[[...slug]]/page.tsx", import.meta.url), "utf8");
  assert.match(pageSource, /registrationUrl\(page\)/);
  assert.match(pageSource, /registrationHref=\{register\}/);
  assert.match(pageSource, /dangerouslySetInnerHTML=\{\{ __html: contentHtml \}\}/);
  assert.match(pageSource, /alternates: \{ canonical: page\.canonical \}/);
});

test("routing recognizes all three markets and protects production canonicals", async () => {
  const marketSource = await readFile(new URL("../lib/markets.ts", import.meta.url), "utf8");
  const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
  for (const domain of ["christlich-verliebt.de", "christlich-verliebt.at", "christlich-verliebt.ch"]) {
    assert.match(marketSource + proxySource, new RegExp(domain.replaceAll(".", "\\.")));
  }
  assert.match(proxySource, /NextResponse\.redirect\(canonical, 308\)/);
  assert.doesNotMatch(proxySource, /headers\.get\("x-forwarded-host"\)/);
});
