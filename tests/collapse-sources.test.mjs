import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { collapseSourceSections } from "../lib/collapse-sources.ts";

const html = [
  "<h2>Stand, Quellen &amp; Transparenz</h2>",
  "<p>Stand der Informationen: Juni 2026</p>",
  "<h3>Genutzte Quellen</h3>",
  '<ul><li><a href="https://www.destatis.de/">destatis.de</a></li></ul>',
  "<h2>Kurz zusammengefasst</h2>",
  "<p>Fazit</p>",
].join("\n");

test("Quellenabschnitt wird zugeklappter Block am Ende des Beitrags", () => {
  const out = collapseSourceSections(html);
  assert.match(out, /<details class="magazine-sources">\n<summary>Quellen & Transparenz<\/summary>/);
  assert.doesNotMatch(out, /<details class="magazine-sources" open/);
  assert.doesNotMatch(out, /<h2>Stand, Quellen/);
  assert.ok(out.indexOf("Kurz zusammengefasst") < out.indexOf("magazine-sources"), "Quellen stehen am Ende");
  assert.match(out, /href="https:\/\/www\.destatis\.de\/"/, "Links bleiben erhalten");
  assert.match(out, /Stand der Informationen: Juni 2026/);
  assert.match(out, /<p class="magazine-sources__label">Genutzte Quellen<\/p>/);
});

test("weitere Quellenformate: 📚-Überschrift und Absatz-Label", () => {
  const emoji = collapseSourceSections("<h3>📚Quellen &amp; Datenstand:</h3><p>• <a href=\"https://statistik.example\">Amt</a></p><h3>Weiter</h3><p>x</p>");
  assert.match(emoji, /<details class="magazine-sources">/);
  assert.ok(emoji.indexOf("Weiter") < emoji.indexOf("magazine-sources"));
  assert.match(emoji, /href="https:\/\/statistik\.example"/);

  const para = collapseSourceSections("<p><strong>Quellen:</strong> BZgA, Destatis</p><ul><li><a href=\"https://www.bzga.de\">BZgA</a></li></ul><h2>Fazit</h2><p>y</p>");
  assert.match(para, /<details class="magazine-sources">/);
  assert.ok(para.indexOf("Fazit") < para.indexOf("magazine-sources"));
  assert.match(para, /<p>BZgA, Destatis<\/p>/);
  assert.match(para, /href="https:\/\/www\.bzga\.de"/);
  assert.doesNotMatch(para, /<p><strong>Quellen:/);

  const italic = collapseSourceSections("<p>Text</p> <p><em><strong>Quellen:</strong></em></p> <ul> <li>https://www.example.org/a</li> </ul><p>Schluss</p>");
  assert.match(italic, /<details class="magazine-sources">/);
  assert.ok(italic.indexOf("Schluss") < italic.indexOf("magazine-sources"));
  assert.match(italic, /<li>https:\/\/www\.example\.org\/a<\/li>/);
  assert.doesNotMatch(italic, /<\/em>/);
});

test("Ratgeberfragen, Fließtext und einzelne Bildnachweise bleiben unverändert", () => {
  const text = "<h2>Welche Quellen sollte ich vor dem Date prüfen?</h2><p>a</p><h2>Eine Quelle der Inspiration</h2><p>b</p><p><em>Quelle: Statista</em></p><p><strong>Quelle:</strong> Grafik</p>";
  assert.equal(collapseSourceSections(text), text);
});

test("FAQ-Karte nach den Quellen bleibt außerhalb des Quellenblocks", () => {
  const out = collapseSourceSections('<h2>Quellen</h2><ul><li>x</li></ul><section class="faq"><h2>Häufige Fragen</h2></section>');
  assert.ok(out.indexOf('class="faq"') < out.indexOf("magazine-sources"));
});

test("bereits transformiertes HTML bleibt stabil", () => {
  const once = collapseSourceSections(html);
  assert.equal(collapseSourceSections(once), once);
});

test("Magazin und Ratgeber klappen Quellen ein, Städteseiten bleiben unberührt", () => {
  const content = readFileSync(new URL("../lib/content.ts", import.meta.url), "utf8");
  assert.match(content, /const article = page\.family === "magazine" \|\| page\.family === "guide";/);
  assert.match(content, /return article \? collapseSourceSections\(cleaned\) : cleaned;/);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /details\.magazine-sources \{[\s\S]*?font-size: 13px;/);
});
