import type { NextRequest } from "next/server.js";
import { NextResponse } from "next/server.js";
import { publicUrl, withTrailingSlash, type MarketCode } from "./lib/markets.ts";
import { IT_ABOUT, IT_ABOUT_SLUG, IT_CITIES, IT_CITY_BASE, IT_HOME, IT_HOST, IT_ORIGIN, IT_PILOT_INDEXABLE, itCityUrl, itMagazineUrl, itPublicUrl } from "./lib/it-pilot.ts";
import { IT_ARTICLES, IT_MAGAZINE } from "./lib/it-magazine.ts";
import { staticAsset } from "./lib/static-asset.ts";

const HOST_MARKETS = new Map<string, MarketCode>([
  ["christlich-verliebt.de", "de"],
  ["christlich-verliebt.at", "at"],
  ["christlich-verliebt.ch", "ch"],
]);
const TOKEN = globalThis.crypto.randomUUID();
const PASS_PREFIXES = ["/_next/", "/app-assets/", "/brand/", "/imported/", "/city-images/", "/api/", "/.well-known/"];

function hostname(request: NextRequest) {
  return (request.headers.get("host") || request.nextUrl.hostname)
    .split(",")[0].trim().toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
}

// WordPress-kompatibler REST-Endpunkt für ICONY (/magazin/wp-json/..., /magazin/index.php?rest_route=...,
// /magazin/?rest_route=...): ICONY ruft ohne Slash am Ende auf, die Antwort muss 200 JSON sein (keine 308).
function isWpRestRequest(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/(?:de|at|ch)(?=\/)/, "");
  if (path === "/magazin/wp-json" || path.startsWith("/magazin/wp-json/") || path === "/magazin/index.php") return true;
  return (path === "/magazin" || path === "/magazin/") && request.nextUrl.searchParams.has("rest_route");
}

// Ersetzt die eingebaute Slash-Umleitung von Next.js (skipTrailingSlashRedirect): Seitenpfade enden
// immer auf "/". Next.js kannte nur den Upstream-Pfad: nginx ruft für christlich-verliebt.at/faq hier
// /at/faq auf, und Besucher landeten auf christlich-verliebt.at/at/faq/ (404). Pfade mit Länderpräfix
// gehen darum absolut auf die öffentliche Landesdomain ohne Präfix.
function trailingSlashRedirect(request: NextRequest, hostMarket: MarketCode | undefined) {
  const { pathname, search } = request.nextUrl;
  if (isWpRestRequest(request)) return null;
  if (pathname.endsWith("/") || withTrailingSlash(pathname) === pathname) return null;

  const target = withTrailingSlash(pathname);
  const explicit = target.match(/^\/(de|at|ch)(\/.*)$/);
  if (hostMarket) {
    // Produktionshost direkt auf Vercel: gleicher Host, ein evtl. Präfix fällt gleich mit weg.
    const destination = new URL(request.nextUrl.href);
    destination.pathname = explicit ? explicit[2] : target;
    return NextResponse.redirect(destination, 308);
  }
  if (explicit) {
    return NextResponse.redirect(`${publicUrl(explicit[1] as MarketCode, explicit[2])}${search}`, 308);
  }
  // Plain URL statt nextUrl.clone(): NextURL normalisiert den Schrägstrich sonst selbst.
  const destination = new URL(request.nextUrl.href);
  destination.pathname = target;
  return NextResponse.redirect(destination, 308);
}

// Stadtseiten lagen bis 2026-10-20 direkt unter /<città>/, seitdem unter /incontri/<città>/.
const IT_LEGACY_CITY = new RegExp(`^/(${IT_CITIES.map(city => city.slug).join("|")})/?$`);
function itCurrentPath(path: string) {
  const legacy = path.match(IT_LEGACY_CITY);
  return legacy ? `/${IT_CITY_BASE}/${legacy[1]}/` : path;
}

// llms.txt der eigenen Domain (Projektregel: jede eigene Wurzel hat eine), aus denselben Daten wie die Sitemap.
function italianLlmsText() {
  const line = (title: string, url: string, text: string) => `- [${title}](${url}): ${text}`;
  return [
    `# ${IT_HOST}`,
    "",
    `> ${IT_HOME.description} Guida informativa in italiano; registrazione e profili si trovano sulla piattaforma svizzera christlich-verliebt.ch.`,
    "",
    "## Guide per città (Ticino)",
    line("Incontri in Ticino per single cristiani", itCityUrl(), "Panoramica delle cinque guide."),
    ...IT_CITIES.map((city) => line(city.title, itCityUrl(city.slug), city.description)),
    "",
    "## Magazine",
    line(IT_MAGAZINE.title, itMagazineUrl(), IT_MAGAZINE.description),
    ...IT_ARTICLES.map((article) => line(article.title, itMagazineUrl(article.slug), article.description)),
    "",
    "## Chi siamo e informazioni legali",
    line(IT_ABOUT.title, itPublicUrl(IT_ABOUT_SLUG), IT_ABOUT.description),
    line("Note legali", itPublicUrl("note-legali"), "Responsabile dei contenuti e contatti."),
    line("Protezione dei dati", itPublicUrl("privacy"), "Quali dati tratta il sito."),
    "",
    "## Optional",
    line("christlich-verliebt.ch", "https://christlich-verliebt.ch/", "Piattaforma di incontri per single cristiani in Svizzera (in tedesco), gestita da ICONY GmbH."),
    "",
  ].join("\n");
}

// single-cristiani.ch: eigene Domain der italienischen Variante. Die Seiten liegen intern unter /ch/it/
// (app/[market]/it), robots, Sitemap, llms.txt und favicon beantwortet der Proxy selbst.
function italianSite(request: NextRequest, path: string) {
  if (path === "/favicon.ico") return NextResponse.redirect(staticAsset("/brand/icon.png"), 308);
  if (path === "/llms.txt") {
    if (!IT_PILOT_INDEXABLE) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(italianLlmsText(), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
  }
  if (path === "/robots.txt") {
    const sitemap = IT_PILOT_INDEXABLE ? `\nSitemap: ${IT_ORIGIN}/sitemap.xml\n` : "";
    return new NextResponse(`User-agent: *\nAllow: /\n${sitemap}`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
  }
  if (path === "/sitemap.xml") {
    if (!IT_PILOT_INDEXABLE) return new NextResponse("Not found", { status: 404 });
    const urls = [itPublicUrl(), itCityUrl(), ...IT_CITIES.map(city => itCityUrl(city.slug)), itMagazineUrl(), ...IT_ARTICLES.map(article => itMagazineUrl(article.slug)), itPublicUrl(IT_ABOUT_SLUG)];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
    return new NextResponse(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
  }
  const internal = path.match(/^\/ch\/it(\/.*)?$/);
  const target = itCurrentPath(withTrailingSlash(internal ? internal[1] || "/" : path));
  if (internal || target !== path) {
    return NextResponse.redirect(`${IT_ORIGIN}${target}${request.nextUrl.search}`, 308);
  }
  const destination = request.nextUrl.clone();
  destination.pathname = `/ch/it${path === "/" ? "" : path}`;
  const headers = new Headers(request.headers);
  headers.set("x-cv-rewrite-token", TOKEN);
  return NextResponse.rewrite(destination, { request: { headers } });
}

export function proxy(request: NextRequest) {
  if (request.headers.get("x-cv-rewrite-token") === TOKEN) return NextResponse.next();
  const path = request.nextUrl.pathname;
  const host = hostname(request);
  // single-cristiani.ch hat keine eigene favicon.ico-Datei: der Proxy leitet auf das Marken-Icon (italianSite).
  if (PASS_PREFIXES.some(prefix => path.startsWith(prefix)) || (path === "/favicon.ico" && host !== IT_HOST)) {
    return NextResponse.next();
  }

  // Teaserbilder für ICONY: /magazin/media/<pfad> (auch mit Upstream-Präfix /de/…) ist die Datei public/<pfad>.
  const mediaFile = path.match(/^(?:\/(?:de|at|ch))?\/magazin\/media\/((?:imported|brand|city-images)\/.+\.[a-z0-9]+)$/i);
  if (mediaFile) {
    const file = request.nextUrl.clone();
    file.pathname = `/${mediaFile[1]}`;
    return NextResponse.rewrite(file);
  }

  if (host === IT_HOST) return italianSite(request, path);
  const hostMarket = HOST_MARKETS.get(host);
  // christlich-verliebt.ch/it/… liegt seit 2026-10-20 auf der eigenen Domain single-cristiani.ch.
  if (hostMarket === "ch" && /^\/it(?:\/|$)/.test(path)) {
    return NextResponse.redirect(`${IT_ORIGIN}${itCurrentPath(withTrailingSlash(path.replace(/^\/it/, "") || "/"))}${request.nextUrl.search}`, 308);
  }
  // Vorschau: alte Stadtadressen /ch/it/<città>/ auf /ch/it/incontri/<città>/.
  const previewItalian = !hostMarket && path.match(/^\/ch\/it(\/[^/]+\/?)$/);
  if (previewItalian && IT_LEGACY_CITY.test(previewItalian[1])) {
    const destination = new URL(request.nextUrl.href);
    destination.pathname = `/ch/it${itCurrentPath(previewItalian[1])}`;
    return NextResponse.redirect(destination, 308);
  }
  const slashRedirect = trailingSlashRedirect(request, hostMarket);
  if (slashRedirect) return slashRedirect;

  const explicit = path.match(/^\/(de|at|ch)(\/.*)?$/);
  if (hostMarket && explicit) {
    const canonical = request.nextUrl.clone();
    canonical.pathname = explicit[2] || "/";
    return NextResponse.redirect(canonical, 308);
  }
  const market = hostMarket || explicit?.[1] || "de";
  const publicPath = hostMarket ? path : explicit ? explicit[2] || "/" : path;
  if (!hostMarket && explicit && publicPath === "/sitemap-data.xml") {
    return new NextResponse("Not found", { status: 404 });
  }
  const destination = request.nextUrl.clone();
  const restIndex = (publicPath === "/magazin" || publicPath === "/magazin/") && request.nextUrl.searchParams.has("rest_route");
  // Magazin-Sitemap: ICONYs sitemap.php verweist auf /magazin/sitemap.xml (nginx reicht /sitemap.xml nicht durch).
  destination.pathname = publicPath === "/sitemap.xml" || publicPath === "/magazin/sitemap.xml"
    ? `/${market}/sitemap-data.xml`
    : restIndex
      ? `/${market}/magazin/index.php`
      : `/${market}${publicPath === "/" ? "" : publicPath}`;
  // Vercel verwirft bei Rewrites Parameter ohne Wert; ICONY ruft "?_embed" ohne Wert auf (WordPress-Schreibweise).
  if (destination.searchParams.has("_embed") && destination.searchParams.get("_embed") === "") {
    destination.searchParams.set("_embed", "1");
  }
  const headers = new Headers(request.headers);
  headers.set("x-cv-rewrite-token", TOKEN);
  return NextResponse.rewrite(destination, { request: { headers } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|app-assets/|icon.png|apple-icon.png|brand/|imported/|city-images/).*)"] };
