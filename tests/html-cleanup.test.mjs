import assert from "node:assert/strict";
import test from "node:test";
import { limitStrong, withImageAlt, withoutHeadingSkips } from "../lib/html-cleanup.ts";
import { withUniqueLinkTargets } from "../lib/link-targets.ts";

test("Überschriften-Ebenen werden nicht übersprungen", () => {
  assert.equal(withoutHeadingSkips("<h2>A</h2><h4>B</h4><h4>C</h4><h3>D</h3>"), "<h2>A</h2><h3>B</h3><h3>C</h3><h3>D</h3>");
});

test("höchstens vier Hervorhebungen, leere strong ohne zusammenklebende Wörter", () => {
  assert.equal(limitStrong("<strong>a</strong><strong>a</strong>"), '<strong>a</strong><span class="em-strong">a</span>');
  assert.equal(limitStrong("Gott<strong> </strong>liebt"), "Gott liebt");
});

test("Bilder ohne Alt-Text bekommen den Seitentitel, nie alt=\"\"", () => {
  assert.equal(withImageAlt('<img src="a.jpg" alt="">', "Ostern"), '<img alt="Ostern" src="a.jpg">');
});

test("tote Schlagwort-Links entfallen, gleicher Linktext zeigt auf ein Ziel", () => {
  const [a, b] = withUniqueLinkTargets([
    { contentHtml: '<a href="https://christlich-verliebt.de/magazin/tag/glauben/">Glauben</a> und <a href="https://christlich-verliebt.de/magazin/karwoche-geschichte-hintergruende-und-brauchtum/">Ostern</a>' },
    { contentHtml: '<a href="https://christlich-verliebt.de/magazin/karwoche-geschichte-hintergruende-und-brauchtum/">Karwoche</a>' },
  ]);
  assert.equal(a.contentHtml, 'Glauben und <a href="https://christlich-verliebt.de/magazin/ostern/">Ostern</a>');
  assert.equal(b.contentHtml, '<a href="https://christlich-verliebt.de/magazin/karwoche/">Karwoche</a>');
});

test("doppelt verschachtelte Hervorhebungen ergeben gültiges HTML", () => {
  assert.equal(limitStrong("<strong>a</strong><strong>a</strong><strong><strong>T</strong></strong>"), "<strong>a</strong><span class=\"em-strong\">a</span><strong>T</strong>");
});
