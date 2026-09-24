import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("imported reviews and social pages move below /ueber-uns/ on .de only", async () => {
  const about = await source("lib/about.ts");
  assert.match(about, /de: \{\s*"\/bewertungen-und-erfahrungen\/": ABOUT_REVIEWS_PATH,\s*"\/social-media\/": ABOUT_SOCIAL_PATH,\s*\}/);
  assert.match(about, /ABOUT_REVIEWS_PATH = "\/ueber-uns\/bewertungen\/"/);
  assert.match(about, /ABOUT_SOCIAL_PATH = "\/ueber-uns\/social-media\/"/);
  assert.doesNotMatch(about, /\b(at|ch): \{/);
});

test("about canonical keeps the trailing slash like every other page", async () => {
  assert.match(await source("lib/about.ts"), /`https:\/\/\$\{getMarket\(market\)\.domain\}\$\{ABOUT_ROOT_PATH\}`/);
  assert.match(await source("app/[market]/sitemap-data.xml/route.ts"), /aboutCanonical\(market\)/);
});

test("old about paths redirect permanently and header and footer link the about area", async () => {
  const config = await source("next.config.ts");
  const shell = await source("components/site-shell.tsx");
  assert.match(config, /ABOUT_PAGE_MOVES\.de/);
  assert.match(config, /permanent: true/);
  assert.match(shell, /<h3>Über uns<\/h3>/);
  assert.match(shell, /\["Über uns", ABOUT_ROOT_PATH\]/);
});
