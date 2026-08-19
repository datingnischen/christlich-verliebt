import type { NextRequest } from "next/server.js";
import { NextResponse } from "next/server.js";

const HOST_MARKETS = new Map([
  ["christlich-verliebt.de", "de"],
  ["christlich-verliebt.at", "at"],
  ["christlich-verliebt.ch", "ch"],
]);
const TOKEN = globalThis.crypto.randomUUID();

function hostname(request: NextRequest) {
  return (request.headers.get("host") || request.nextUrl.hostname)
    .split(",")[0].trim().toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
}

export function proxy(request: NextRequest) {
  if (request.headers.get("x-cv-rewrite-token") === TOKEN) return NextResponse.next();
  const path = request.nextUrl.pathname;
  if (path.startsWith("/_next/") || path.startsWith("/brand/") || path.startsWith("/imported/") || path === "/favicon.ico") {
    return NextResponse.next();
  }

  const hostMarket = HOST_MARKETS.get(hostname(request));
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

export const config = { matcher: ["/((?!_next/static|_next/image|brand/|imported/).*)"] };
