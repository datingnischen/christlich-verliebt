import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isPlatformPath, isPreviewHost, previewHref, previewPath } from "../lib/markets.ts";

// Heiko (ICONY), 2026-10-14: Hinter dem Reverse Proxy verlinkten Magazin und Navigation auf /de/magazin/… –
// nginx holt die Seiten unter /de/…, der Besucher sah christlich-verliebt.de/de/… (404).
test("internal links are absolute live URLs without a market prefix", () => {
  assert.equal(previewPath("de", "/magazin/dating-unter-christen-gemeinsame-werte/"), "https://christlich-verliebt.de/magazin/dating-unter-christen-gemeinsame-werte/");
  assert.equal(previewPath("at", "/faq"), "https://christlich-verliebt.at/faq/");
  assert.equal(previewPath("ch"), "https://christlich-verliebt.ch/");
  assert.equal(previewPath("de", "/ueber-uns/suche/?q=x"), "https://christlich-verliebt.de/ueber-uns/suche/?q=x");
  assert.doesNotMatch(previewPath("de", "/magazin/"), /\/de\//);
});

test("the Vercel preview keeps the market prefix after hydration", () => {
  assert.equal(previewHref("de", "/magazin/"), "/de/magazin/");
  assert.equal(previewHref("at", "/faq"), "/at/faq/");
  assert.equal(isPreviewHost("christlich-verliebt.vercel.app"), true);
  assert.equal(isPreviewHost("localhost"), true);
  assert.equal(isPreviewHost("christlich-verliebt.de"), false);
  for (const path of ["/login/", "/registration/", "/hilfe/", "/kontakt/", "/suche/", "/dating-tipps/", "/impressum.html", "/premium-mitgliedschaft.html"]) {
    assert.equal(isPlatformPath(path), true, path);
  }
  for (const path of ["/", "/magazin/", "/faq/", "/ueber-uns/suche/", "/partnersuche/berlin/"]) {
    assert.equal(isPlatformPath(path), false, path);
  }
});

test("the shell mounts the preview link switch and never renders prefixed relative links", async () => {
  const shell = await readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /<PreviewLinks \/>/);
  const component = await readFile(new URL("../components/preview-links.tsx", import.meta.url), "utf8");
  assert.match(component, /"use client"/);
  assert.match(component, /isPreviewHost\(window\.location\.hostname\)/);
  assert.match(component, /form\[action\]/);
  for (const file of ["components/site-shell.tsx", "components/magazine-hub.tsx", "components/home-page.tsx", "components/city-page.tsx"]) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /href=["'`]\/(?:de|at|ch)\//, file);
  }
});
