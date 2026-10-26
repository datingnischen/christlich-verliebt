import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { IT_CITIES } from "../lib/it-pilot.ts";
import { IT_ARTICLES } from "../lib/it-magazine.ts";
import { getItAudio, itAudioDuration } from "../lib/it-audio.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("every Ticino city and magazine article has an Italian audio summary", () => {
  const keys = [...IT_CITIES.map((city) => `incontri/${city.slug}`), ...IT_ARTICLES.map((article) => `magazine/${article.slug}`)];
  for (const key of keys) {
    const audio = getItAudio(key);
    assert.ok(audio, `${key} hat kein Audio`);
    const file = new URL(`../public${audio.src}`, import.meta.url);
    assert.ok(existsSync(file) && statSync(file).size > 100_000, `${key}: MP3 fehlt`);
    const words = audio.text.split(/\s+/).length;
    assert.ok(words >= 100 && words <= 170, `${key}: ${words} Wörter`);
    assert.doesNotMatch(audio.text, /[0-9%()/]|https?:|christlich-verliebt/, `${key}: Sprechtext nicht sprechbar oder mit Plattformwerbung`);
  }
});

test("audio summary is rendered on city and article pages with transcript and voice note", async () => {
  const [pages, hubs, component] = await Promise.all([read("components/it-pages.tsx"), read("components/it-hubs.tsx"), read("components/it-audio.tsx")]);
  assert.match(pages, /getItAudio\(`incontri\/\$\{city\.slug\}`\)/);
  assert.match(hubs, /getItAudio\(`magazine\/\$\{article\.slug\}`\)/);
  assert.match(component, /voce sintetica/);
  assert.match(component, /<details[^>]*>\s*<summary>Leggi la trascrizione<\/summary>/);
  assert.equal(itAudioDuration(64), "1:04");
});
