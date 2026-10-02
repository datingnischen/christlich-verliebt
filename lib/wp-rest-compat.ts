import pagesSnapshot from "../data/public-pages.json" with { type: "json" };
import editorialSnapshot from "../data/editorial-pages.json" with { type: "json" };
import categorySnapshot from "../data/magazine-categories.json" with { type: "json" };
import mediaSnapshot from "../data/wp-media.json" with { type: "json" };
import wpSnapshot from "../data/wp-posts.json" with { type: "json" };
import { getMarket, isMarketCode, type MarketCode } from "./markets.ts";
import { assetHost, staticAsset } from "./static-asset.ts";

/**
 * WordPress-kompatibler REST-Endpunkt für die Magazin-Beiträge, erzeugt aus den Dateien im Repo.
 *
 * Hintergrund: ICONY liest auf den Plattform-Startseiten drei Magazin-Teaser über das WP-Format
 * https://christlich-verliebt.de/magazin/wp-json/wp/v2/posts. Das Magazin ist von WordPress auf Next.js umgezogen,
 * der Endpunkt bleibt: gleiche URL, gleiche Felder, aus data/public-pages.json und data/editorial-pages.json erzeugt.
 * Je Markt (de, at, ch) ein eigener Endpunkt mit den Beiträgen des jeweiligen market-Feldes. Ein Magazin gibt es
 * bisher nur in Deutschland; AT und CH antworten mit einer leeren Liste (200, X-WP-Total 0).
 *
 * Bewusst NICHT vorhanden: /wp/v2/users (Autoren-Enumeration) und /wp/v2/pages. `author` ist nur die ID,
 * `_embedded.author` gibt es nicht. Alles außer Beiträgen, Kategorien, Schlagwörtern und Beitragsbildern antwortet 404.
 *
 * IDs und Zeitstempel: Der Seitenimport kennt keine WordPress-IDs und keine Veröffentlichungsdaten. Darum liegt in
 * data/wp-posts.json ein Abzug der echten Werte (ID, Datum, Autor, Kategorien, Schlagwörter, Beitragsbild-ID) aus dem
 * WordPress-REST, solange dieser noch erreichbar war (scripts/fetch_wp_post_meta.py). Eigene Artikel ohne WordPress-
 * Quelle (data/editorial-pages.json) bekommen eine stabile abgeleitete ID: 100000 + FNV-1a(Slug) mod 900000
 * (Beitragsbild: 1000000 + Beitrags-ID) und als Datum ihr `updated` (00:00 Uhr). Beides ist per Test fixiert.
 */

export const REST_BASE_PATH = "/magazin/wp-json";

export const WP_REST_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-WP-Nonce, Content-Disposition, Content-MD5, Content-Type",
  "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages, Link",
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  "X-Robots-Tag": "noindex",
  "X-Content-Type-Options": "nosniff",
  Allow: "GET",
};

export type WpRestResponse = {
  status: number;
  body: unknown;
  headers: Record<string, string>;
};

type Json = Record<string, unknown>;

type SourcePage = {
  market: MarketCode;
  path: string;
  canonical: string;
  family: string;
  title: string;
  description: string;
  heroTitle?: string;
  contentHtml: string;
  heroImage: string | null;
  categories: string[];
  updated?: string;
};

type WpPost = { id: number; slug: string; date: string; modified: string; author: number; featured_media: number; categories: number[]; tags: number[] };

type SourceCategory = { id: number; slug: string; name: string; description: string; count: number };

type SourceMedia = {
  id: number;
  slug: string;
  title: string;
  altText: string;
  sourceUrl: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
  imagePath: string;
  date: string;
  dateGmt: string;
  post: number;
};

type SourceEntry = {
  id: number;
  slug: string;
  link: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  dateGmt: string;
  modified: string;
  modifiedGmt: string;
  author: number;
  categories: number[];
  tags: number[];
  media: SourceMedia | null;
};

export type MagazineSource = { market: MarketCode; origin: string; posts: SourceEntry[]; categories: SourceCategory[]; tags: SourceCategory[]; media: SourceMedia[] };

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;
const NAMESPACE_ROUTES = ["/wp/v2/posts", "/wp/v2/categories", "/wp/v2/tags", "/wp/v2/media"];

function error(status: number, code: string, message: string): WpRestResponse {
  return { status, body: { code, message, data: { status } }, headers: {} };
}

const NO_ROUTE = () => error(404, "rest_no_route", "Es wurde keine Route gefunden, die der URL und der Anfragemethode entspricht.");

// ---------------------------------------------------------------- Quelle aus den Repo-Dateien

/** Stabile Beitrags-ID aus dem Slug (FNV-1a, 32 Bit), nur für Artikel ohne WordPress-Abzug. */
export function postIdForSlug(slug: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < slug.length; index++) {
    hash ^= slug.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 100000 + (hash % 900000);
}

export const mediaIdForPostId = (postId: number) => 1000000 + postId;

function berlinOffsetMinutes(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  return (Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second")) - utcMs) / 60000;
}

/** Ortszeit (Europe/Berlin, ohne Zeitzone) nach GMT, beides als "YYYY-MM-DDTHH:mm:ss". */
export function berlinToGmt(local: string): string {
  const naive = Date.parse(`${local}Z`);
  let guess = naive - berlinOffsetMinutes(naive) * 60000;
  guess = naive - berlinOffsetMinutes(guess) * 60000;
  return new Date(guess).toISOString().slice(0, 19);
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Fließtext mit absoluten Adressen: Bilder/Audio vom Asset-Host, interne Links auf die Live-Domain des Marktes. */
function absoluteContent(html: string, origin: string): string {
  return html
    .replace(/\b(src|href|poster)="(\/(?:imported|brand|city-images)\/[^"]+)"/g, (_match, attr: string, path: string) => `${attr}="${staticAsset(path)}"`)
    .replace(/\bhref="(\/[^"]*)"/g, (_match, href: string) => `href="${origin}${href}"`);
}

/** Verkleinerte Varianten über den Bildoptimierer des Asset-Hosts (Breiten aus den Next.js-Standardgrößen). */
function optimizedUrl(imagePath: string, width: number) {
  return `${assetHost}/_next/image/?url=${encodeURIComponent(imagePath)}&w=${width}&q=75`;
}

const SIZE_STEPS: Array<[string, number]> = [
  ["medium", 384],
  ["medium_large", 750],
  ["large", 1080],
];

const articleSlug = (path: string) => path.match(/^\/magazin\/([a-z0-9-]+)\/$/)?.[1] ?? null;

export function buildMagazineSource(market: MarketCode): MagazineSource {
  const origin = `https://${getMarket(market).domain}`;
  const snapshot = new Map((wpSnapshot.posts as unknown as WpPost[]).map((post) => [post.slug, post]));
  const mediaInfo = mediaSnapshot as unknown as Record<string, { width: number; height: number; mime: string; bytes: number }>;
  const categoryRows = categorySnapshot.categories as unknown as Array<{ id: number; slug: string; name: string; description?: string }>;

  // Artikel: Magazin-Seiten mit WordPress-Abzug (Beiträge) und eigene Artikel mit `updated` (data/editorial-pages.json).
  // Autoren- und Werkzeugseiten unter /magazin/ (Familie "magazine" ohne Abzug) sind keine Beiträge.
  const pages = [...(editorialSnapshot.pages as unknown as SourcePage[]), ...(pagesSnapshot.pages as unknown as SourcePage[])].filter((page) => {
    const slug = articleSlug(page.path);
    return page.market === market && page.family === "magazine" && slug !== null && (snapshot.has(slug) || Boolean(page.updated));
  });

  const posts: SourceEntry[] = pages.map((page) => {
    const slug = articleSlug(page.path) as string;
    const wp = snapshot.get(slug);
    const id = wp?.id ?? postIdForSlug(slug);
    const date = wp?.date ?? `${page.updated}T00:00:00`;
    const modified = wp?.modified ?? date;
    const info = page.heroImage ? mediaInfo[page.heroImage] : undefined;
    const media: SourceMedia | null =
      page.heroImage && info
        ? {
            id: wp?.featured_media || mediaIdForPostId(id),
            slug: page.heroImage.split("/").pop()!.replace(/\.[^.]+$/, ""),
            title: page.title,
            altText: (page.heroTitle || page.title).trim() || page.title,
            sourceUrl: staticAsset(page.heroImage),
            mimeType: info.mime,
            width: info.width,
            height: info.height,
            bytes: info.bytes,
            imagePath: page.heroImage,
            date,
            dateGmt: berlinToGmt(date),
            post: id,
          }
        : null;
    return {
      id,
      slug,
      link: page.canonical,
      title: escapeHtml(page.title),
      excerpt: `<p>${escapeHtml(page.description)}</p>\n`,
      content: absoluteContent(page.contentHtml, origin),
      date,
      dateGmt: berlinToGmt(date),
      modified,
      modifiedGmt: berlinToGmt(modified),
      author: wp?.author ?? 1,
      categories:
        wp?.categories ??
        page.categories
          .map((categorySlug) => categoryRows.find((row) => row.slug === categorySlug)?.id)
          .filter((value): value is number => typeof value === "number"),
      tags: wp?.tags ?? [],
      media,
    };
  });

  const categories: SourceCategory[] = categoryRows
    .map((row) => ({ id: row.id, slug: row.slug, name: row.name, description: row.description ?? "", count: posts.filter((post) => post.categories.includes(row.id)).length }))
    .sort((a, b) => a.id - b.id);
  const tags: SourceCategory[] = (wpSnapshot.tags as unknown as Array<{ id: number; name: string; slug: string; description?: string }>)
    .map((row) => ({ id: row.id, name: row.name, slug: row.slug, description: row.description ?? "", count: posts.filter((post) => post.tags.includes(row.id)).length }))
    .sort((a, b) => a.id - b.id);

  return { market, origin, posts, categories, tags, media: posts.flatMap((post) => (post.media ? [post.media] : [])) };
}

const cached = new Map<MarketCode, MagazineSource>();
export function loadMagazineSource(market: MarketCode): MagazineSource {
  let source = cached.get(market);
  if (!source) {
    source = buildMagazineSource(market);
    cached.set(market, source);
  }
  return source;
}

// ---------------------------------------------------------------- Objekte im WordPress-Format

const restBase = (source: MagazineSource) => `${source.origin}${REST_BASE_PATH}/wp/v2`;
const hubLink = (source: MagazineSource) => `${source.origin}/magazin/`;

function mediaObject(media: SourceMedia, source: MagazineSource): Json {
  const base = restBase(source);
  const sizes: Record<string, unknown> = {};
  for (const [name, width] of SIZE_STEPS) {
    if (media.width <= width || !/^image\/(jpeg|png|webp)$/.test(media.mimeType)) continue;
    sizes[name] = {
      file: media.imagePath.split("/").pop(),
      width,
      height: Math.round((media.height * width) / media.width),
      mime_type: media.mimeType,
      source_url: optimizedUrl(media.imagePath, width),
    };
  }
  sizes.full = {
    file: media.imagePath.split("/").pop(),
    width: media.width,
    height: media.height,
    mime_type: media.mimeType,
    source_url: media.sourceUrl,
  };
  return {
    id: media.id,
    date: media.date,
    date_gmt: media.dateGmt,
    guid: { rendered: media.sourceUrl },
    modified: media.date,
    modified_gmt: media.dateGmt,
    slug: media.slug,
    status: "inherit",
    type: "attachment",
    link: media.sourceUrl,
    title: { rendered: media.title },
    author: 1,
    comment_status: "closed",
    ping_status: "closed",
    template: "",
    meta: [],
    description: { rendered: "" },
    caption: { rendered: "" },
    alt_text: media.altText,
    media_type: "image",
    mime_type: media.mimeType,
    media_details: { width: media.width, height: media.height, file: media.imagePath.split("/").pop(), filesize: media.bytes, sizes },
    post: media.post,
    source_url: media.sourceUrl,
    _links: {
      self: [{ href: `${base}/media/${media.id}` }],
      collection: [{ href: `${base}/media` }],
    },
  };
}

function termObject(category: SourceCategory, taxonomy: "category" | "post_tag", source: MagazineSource): Json {
  return {
    id: category.id,
    link: hubLink(source),
    name: category.name,
    slug: category.slug,
    taxonomy,
  };
}

function categoryObject(category: SourceCategory, source: MagazineSource): Json {
  const base = restBase(source);
  return {
    id: category.id,
    count: category.count,
    description: category.description,
    link: hubLink(source),
    name: category.name,
    slug: category.slug,
    taxonomy: "category",
    parent: 0,
    meta: [],
    _links: {
      self: [{ href: `${base}/categories/${category.id}` }],
      collection: [{ href: `${base}/categories` }],
      "wp:post_type": [{ href: `${base}/posts?categories=${category.id}` }],
    },
  };
}

function tagObject(tag: SourceCategory, source: MagazineSource): Json {
  const base = restBase(source);
  return {
    id: tag.id,
    count: tag.count,
    description: tag.description,
    link: hubLink(source),
    name: tag.name,
    slug: tag.slug,
    taxonomy: "post_tag",
    meta: [],
    _links: {
      self: [{ href: `${base}/tags/${tag.id}` }],
      collection: [{ href: `${base}/tags` }],
    },
  };
}

function entryObject(entry: SourceEntry, source: MagazineSource, embed: Set<string> | null): Json {
  const base = restBase(source);
  const media = entry.media;
  const object: Json = {
    id: entry.id,
    date: entry.date,
    date_gmt: entry.dateGmt,
    guid: { rendered: entry.link },
    modified: entry.modified,
    modified_gmt: entry.modifiedGmt,
    slug: entry.slug,
    status: "publish",
    type: "post",
    link: entry.link,
    title: { rendered: entry.title },
    content: { rendered: entry.content, protected: false },
    excerpt: { rendered: entry.excerpt, protected: false },
    author: entry.author,
    featured_media: media ? media.id : 0,
    comment_status: "closed",
    ping_status: "closed",
    sticky: false,
    template: "",
    format: "standard",
    meta: { footnotes: "" },
    categories: entry.categories,
    tags: entry.tags,
  };

  const links: Json = {
    self: [{ href: `${base}/posts/${entry.id}` }],
    collection: [{ href: `${base}/posts` }],
    about: [{ href: `${base}/types/post` }],
  };
  if (media) links["wp:featuredmedia"] = [{ embeddable: true, href: `${base}/media/${media.id}` }];
  links["wp:term"] = [
    { taxonomy: "category", embeddable: true, href: `${base}/categories?post=${entry.id}` },
    { taxonomy: "post_tag", embeddable: true, href: `${base}/tags?post=${entry.id}` },
  ];
  object._links = links;

  if (embed) {
    const embedded: Json = {};
    if (media && embed.has("wp:featuredmedia")) embedded["wp:featuredmedia"] = [mediaObject(media, source)];
    if (embed.has("wp:term")) {
      embedded["wp:term"] = [
        entry.categories
          .map((id) => source.categories.find((category) => category.id === id))
          .filter((category): category is SourceCategory => Boolean(category))
          .map((category) => termObject(category, "category", source)),
        entry.tags
          .map((id) => source.tags.find((tag) => tag.id === id))
          .filter((tag): tag is SourceCategory => Boolean(tag))
          .map((tag) => termObject(tag, "post_tag", source)),
      ];
    }
    if (Object.keys(embedded).length) object._embedded = embedded;
  }
  return object;
}

// ---------------------------------------------------------------- Parameter

function intParam(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function idList(params: URLSearchParams, key: string): number[] | null {
  const raw = params.getAll(key).flatMap((value) => value.split(","));
  if (!raw.length) return null;
  return raw.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value));
}

function embedSet(params: URLSearchParams): Set<string> | null {
  if (!params.has("_embed")) return null;
  const raw = params.get("_embed") ?? "";
  if (raw === "" || raw === "1" || raw === "true") return new Set(["wp:featuredmedia", "wp:term"]);
  if (raw === "0" || raw === "false") return null;
  return new Set(raw.split(",").map((value) => value.trim()));
}

function fieldPaths(params: URLSearchParams): string[] | null {
  const raw = params.get("_fields");
  if (!raw) return null;
  const paths = raw.split(",").map((value) => value.trim()).filter(Boolean);
  return paths.length ? paths : null;
}

function pickPaths(value: unknown, paths: string[][]): unknown {
  if (!paths.length) return value;
  if (Array.isArray(value)) return value.map((item) => pickPaths(item, paths));
  if (value === null || typeof value !== "object") return value;
  const source = value as Json;
  const out: Json = {};
  const wholeKeys = new Set(paths.filter((path) => path.length === 1).map((path) => path[0]));
  const nested = new Map<string, string[][]>();
  for (const path of paths) {
    if (path.length > 1) nested.set(path[0], [...(nested.get(path[0]) || []), path.slice(1)]);
  }
  for (const key of Object.keys(source)) {
    if (wholeKeys.has(key)) out[key] = source[key];
    else if (nested.has(key)) out[key] = pickPaths(source[key], nested.get(key) || []);
  }
  return out;
}

function applyFields(object: Json, fields: string[] | null): Json {
  if (!fields) return object;
  return pickPaths(object, fields.map((field) => field.split("."))) as Json;
}

function plain(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
}

type Collected = { items: SourceEntry[]; total: number; totalPages: number };

function queryEntries(entries: SourceEntry[], params: URLSearchParams): Collected {
  let items = entries.slice();

  const include = idList(params, "include");
  if (include) items = items.filter((entry) => include.includes(entry.id));
  const exclude = idList(params, "exclude");
  if (exclude) items = items.filter((entry) => !exclude.includes(entry.id));
  const slugs = params.getAll("slug").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  if (slugs.length) items = items.filter((entry) => slugs.includes(entry.slug));
  const authors = idList(params, "author");
  if (authors) items = items.filter((entry) => authors.includes(entry.author));
  const categories = idList(params, "categories");
  if (categories) items = items.filter((entry) => entry.categories.some((id) => categories.includes(id)));
  const categoriesExclude = idList(params, "categories_exclude");
  if (categoriesExclude) items = items.filter((entry) => !entry.categories.some((id) => categoriesExclude.includes(id)));
  const tags = idList(params, "tags");
  if (tags) items = items.filter((entry) => entry.tags.some((id) => tags.includes(id)));
  const search = params.get("search")?.trim().toLowerCase();
  if (search) {
    items = items.filter((entry) => `${plain(entry.title)} ${plain(entry.excerpt)} ${plain(entry.content)}`.includes(search));
  }
  const after = params.get("after");
  if (after) items = items.filter((entry) => entry.date > after.replace(/Z$/, ""));
  const before = params.get("before");
  if (before) items = items.filter((entry) => entry.date < before.replace(/Z$/, ""));
  const modifiedAfter = params.get("modified_after");
  if (modifiedAfter) items = items.filter((entry) => entry.modified > modifiedAfter.replace(/Z$/, ""));
  const modifiedBefore = params.get("modified_before");
  if (modifiedBefore) items = items.filter((entry) => entry.modified < modifiedBefore.replace(/Z$/, ""));

  const orderby = params.get("orderby") || "date";
  const direction = (params.get("order") || "desc").toLowerCase() === "asc" ? 1 : -1;
  const key = (entry: SourceEntry): string | number => {
    switch (orderby) {
      case "modified": return entry.modified;
      case "title": return entry.title.toLowerCase();
      case "slug": return entry.slug;
      case "id": return entry.id;
      case "author": return entry.author;
      case "include": return include ? include.indexOf(entry.id) : 0;
      default: return entry.date;
    }
  };
  items.sort((a, b) => {
    const left = key(a);
    const right = key(b);
    const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "de");
    return order * direction || b.id - a.id;
  });

  const total = items.length;
  const perPage = intParam(params, "per_page", DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const offset = params.has("offset") ? intParam(params, "offset", 0, 0, Number.MAX_SAFE_INTEGER) : (intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER) - 1) * perPage;
  return { items: items.slice(offset, offset + perPage), total, totalPages: total === 0 ? 0 : totalPages };
}

function collectionHeaders(route: string, params: URLSearchParams, total: number, totalPages: number, source: MagazineSource): Record<string, string> {
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const headers: Record<string, string> = { "X-WP-Total": String(total), "X-WP-TotalPages": String(totalPages) };
  const link = (target: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(target));
    return `<${restBase(source)}/${route}?${next.toString()}>`;
  };
  const parts: string[] = [];
  if (page > 1) parts.push(`${link(page - 1)}; rel="prev"`);
  if (page < totalPages) parts.push(`${link(page + 1)}; rel="next"`);
  if (parts.length) headers.Link = parts.join(", ");
  return headers;
}

function postCollection(params: URLSearchParams, source: MagazineSource): WpRestResponse {
  const { items, total, totalPages } = queryEntries(source.posts, params);
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  if (page > 1 && page > totalPages && !params.has("offset")) {
    return error(400, "rest_post_invalid_page_number", "Die angeforderte Seitennummer ist größer als die Anzahl der verfügbaren Seiten.");
  }
  const embed = embedSet(params);
  const fields = fieldPaths(params);
  return {
    status: 200,
    body: items.map((entry) => applyFields(entryObject(entry, source, embed), fields)),
    headers: collectionHeaders("posts", params, total, totalPages, source),
  };
}

function termCollection(kind: "categories" | "tags", params: URLSearchParams, source: MagazineSource): WpRestResponse {
  let rows = (kind === "categories" ? source.categories : source.tags).filter((row) => row.count > 0 || params.get("hide_empty") === "false");
  const include = idList(params, "include");
  if (include) rows = rows.filter((row) => include.includes(row.id));
  const slugs = params.getAll("slug").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  if (slugs.length) rows = rows.filter((row) => slugs.includes(row.slug));
  const post = idList(params, "post");
  if (post) {
    const entries = source.posts.filter((entry) => post.includes(entry.id));
    rows = rows.filter((row) => entries.some((entry) => (kind === "categories" ? entry.categories : entry.tags).includes(row.id)));
  }
  const orderby = params.get("orderby") || "name";
  const direction = (params.get("order") || "asc").toLowerCase() === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    const order = orderby === "count" ? a.count - b.count : orderby === "id" ? a.id - b.id : orderby === "slug" ? a.slug.localeCompare(b.slug) : a.name.localeCompare(b.name, "de");
    return order * direction;
  });
  const total = rows.length;
  const perPage = intParam(params, "per_page", DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  const fields = fieldPaths(params);
  return {
    status: 200,
    body: rows.slice((page - 1) * perPage, page * perPage).map((row) => applyFields((kind === "categories" ? categoryObject : tagObject)(row, source), fields)),
    headers: collectionHeaders(kind, params, total, totalPages, source),
  };
}

// ---------------------------------------------------------------- Einstieg

/**
 * @param route  Pfad hinter /magazin/wp-json, z. B. "/wp/v2/posts" oder "/wp/v2/posts/606" (mit oder ohne Slash am Ende)
 * @param params Query-Parameter der Anfrage
 * @param market de, at oder ch (anderes: 404)
 */
export function handleWpRest(route: string, params: URLSearchParams, market: string, source?: MagazineSource): WpRestResponse {
  if (!isMarketCode(market)) return NO_ROUTE();
  source ??= loadMagazineSource(market);
  const normalized = `/${route.replace(/^\/+|\/+$/g, "")}`;
  const parts = normalized.split("/").filter(Boolean);

  if (normalized === "/") {
    return {
      status: 200,
      body: {
        name: `Christlich Verliebt - Magazin (${getMarket(source.market).countryName})`,
        description: "",
        url: source.origin,
        home: source.origin,
        namespaces: ["wp/v2"],
        authentication: {},
        routes: Object.fromEntries(NAMESPACE_ROUTES.map((path) => [path, { namespace: "wp/v2", methods: ["GET"] }])),
      },
      headers: {},
    };
  }

  if (parts[0] !== "wp" || parts[1] !== "v2") return NO_ROUTE();
  if (parts.length === 2) return { status: 200, body: { namespace: "wp/v2", routes: NAMESPACE_ROUTES }, headers: {} };

  const resource = parts[2];
  const idPart = parts[3];
  if (parts.length > 4) return NO_ROUTE();

  // Kein /users- und kein /pages-Endpunkt. Autoren gibt es nur als ID im Beitrag.
  if (resource === "posts") {
    if (!idPart) return postCollection(params, source);
    const entry = /^\d+$/.test(idPart) ? source.posts.find((item) => item.id === Number(idPart)) : undefined;
    if (!entry) return error(404, "rest_post_invalid_id", "Ungültige Beitrags-ID.");
    return { status: 200, body: applyFields(entryObject(entry, source, embedSet(params)), fieldPaths(params)), headers: {} };
  }

  if (resource === "categories" || resource === "tags") {
    if (!idPart) return termCollection(resource, params, source);
    const rows = resource === "categories" ? source.categories : source.tags;
    const row = /^\d+$/.test(idPart) ? rows.find((item) => item.id === Number(idPart)) : undefined;
    if (!row) return error(404, "rest_term_invalid", "Begriff existiert nicht.");
    return { status: 200, body: applyFields((resource === "categories" ? categoryObject : tagObject)(row, source), fieldPaths(params)), headers: {} };
  }

  // Nur Beitragsbilder (die einzigen Medien); keine Liste der Mediathek.
  if (resource === "media" && idPart && /^\d+$/.test(idPart)) {
    const media = source.media.find((item) => item.id === Number(idPart));
    if (!media) return error(404, "rest_post_invalid_id", "Ungültige Beitrags-ID.");
    return { status: 200, body: applyFields(mediaObject(media, source), fieldPaths(params)), headers: {} };
  }

  return NO_ROUTE();
}

/** Antwort als Response-Objekt inklusive CORS-, Cache- und WP-Headern. */
export function wpRestResponse(result: WpRestResponse, method = "GET"): Response {
  const headers = new Headers({ ...WP_REST_HEADERS, ...result.headers });
  if (result.status >= 400) headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  const body = method === "HEAD" ? null : JSON.stringify(result.body);
  return new Response(body, { status: result.status, headers });
}

export function wpRestPreflight(): Response {
  const headers = new Headers(WP_REST_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}
