import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Die Unterzeile der Stadt-H1 steht per CSS in eigener Zeile. Ohne Leerzeichen davor lesen
// Crawler „StuttgartPartnersuche“ (Seobility: H1-Keywords nicht im Text, 2026-10-23).
for (const file of ["components/city-page.tsx", "components/city-hub.tsx"]) {
  test(`${file}: H1-Unterzeile ist durch ein Leerzeichen getrennt`, async () => {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    const h1 = source.match(/<h1>.*?<\/h1>/s)?.[0];
    assert.ok(h1, "keine H1 gefunden");
    assert.match(h1, /\{" "\}<span>/);
    assert.doesNotMatch(h1.replaceAll('{" "}<span>', ""), /\}<span>/);
  });
}
