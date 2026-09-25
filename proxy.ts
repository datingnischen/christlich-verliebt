import type { NextRequest } from "next/server.js";
import { NextResponse } from "next/server.js";
import { publicUrl, withTrailingSlash, type MarketCode } from "./lib/markets.ts";

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

// Ersetzt die eingebaute Slash-Umleitung von Next.js (skipTrailingSlashRedirect): Seitenpfade enden
// immer auf "/". Next.js kannte nur den Upstream-Pfad: nginx ruft für christlich-verliebt.at/faq hier
// /at/faq auf, und Besucher landeten auf christlich-verliebt.at/at/faq/ (404). Pfade mit Länderpräfix
// gehen darum absolut auf die öffentliche Landesdomain ohne Präfix.
function trailingSlashRedirect(request: NextRequest, hostMarket: MarketCode | undefined) {
  const { pathname, search } = request.nextUrl;
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

export function proxy(request: NextRequest) {
  if (request.headers.get("x-cv-rewrite-token") === TOKEN) return NextResponse.next();
  const path = request.nextUrl.pathname;
  if (PASS_PREFIXES.some(prefix => path.startsWith(prefix)) || path === "/favicon.ico") {
    return NextResponse.next();
  }

  const hostMarket = HOST_MARKETS.get(hostname(request));
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
  destination.pathname = publicPath === "/sitemap.xml"
    ? `/${market}/sitemap-data.xml`
    : `/${market}${publicPath === "/" ? "" : publicPath}`;
  const headers = new Headers(request.headers);
  headers.set("x-cv-rewrite-token", TOKEN);
  return NextResponse.rewrite(destination, { request: { headers } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|app-assets/|icon.png|apple-icon.png|brand/|imported/|city-images/).*)"] };
