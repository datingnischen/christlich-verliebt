import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Die Unterzeile der Stadt-H1 steht seit 2026-11-07 als eigener Absatz unter der H1: Seobility wertet sonst
// Wörter wie „Kirchen, Chöre und Begegnungen am Thunersee“ als H1-Keywords, die im Fliesstext fehlen.
for (const file of ["components/city-page.tsx", "components/city-hub.tsx"]) {
  test(`${file}: H1 ohne Unterzeile, Unterzeile als Absatz`, async () => {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    const h1 = source.match(/<h1>.*?<\/h1>/s)?.[0];
    assert.ok(h1, "keine H1 gefunden");
    assert.equal(h1, "<h1>{titleMain}</h1>");
    assert.match(source, /<p className=\{styles\.heroSub\}>\{titleSub\}<\/p>/);
  });
}
