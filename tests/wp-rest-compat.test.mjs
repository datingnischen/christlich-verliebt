import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server.js";

import { berlinToGmt, handleWpRest, mediaIdForPostId, postIdForSlug, wpRestPreflight, wpRestResponse } from "../lib/wp-rest-compat.ts";
import { proxy } from "../proxy.ts";
import { TEASER_CITIES } from "../lib/wp-market-teasers.ts";

const root = new URL("../", import.meta.url);
const source = (path) => readFileSync(new URL(path, root), "utf8");
const get = (route, query = "", market = "de") => handleWpRest(route, new URLSearchParams(query), market);
const { pages } = JSON.parse(source("data/public-pages.json"));
const editorial = JSON.parse(source("data/editorial-pages.json")).pages;
const snapshot = JSON.parse(source("data/wp-posts.json")).posts;
const snapshotSlugs = new Set(snapshot.map((post) => post.slug));
const deArticles = [...editorial, ...pages].filter((page) => page.market === "de" && page.family === "magazine" && (snapshotSlugs.has(page.path.split("/")[2]) || page.updated));

test("Artikelauswahl: nur echte Beiträge (WordPress-Abzug plus eigene Artikel), keine Autoren-/Werkzeugseiten, Hub oder Kategorien", () => {
  assert.equal(snapshot.length, 59);
  assert.equal(deArticles.length, 60, "59 WordPress-Beiträge plus das eigene Videoartikel-Stück");
  const slugs = get("/wp/v2/posts", "per_page=100").body.map((post) => post.slug);
  assert.equal(slugs.length, 60);
  for (const notAPost of ["christian-m-haas", "christen-fit-faktor", "category", "author"]) assert.ok(!slugs.includes(notAPost), notAPost);
  assert.ok(slugs.includes("dating-unter-christen-gemeinsame-werte"));
});

test("Märkte: de liefert die Beiträge, at und ch (kein Magazin) ihre drei größten Städteseiten, unbekannte Märkte 404", () => {
  assert.equal(get("/wp/v2/posts", "", "de").headers["X-WP-Total"], "60");
  for (const market of ["at", "ch"]) {
    const result = get("/wp/v2/posts", "per_page=3", market);
    assert.equal(result.status, 200, market);
    assert.equal(result.body.length, 3);
    assert.equal(result.headers["X-WP-Total"], "3");
    assert.equal(result.headers["X-WP-TotalPages"], "1");
  }
  assert.equal(get("/wp/v2/posts", "", "fr").status, 404);
  assert.match(JSON.stringify(get("/", "", "at").body), /christlich-verliebt\.at/);
  assert.match(JSON.stringify(get("/", "", "ch").body), /christlich-verliebt\.ch/);
});

test("IDs und Daten: echte WordPress-IDs aus dem Abzug, eigene Artikel mit fixierter Ableitung", () => {
  const trad = get("/wp/v2/posts", "slug=trad-wife-rollenbilder-dating").body[0];
  assert.equal(trad.id, 606);
  assert.equal(trad.featured_media, 607);
  assert.equal(trad.date, "2026-07-11T07:02:22");
  assert.equal(trad.date_gmt, "2026-07-11T05:02:22");
  assert.equal(trad.modified, "2026-07-11T17:42:10");
  assert.equal(trad.author, 2);
  assert.deepEqual(trad.categories, [12]);

  const video = get("/wp/v2/posts", "slug=dating-unter-christen-gemeinsame-werte").body[0];
  assert.equal(video.id, 357126, "abgeleitete ID für den Artikel ohne WordPress-Quelle");
  assert.equal(video.id, postIdForSlug("dating-unter-christen-gemeinsame-werte"));
  assert.equal(video.featured_media, mediaIdForPostId(357126));
  assert.equal(video.date, "2026-09-28T00:00:00", "Datum aus updated");
  assert.ok(!snapshot.some((post) => post.id === video.id));

  const ids = get("/wp/v2/posts", "per_page=100").body.map((post) => post.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(get("/wp/v2/posts/606").body.slug, "trad-wife-rollenbilder-dating");
  assert.equal(get("/wp/v2/posts/606", "", "at").status, 404, "Beitrag gehört nur zum Markt de");
  assert.equal(berlinToGmt("2026-01-15T22:31:39"), "2026-01-15T21:31:39");
  assert.equal(berlinToGmt("2026-07-07T12:57:23"), "2026-07-07T10:57:23");
});

test("posts: Teaser-Abruf wie bei ICONY liefert drei Beiträge im WordPress-Format mit Gesamtzahl-Headern", () => {
  const result = get("/wp/v2/posts", "per_page=3&_embed=1&orderby=date&order=desc");
  assert.equal(result.status, 200);
  assert.equal(result.body.length, 3);
  assert.equal(result.headers["X-WP-Total"], "60");
  assert.equal(result.headers["X-WP-TotalPages"], "20");
  assert.match(result.headers.Link, /^<https:\/\/christlich-verliebt\.de\/magazin\/wp-json\/wp\/v2\/posts\?.*>; rel="next"$/);
  const [first, second] = result.body;
  assert.ok(first.date >= second.date, "neueste zuerst");

  for (const post of result.body) {
    for (const key of ["id", "date", "date_gmt", "modified", "modified_gmt", "slug", "status", "type", "link", "title", "excerpt", "content", "featured_media", "categories", "tags", "author"]) {
      assert.ok(key in post, `${post.slug}: ${key}`);
    }
    assert.equal(post.status, "publish");
    assert.equal(post.type, "post");
    assert.match(post.excerpt.rendered, /^<p>.+<\/p>\n$/s);
    assert.equal(typeof post.author, "number", "author nur als ID");
    assert.equal(post.link, `https://christlich-verliebt.de/magazin/${post.slug}/`, "kanonische Live-URL, nie vercel.app");
    assert.doesNotMatch(JSON.stringify(post), /vercel\.app\/magazin/);
    assert.doesNotMatch(post.content.rendered, /(?:src|href|poster)="\//, "keine relativen Adressen im Fließtext");

    const media = post._embedded["wp:featuredmedia"][0];
    assert.equal(media.id, post.featured_media);
    // Eigene Domain statt Asset-Host: die ICONY-Startseite darf Bilder nur von der eigenen Domain laden (CSP, Heiko 2026-10-14)
    // Teaserbild ohne Dateiendung im wp-json-Bereich (lib/teaser-image.ts): nginx reicht .jpg/.png nicht an Vercel durch, CSP erlaubt nur die eigene Domain
    assert.match(media.source_url, /^https:\/\/christlich-verliebt\.de\/magazin\/wp-json\/datingnischen\/v1\/bild\/(?:imported\/de|brand)\/[^/.]+~(?:jpe?g|png)$/, "eigene Domain, ohne Dateiendung");
    assert.equal(media.media_details.sizes.full.source_url, media.source_url);
    assert.equal(media.media_details.sizes.medium.source_url, media.source_url);
    assert.doesNotMatch(JSON.stringify(media), /_next\/image|vercel\.app/);
    assert.ok(media.media_details.width > 0 && media.media_details.height > 0);
    assert.ok(media.alt_text.trim(), "Alt-Text nie leer");
    assert.ok(media.media_details.sizes.full);
    assert.ok(post._embedded["wp:term"][0].length > 0);
    assert.equal(post._embedded.author, undefined, "keine eingebetteten Autoren");
  }
});

test("alle Beiträge haben ein Beitragsbild mit Datei, Maßen und nicht leerem Alt-Text; Tags und Kategorien stimmen mit WordPress überein", () => {
  const all = get("/wp/v2/posts", "per_page=100&_embed").body;
  for (const post of all) {
    const media = post._embedded["wp:featuredmedia"]?.[0];
    assert.ok(media, `${post.slug} ohne Beitragsbild`);
    assert.ok(media.alt_text.trim(), post.slug);
    const page = deArticles.find((item) => item.path === `/magazin/${post.slug}/`);
    assert.ok(existsSync(new URL(`public${page.heroImage}`, root)), page.heroImage);
    assert.equal(post.link, page.canonical);
  }
  const wp = new Map(snapshot.map((post) => [post.slug, post]));
  for (const post of all.filter((item) => wp.has(item.slug))) {
    assert.deepEqual(post.categories, wp.get(post.slug).categories, post.slug);
    assert.deepEqual(post.tags, wp.get(post.slug).tags, post.slug);
    assert.equal(post.date, wp.get(post.slug).date);
    assert.equal(post.id, wp.get(post.slug).id);
  }
  const tagged = all.find((post) => post.tags.length);
  assert.equal(tagged.slug, "mormonen");
  assert.deepEqual(tagged._embedded["wp:term"][1].map((tag) => tag.slug).sort(), ["glauben", "mormonen", "regeln", "symbole"]);
});

test("posts: _fields, slug, categories, order und Paginierung verhalten sich wie WordPress", () => {
  const slim = get("/wp/v2/posts", "per_page=2&_fields=id,link,title.rendered,excerpt");
  assert.deepEqual(Object.keys(slim.body[0]).sort(), ["excerpt", "id", "link", "title"]);
  assert.deepEqual(Object.keys(slim.body[0].title), ["rendered"]);
  const embedded = get("/wp/v2/posts", "per_page=1&_embed&_fields=id,_embedded");
  assert.deepEqual(Object.keys(embedded.body[0]).sort(), ["_embedded", "id"]);

  const bySlug = get("/wp/v2/posts", "slug=ostern");
  assert.equal(bySlug.body.length, 1);
  assert.equal(bySlug.headers["X-WP-Total"], "1");

  const category = get("/wp/v2/categories", "slug=christliche-feiertage").body[0];
  assert.equal(category.count, 15);
  const inCategory = get("/wp/v2/posts", `categories=${category.id}&per_page=100`);
  assert.equal(inCategory.body.length, category.count);
  assert.ok(inCategory.body.every((post) => post.categories.includes(category.id)));

  assert.equal(get("/wp/v2/posts", "include=606,600").body.length, 2);
  assert.ok(get("/wp/v2/posts", "search=bonhoeffer").body.length > 0);
  assert.equal(get("/wp/v2/posts", "after=2026-07-01T00:00:00").body.length >= 2, true);
  assert.ok(get("/wp/v2/posts", "before=2021-05-01T00:00:00").body.length > 0);
  const ascending = get("/wp/v2/posts", "orderby=date&order=asc&per_page=2").body;
  assert.ok(ascending[0].date <= ascending[1].date);

  const page2 = get("/wp/v2/posts", "per_page=10&page=2");
  assert.equal(page2.body.length, 10);
  assert.match(page2.headers.Link, /rel="prev"/);
  assert.equal(get("/wp/v2/posts", "per_page=10&page=99").status, 400);
  assert.equal(get("/wp/v2/posts", "per_page=500").body.length, 60, "per_page wird auf 100 begrenzt");
});

test("Beiträge, Kategorien, Schlagwörter und Beitragsbilder abrufbar; Seiten und Unbekanntes antworten 404", () => {
  const post = get("/wp/v2/posts", "slug=ostern").body[0];
  assert.equal(get(`/wp/v2/posts/${post.id}`).body.slug, "ostern");
  assert.equal(get("/wp/v2/posts/999999").status, 404);
  const media = get(`/wp/v2/media/${post.featured_media}`);
  assert.equal(media.body.id, post.featured_media);
  assert.equal(media.body.post, post.id);
  assert.equal(get("/wp/v2/media").status, 404, "keine Liste der Mediathek");
  assert.equal(get("/wp/v2/categories", "per_page=100").body.length, 5);
  const tags = get("/wp/v2/tags", "per_page=100");
  assert.equal(tags.status, 200);
  assert.deepEqual(tags.body.map((tag) => tag.id).sort(), [3, 4, 6, 8], "nur Schlagwörter mit Beiträgen");
  assert.equal(get("/wp/v2/tags/4").body.slug, "glauben");
  for (const route of ["/wp/v2/pages", "/wp/v2/pages/1", "/wp/v2/types", "/wp/v2/comments", "/wp/v2/search", "/oembed/1.0", "/wp/v2/posts/1/revisions/9"]) {
    assert.equal(get(route).status, 404, route);
  }
});

test("KEIN users-Endpunkt: Autoren gibt es nur als ID, kein Name oder Avatar in irgendeiner Antwort", () => {
  for (const market of ["de", "at", "ch"]) {
    for (const route of ["/wp/v2/users", "/wp/v2/users/1", "/wp/v2/users/me"]) {
      const result = get(route, "", market);
      assert.equal(result.status, 404, `${market} ${route}`);
      assert.equal(result.body.code, "rest_no_route");
    }
  }
  assert.equal(get("/wp/v2/users", "search=Haas").status, 404);
  const all = JSON.stringify(get("/wp/v2/posts", "per_page=100&_embed&_fields=id,author,_embedded,_links").body);
  assert.doesNotMatch(all, /gravatar|avatar_urls|\/users\//);
  assert.doesNotMatch(JSON.stringify(get("/").body), /users/);
  assert.doesNotMatch(JSON.stringify(get("/wp/v2").body), /users|pages/);
});

test("Antwort-Header: CORS offen, Cache-Header, JSON, noindex; OPTIONS und HEAD funktionieren", async () => {
  const response = wpRestResponse(get("/wp/v2/posts", "per_page=3"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-expose-headers"), /X-WP-Total, X-WP-TotalPages/);
  assert.match(response.headers.get("cache-control"), /s-maxage=3600/);
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.equal(response.headers.get("x-wp-total"), "60");
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assert.equal((await response.json()).length, 3);

  const notFound = wpRestResponse(get("/wp/v2/users"));
  assert.equal(notFound.status, 404);
  assert.equal(notFound.headers.get("access-control-allow-origin"), "*");

  const head = wpRestResponse(get("/wp/v2/posts"), "HEAD");
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("x-wp-total"), "60");

  const preflight = wpRestPreflight();
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
});

test("Proxy: /magazin/wp-json und ?rest_route= werden ohne Slash und ohne 308 an den Markt-Endpunkt umgeschrieben", () => {
  const at = (host, path) => proxy(new NextRequest(`https://${host}${path}`, { headers: { host } }));
  const cases = [
    ["christlich-verliebt.de", "/magazin/wp-json/wp/v2/posts?per_page=3", /\/de\/magazin\/wp-json\/wp\/v2\/posts\?per_page=3$/],
    ["christlich-verliebt.at", "/magazin/wp-json/wp/v2/posts", /\/at\/magazin\/wp-json\/wp\/v2\/posts$/],
    ["christlich-verliebt.ch", "/magazin/wp-json/wp/v2/posts/", /\/ch\/magazin\/wp-json\/wp\/v2\/posts\/$/],
    ["christlich-verliebt.de", "/magazin/wp-json", /\/de\/magazin\/wp-json$/],
    ["christlich-verliebt.vercel.app", "/magazin/wp-json/wp/v2/posts", /\/de\/magazin\/wp-json\/wp\/v2\/posts$/],
    ["christlich-verliebt.vercel.app", "/at/magazin/wp-json/wp/v2/posts", /\/at\/magazin\/wp-json\/wp\/v2\/posts$/],
    ["christlich-verliebt.de", "/magazin/index.php?rest_route=/wp/v2/posts", /\/de\/magazin\/index\.php\?rest_route=\/wp\/v2\/posts$/],
    ["christlich-verliebt.de", "/magazin/?rest_route=/wp/v2/posts", /\/de\/magazin\/index\.php\/?\?rest_route=\/wp\/v2\/posts$/],
    ["christlich-verliebt.at", "/magazin?rest_route=/wp/v2/posts", /\/at\/magazin\/index\.php\?rest_route=\/wp\/v2\/posts$/],
  ];
  for (const [host, path, expected] of cases) {
    const response = at(host, path);
    assert.equal(response.status, 200, `${host}${path}`);
    assert.match(response.headers.get("x-middleware-rewrite") ?? "", expected, `${host}${path}`);
  }
  // Normale Seiten behalten ihre Slash-Umleitung.
  assert.equal(at("christlich-verliebt.de", "/magazin").status, 308);
  // "?_embed" ohne Wert (ICONY-Schreibweise) überlebt den Rewrite als _embed=1
  assert.match(at("christlich-verliebt.de", "/magazin/wp-json/wp/v2/posts/?per_page=3&_embed").headers.get("x-middleware-rewrite") ?? "", /per_page=3&_embed=1$/);
  assert.match(at("christlich-verliebt.vercel.app", "/de/magazin/wp-json/wp/v2/posts?_embed").headers.get("x-middleware-rewrite") ?? "", /\?_embed=1$/);
  // Teaserbilder: /magazin/media/<pfad> ist die Datei in public/, auch mit Upstream-Präfix
  assert.match(at("christlich-verliebt.de", "/magazin/media/imported/de/bild.jpg").headers.get("x-middleware-rewrite") ?? "", /^https:\/\/christlich-verliebt\.de\/imported\/de\/bild\.jpg$/);
  assert.match(at("christlich-verliebt.vercel.app", "/at/magazin/media/brand/logo.png").headers.get("x-middleware-rewrite") ?? "", /\/brand\/logo\.png$/);
  assert.equal(at("christlich-verliebt.de", "/magazin/media/imported/de/bild.jpg").status, 200);
});

test("Routen: wp-json und ?rest_route= sind je Markt verdrahtet, Sitemap, Suche und Catch-all bleiben unberührt", () => {
  const wpJson = source("app/[market]/magazin/wp-json/[[...route]]/route.ts");
  assert.match(wpJson, /handleWpRest\(`\/\$\{route\.join\("\/"\)\}`, new URL\(request\.url\)\.searchParams, market\)/);
  assert.match(wpJson, /export function OPTIONS/);
  const indexPhp = source("app/[market]/magazin/index.php/route.ts");
  assert.match(indexPhp, /params\.get\("rest_route"\)/);
  assert.match(indexPhp, /params\.delete\("rest_route"\)/);
  const proxySource = source("proxy.ts");
  assert.match(proxySource, /isWpRestRequest/);
  assert.match(proxySource, /\/magazin\/index\.php/);
  assert.doesNotMatch(source("lib/wp-rest-compat.ts"), /"\/wp\/v2\/users"|resource === "users"|resource === "pages"/);
  assert.doesNotMatch(source("app/[market]/sitemap-data.xml/route.ts"), /wp-json/);
  assert.doesNotMatch(source("lib/search.ts"), /wp-json/);
});

// JPEG-Maße aus dem SOF-Segment (ohne Bildbibliothek).
function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error("kein SOF-Segment");
}

test("AT/CH-Knoten: drei größte Städteseiten mit Link, Bild und Text auf der Landesdomain (ICONY-Teaser)", () => {
  const expected = {
    at: ["wien", "graz", "linz"],
    ch: ["zuerich", "basel", "bern"],
  };
  for (const [market, slugs] of Object.entries(expected)) {
    const domain = `christlich-verliebt.${market}`;
    for (const query of ["per_page=3&_embed", "per_page=3&_embed=1"]) {
      const result = get("/wp/v2/posts/", query, market);
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.map((post) => post.slug), slugs, `${market} ${query}`);
      for (const post of result.body) {
        const page = pages.find((item) => item.market === market && item.path === `/partnersuche/${post.slug}/`);
        assert.ok(page?.heroImage, `${market} ${post.slug} hat Stadtseite mit Bild`);
        assert.equal(post.link, `https://${domain}/partnersuche/${post.slug}/`);
        assert.equal(post.title.rendered, page.title);
        assert.ok(post.excerpt.rendered.includes(page.description.slice(0, 40)));
        assert.match(post.date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
        const media = post._embedded["wp:featuredmedia"][0];
        assert.equal(media.id, post.featured_media);
        const imageUrl = `https://${domain}/magazin/wp-json/datingnischen/v1/bild${page.heroImage.replace(/\.jpg$/, "~jpg")}`;
        assert.equal(media.source_url, imageUrl);
        assert.doesNotMatch(media.source_url, /vercel\.app|\.jpg$/);
        const size = media.media_details.sizes.medium_large;
        assert.equal(size.source_url, imageUrl);
        const file = readFileSync(new URL(`public${page.heroImage}`, root));
        assert.deepEqual({ width: size.width, height: size.height }, jpegSize(file), `${market} ${post.slug} Bildmaße`);
        assert.equal(media.media_details.filesize, file.length);
        assert.ok(media.alt_text.trim());
        assert.equal(get(`/wp/v2/posts/${post.id}`, "", market).body.slug, post.slug);
        assert.equal(get(`/wp/v2/media/${media.id}`, "", market).body.source_url, imageUrl);
      }
    }
    assert.equal(TEASER_CITIES[market].length, 3);
    assert.doesNotMatch(JSON.stringify(get("/wp/v2/posts", "per_page=3&_embed=1", market).body), /christlich-verliebt\.de|vercel\.app/);
  }
  assert.equal(get("/wp/v2/posts", "per_page=3", "de").body.every((post) => post.link.startsWith("https://christlich-verliebt.de/magazin/")), true, ".de bleibt beim Magazin");
});
