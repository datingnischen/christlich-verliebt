import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { handleWpRest } from "../lib/wp-rest-compat.ts";
import { naturalTimestamp } from "../lib/natural-time.ts";

// Zeitstempel erscheinen in JSON-LD, Sitemap und /magazin/wp-json. Sie dürfen nicht nach Automatik aussehen
// (Christian, 2026-11-13): keine runden Uhrzeiten, keine gemeinsamen Sekunden, keine Sammel-Aktualisierungen,
// höchstens zwei Beiträge je Erscheinungstag. Neue Beiträge in data/wp-posts.json: unregelmäßige Uhrzeit
// (7–22 Uhr, Sekunde ≠ 0); eigene Artikel mit `updated` bekommen ihre Uhrzeit aus lib/natural-time.ts.
const root = new URL("../", import.meta.url);
const source = (path) => readFileSync(new URL(path, root), "utf8");
const markets = ["de", "at", "ch"];
const rest = Object.fromEntries(markets.map((market) => [market, handleWpRest("/wp/v2/posts", new URLSearchParams("per_page=100"), market).body]));
const itArticles = JSON.parse(source("data/it-magazine.json")).articles;

// Datumsgebundene Ausnahmen von „höchstens zwei Beiträge je Tag“ (slug → Grund).
const SAME_DAY_EXCEPTIONS = {
  "parlare-di-fede-al-primo-appuntamento": "Start des Tessin-Piloten am 20.10.2026 mit drei Artikeln",
  "conoscere-single-cristiani-in-ticino": "Start des Tessin-Piloten am 20.10.2026 mit drei Artikeln",
  "incontri-online-sicuri-single-cristiani": "Start des Tessin-Piloten am 20.10.2026 mit drei Artikeln",
};

const berlinOffsetHours = (local) => {
  const year = Number(local.slice(0, 4));
  const lastSunday = (month) => {
    const day = new Date(Date.UTC(year, month + 1, 0));
    day.setUTCDate(day.getUTCDate() - day.getUTCDay());
    return day.toISOString().slice(0, 10);
  };
  return local >= `${lastSunday(2)}T02:00:00` && local < `${lastSunday(9)}T03:00:00` ? 2 : 1;
};
const toGmt = (local) => new Date(Date.parse(`${local}Z`) - berlinOffsetHours(local) * 3_600_000).toISOString().slice(0, 19);
const isRound = (stamp) => /T\d\d:(00|30):00$/.test(stamp) || /T00:00:\d\d$/.test(stamp);
const nowBerlin = () => new Date(Date.now() + berlinOffsetHours(new Date().toISOString().slice(0, 19)) * 3_600_000).toISOString().slice(0, 19);

test("WP-REST: GMT passt zur Berliner Ortszeit, modified nie vor date, nichts in der Zukunft", () => {
  const now = nowBerlin();
  for (const [market, rows] of Object.entries(rest)) {
    assert.ok(rows.length > 0, `${market}: keine Beiträge`);
    for (const row of rows) {
      assert.equal(row.date_gmt, toGmt(row.date), `${market} ${row.slug} date_gmt`);
      assert.equal(row.modified_gmt, toGmt(row.modified), `${market} ${row.slug} modified_gmt`);
      assert.ok(row.modified >= row.date, `${market} ${row.slug}: modified vor date`);
      assert.ok(row.modified <= now, `${market} ${row.slug}: modified in der Zukunft`);
    }
  }
  for (const article of itArticles) assert.ok(article.modified >= article.published, `it ${article.slug}: modified vor published`);
});

test("Zeitstempel ab 2026 sind nicht rund und nicht doppelt", () => {
  for (const [market, rows] of Object.entries(rest)) {
    const seen = new Map();
    for (const row of rows) {
      for (const field of ["date", "modified"]) {
        const stamp = row[field];
        if (stamp < "2026") continue;
        assert.ok(!isRound(stamp), `${market} ${row.slug} ${field}: runde Uhrzeit ${stamp}`);
        if (field === "modified" && stamp === row.date) continue;
        assert.ok(!seen.has(stamp), `${market} ${row.slug} ${field}: gleiche Sekunde wie ${seen.get(stamp)}`);
        seen.set(stamp, row.slug);
      }
    }
  }
});

test("natural-time erzeugt nie runde Uhrzeiten und bleibt zwischen 7 und 22 Uhr", () => {
  for (let i = 0; i < 2000; i += 1) {
    const stamp = naturalTimestamp(`beitrag-${i}`, "2026-03-14");
    assert.ok(!isRound(stamp), stamp);
    assert.match(stamp, /^2026-03-14T(0[7-9]|1\d|2[0-2]):\d\d:(0[1-9]|[1-5]\d)$/);
  }
});

test("keine Sammel-Aktualisierung vieler Beiträge am selben Tag", () => {
  const collections = { ...rest, it: itArticles.map((a) => ({ slug: a.slug, date: a.published, modified: a.modified })) };
  for (const [market, rows] of Object.entries(collections)) {
    const limit = rows.length < 30 ? 4 : 8;
    const perDay = new Map();
    for (const row of rows) {
      const day = row.modified.slice(0, 10);
      if (day > row.date.slice(0, 10) && day >= "2026") perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    for (const [day, count] of perDay) assert.ok(count <= limit, `${market}: ${count} Beiträge mit modified am ${day}`);
  }
});

test("höchstens zwei Beiträge je Erscheinungstag (Ausnahmen nur begründet)", () => {
  const collections = { ...rest, it: itArticles.map((a) => ({ slug: a.slug, date: a.published })) };
  for (const [market, rows] of Object.entries(collections)) {
    const perDay = new Map();
    for (const row of rows) {
      if (SAME_DAY_EXCEPTIONS[row.slug]) continue;
      const day = row.date.slice(0, 10);
      perDay.set(day, [...(perDay.get(day) ?? []), row.slug]);
    }
    for (const [day, slugs] of perDay) assert.ok(slugs.length <= 2, `${market}: ${slugs.length} Beiträge am ${day}: ${slugs.join(", ")}`);
  }
});
