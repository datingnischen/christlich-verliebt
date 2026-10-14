import assert from "node:assert/strict";
import test from "node:test";
import { isTeaserImageRoute, teaserImagePath, teaserImageUrl } from "../lib/teaser-image.ts";

// Heiko (2026-10-14): ICONY-Startseiten laden Teaserbilder nur von der eigenen Domain; nginx reicht nur Pfade ohne
// Dateiendung an Vercel weiter. Bilder liegen darum unter /magazin/wp-json/datingnischen/v1/bild/…~jpg.
test("Teaserbild-Adresse: eigene Domain, wp-json-Bereich, keine Dateiendung am Ende", () => {
  const url = teaserImageUrl("https://christlich-verliebt.de/magazin/wp-json", "https://x.vercel.app/app-assets/magazin/wp-content/uploads/2026/03/Plant-Based.on-a-Budget-768x511.jpg");
  assert.equal(url, "https://christlich-verliebt.de/magazin/wp-json/datingnischen/v1/bild/magazin/wp-content/uploads/2026/03/Plant-Based.on-a-Budget-768x511~jpg");
  assert.doesNotMatch(url, /\.(?:jpe?g|png|webp|gif)$/i);
  assert.equal(teaserImageUrl("https://christlich-verliebt.de/magazin/wp-json/", "/imported/de/abc.png"), "https://christlich-verliebt.de/magazin/wp-json/datingnischen/v1/bild/imported/de/abc~png");
});

test("Teaserbild-Route: Rückweg auf den Asset-Pfad, nur freigegebene Ordner und Bildtypen", () => {
  const route = ["datingnischen", "v1", "bild", "magazin", "wp-content", "uploads", "2026", "03", "foto-768x511~jpg"];
  assert.equal(isTeaserImageRoute(route), true);
  assert.equal(isTeaserImageRoute(["wp", "v2", "posts"]), false);
  assert.equal(teaserImagePath(route), "/magazin/wp-content/uploads/2026/03/foto-768x511.jpg");
  assert.equal(teaserImagePath(["datingnischen", "v1", "bild", "brand", "logo~png"]), "/brand/logo.png");
  assert.equal(teaserImagePath(["datingnischen", "v1", "bild", "magazine", "media", "1-bild~webp"]), "/magazine/media/1-bild.webp");
  for (const bad of [
    ["datingnischen", "v1", "bild", "..", "etc", "passwd~png"],
    ["datingnischen", "v1", "bild", "magazin", "wp-content", "uploads", "..", "..", "x~jpg"],
    ["datingnischen", "v1", "bild", "_next", "x~jpg"],
    ["datingnischen", "v1", "bild", "magazin", "wp-content", "uploads", "x~html"],
    ["datingnischen", "v1", "bild", "magazin", "wp-content", "uploads", "a%2F..%2Fb~jpg"],
    ["datingnischen", "v1", "bild"],
  ]) assert.equal(teaserImagePath(bad), null, bad.join("/"));
});
