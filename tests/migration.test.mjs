import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const snapshot = JSON.parse(await readFile(new URL("../data/public-pages.json", import.meta.url), "utf8"));
const pages = snapshot.pages;

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

test("location and magazine registration contexts are wired", async () => {
  const source = await readFile(new URL("../lib/content.ts", import.meta.url), "utf8");
  assert.match(source, /family === "location"/);
  assert.match(source, /\?aid=\$\{aid\}/);
  assert.match(source, /"magazin"/);
  assert.match(source, /renderedContentHtml/);
  assert.match(source, /selectPageImage/);
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
  assert.match(proxySource, /x-forwarded-host/);
});
