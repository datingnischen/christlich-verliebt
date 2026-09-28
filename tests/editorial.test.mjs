import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { VIDEOS, videoJsonLd } from "../lib/videos.ts";

const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const exists = path => access(new URL(`../${path}`, import.meta.url)).then(() => true, () => false);

const editorial = JSON.parse(await source("data/editorial-pages.json"));
const imported = JSON.parse(await source("data/public-pages.json")).pages;
const knownPaths = new Set([...imported, ...editorial.pages].map(page => `${page.market}:${page.path}`));

test("editorial pages follow the imported page contract and never collide with WordPress pages", async () => {
  assert.ok(editorial.pages.length >= 1);
  const seen = new Set();
  for (const page of editorial.pages) {
    assert.match(page.path, /^\/(?:[a-z0-9-]+\/)+$/, `${page.path} must be lowercase with a trailing slash`);
    assert.equal(page.canonical, `https://${page.domain}${page.path}`);
    assert.ok(["de", "at", "ch"].includes(page.market));
    assert.ok(["magazine", "guide", "editorial"].includes(page.family));
    assert.ok(page.title.length <= 60, `${page.path}: title too long (${page.title.length})`);
    assert.ok(page.description.length >= 110 && page.description.length <= 155, `${page.path}: description ${page.description.length} chars`);
    assert.equal(imported.some(item => item.market === page.market && item.path === page.path), false, `${page.path} also exists in the WordPress import`);
    assert.equal(seen.has(`${page.market}:${page.path}`), false);
    seen.add(`${page.market}:${page.path}`);
    assert.ok(page.heroImage && await exists(`public${page.heroImage}`), `${page.path}: hero image missing on disk`);
    if (page.updated) assert.match(page.updated, /^\d{4}-\d{2}-\d{2}$/);
    if (page.videoId) assert.ok(VIDEOS[page.videoId], `${page.path}: unknown video ${page.videoId}`);
  }
});

test("editorial content stays static markup with resolvable site links", () => {
  for (const page of editorial.pages) {
    assert.doesNotMatch(page.contentHtml, /<(?:script|iframe|form|input|button|select|textarea|img)\b/i);
    assert.doesNotMatch(page.contentHtml, /\son[a-z]+\s*=/i);
    for (const [, href] of page.contentHtml.matchAll(/href=["']([^"']+)["']/gi)) {
      const url = new URL(href);
      if (!/^christlich-verliebt\.(de|at|ch)$/.test(url.hostname)) continue;
      const market = url.hostname.split(".").at(-1);
      // ICONY-Seiten (Registrierung, *.html) bleiben absolute Links auf die Live-Domain.
      if (url.pathname.startsWith("/registration/") || url.pathname.endsWith(".html")) continue;
      assert.ok(knownPaths.has(`${market}:${url.pathname}`), `${page.path} links to unknown page ${href}`);
    }
  }
});

test("videos load YouTube only after a click and carry chapter markup", async () => {
  const embed = await source("components/video-embed.tsx");
  assert.match(embed, /^"use client";/);
  assert.match(embed, /useState/);
  assert.doesNotMatch(embed, /www\.youtube\.com\/embed/);
  const videos = await source("lib/videos.ts");
  assert.match(videos, /youtube-nocookie\.com\/embed/);
  for (const video of Object.values(VIDEOS)) {
    assert.ok(await exists(`public${video.thumbnail}`), `${video.id}: thumbnail missing`);
    assert.ok(knownPaths.has(`de:${video.articlePath}`), `${video.id}: article ${video.articlePath} missing`);
    assert.ok(video.chapters.length >= 3);
    const graph = videoJsonLd(video, "https://example.test/#video");
    assert.equal(graph["@type"], "VideoObject");
    assert.match(graph.duration, /^PT\d+M\d+S$/);
    assert.equal(graph.hasPart.length, video.chapters.length);
    assert.equal(graph.hasPart.at(-1).endOffset, video.durationSeconds);
    assert.ok(graph.hasPart.every((clip, index) => index === 0 || clip.startOffset > graph.hasPart[index - 1].startOffset));
  }
  const article = await source("app/[market]/[[...slug]]/page.tsx");
  assert.match(article, /<VideoEmbed video=\{video\}/);
  assert.match(article, /Aktualisiert am \{formatUpdated\(page\.updated\)\}/);
  const profile = await source("app/[market]/magazin/christian-m-haas/page.tsx");
  assert.match(profile, /<VideoEmbed video=\{video\}/);
  assert.match(profile, /videoJsonLd\(video/);
});
