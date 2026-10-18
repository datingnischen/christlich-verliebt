import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { cleanArticleTitle, MAGAZINE_AUTHOR_PROFILE, pickRelatedArticles, RELATED_COUNT, relatedArticlesHtml } from "../lib/magazine-related.ts";

// Semrush (Trello #1249, 2026-10-18): 16 Magazinbeiträge hatten nur einen eingehenden internen Link.
const snapshot = JSON.parse(await readFile(new URL("../data/public-pages.json", import.meta.url), "utf8"));
const wp = JSON.parse(await readFile(new URL("../data/wp-posts.json", import.meta.url), "utf8"));
const dated = new Set(wp.posts.map(post => `/magazin/${post.slug}/`));
const articles = snapshot.pages.filter(page => page.market === "de" && page.family === "magazine" && page.path !== MAGAZINE_AUTHOR_PROFILE && (dated.has(page.path) || page.updated));

test("every magazine article is linked from at least two other articles", () => {
  const incoming = new Map(articles.map(article => [article.path, 0]));
  for (const article of articles) {
    const related = pickRelatedArticles(article, articles);
    assert.equal(related.length, RELATED_COUNT, article.path);
    assert.ok(!related.some(item => item.path === article.path || item.path === MAGAZINE_AUTHOR_PROFILE), article.path);
    assert.equal(new Set(related.map(item => item.path)).size, RELATED_COUNT, `${article.path}: doppelte Ziele`);
    for (const item of related) incoming.set(item.path, incoming.get(item.path) + 1);
  }
  const weak = [...incoming].filter(([, count]) => count < 2).map(([path]) => path);
  assert.deepEqual(weak, []);
  for (const slug of ["c-s-lewis", "chringles-de", "christliche-tattoos", "gruendonnerstag", "die-10-gebote", "samuel-koch", "nick-vujicic"]) {
    assert.ok(incoming.get(`/magazin/${slug}/`) >= 2, slug);
  }
});

test("same category comes first and the selection rotates per article", () => {
  const lewis = articles.find(article => article.path === "/magazin/c-s-lewis/");
  const related = pickRelatedArticles(lewis, articles);
  assert.ok(related.slice(0, 2).every(item => item.categories.includes("christliche-persoenlichkeiten")), related.map(item => item.path).join(", "));
  const koch = articles.find(article => article.path === "/magazin/samuel-koch/");
  assert.notDeepEqual(pickRelatedArticles(koch, articles).map(item => item.path), related.map(item => item.path));
});

test("the block uses article titles as link text and escapes HTML", () => {
  const html = relatedArticlesHtml([{ href: "/de/magazin/a/", title: 'Glaube & "Liebe" <3' }]);
  assert.match(html, /<section class="magazine-related" aria-labelledby="weiterlesen-im-magazin">/);
  assert.match(html, /<h2 id="weiterlesen-im-magazin">Weiterlesen im Magazin<\/h2>/);
  assert.match(html, /<a href="\/de\/magazin\/a\/">Glaube &amp; &quot;Liebe&quot; &lt;3<\/a>/);
  assert.equal(relatedArticlesHtml([]), "");
  assert.equal(cleanArticleTitle("🎄 Advent – Bedeutung"), "Advent – Bedeutung");
});

test("rendered magazine content appends the block before the collapsed sources", async () => {
  const source = await readFile(new URL("../lib/content.ts", import.meta.url), "utf8");
  assert.match(source, /relatedArticlesHtml\(getRelatedArticles\(page\)/);
  assert.match(source, /collapseSourceSections\(withRelated\)/);
});
