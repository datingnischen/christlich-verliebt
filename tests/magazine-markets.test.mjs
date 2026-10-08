import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AT und CH spiegeln das deutsche Magazin (gleiche Pfadstruktur je Land), Autorenprofil nur auf .de", async () => {
  const content = await source("lib/content.ts");
  assert.match(content, /MIRRORED_MAGAZINE_MARKETS: readonly MarketCode\[\] = \["at", "ch"\]/);
  assert.match(content, /MAGAZINE_MIRROR_EXCLUDED = new Set\(\["\/magazin\/christian-m-haas\/"\]\)/);
  assert.match(content, /mirrorOf: "de"/);
  const mirrorBlock = content.slice(content.indexOf("const magazineMirrors"), content.indexOf("const pageIndex"));
  assert.doesNotMatch(mirrorBlock, /canonical/, "Spiegelseiten behalten die deutsche Canonical-URL");
});

test("Spiegelseiten stehen auf noindex und fehlen in der Länder-Sitemap", async () => {
  const page = await source("app/[market]/[[...slug]]/page.tsx");
  assert.match(page, /page\.mirrorOf \? \{ index: false, follow: true \}/);
  const sitemap = await source("app/[market]/sitemap-data.xml/route.ts");
  assert.match(sitemap, /filter\(page => !page\.mirrorOf\)/);
});

test("Magazin-Autorenlink führt in AT und CH auf die deutsche Profilseite", async () => {
  const hub = await source("components/magazine-hub.tsx");
  assert.match(hub, /page\.market === "de" \? previewPath\("de", AUTHOR_PROFILE\) : publicUrl\("de", AUTHOR_PROFILE\)/);
});

test("WP-REST-Endpunkt bleibt unberührt: liest Rohdaten, nicht die Spiegelseiten", async () => {
  const rest = await source("lib/wp-rest-compat.ts");
  assert.doesNotMatch(rest, /from "\.\/content/);
  assert.doesNotMatch(rest, /mirrorOf/);
});
