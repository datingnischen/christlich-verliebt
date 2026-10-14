/**
 * Teaserbilder für ICONY (wp-json `_embedded["wp:featuredmedia"]`) auf der eigenen Domain.
 *
 * Hintergrund (Heiko, 2026-10-14): Die ICONY-Startseiten laden die drei Magazin-Teaser per WordPress-REST-API und
 * erlauben Bilder nur von der eigenen Domain (CSP `img-src 'self'`). Der nginx vor der Domain reicht aber nur
 * Seitenrouten ohne Dateiendung an Vercel weiter – `…/bild.jpg` landet bei ICONY (404) – und Vercels Firewall
 * blockt hinter nginx zusätzlich `/magazin/wp-content/uploads/…`. Darum bekommen die Bilder eine Adresse ohne
 * Dateiendung im ohnehin durchgereichten wp-json-Bereich:
 *
 *   https://<domain>/magazin/wp-json/datingnischen/v1/bild/magazin/wp-content/uploads/2026/03/foto-768x511~jpg
 *
 * Die Endung steht hinter einer Tilde. Die wp-json-Route liefert die Datei vom Asset-Host (dieselbe Datei aus
 * public/) mit langem CDN-Cache aus. Nur Dateien unter den freigegebenen Ordnern, kein fremder Host.
 */

const ASSET_BASE = "https://christlich-verliebt.vercel.app/app-assets";
export const TEASER_IMAGE_NAMESPACE = ["datingnischen", "v1", "bild"] as const;

const ALLOWED_PATH = /^\/(?:(?:magazin|kochbuch|magazine)\/(?:wp-content\/uploads|media)|imported|brand|city-images)\//;
const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

/** Asset-Pfad aus einer absoluten oder relativen Bildadresse: "https://x.vercel.app/app-assets/a/b.jpg" -> "/a/b.jpg". */
export function assetPathOf(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/app-assets(?=\/)/, "").replace(/[?#].*$/, "");
}

/** Öffentliche Bildadresse ohne Dateiendung; restRoot z. B. "https://veggie-sucht-veggie.de/magazin/wp-json". */
export function teaserImageUrl(restRoot: string, imageUrlOrPath: string): string {
  const segments = assetPathOf(imageUrlOrPath).split("/").filter(Boolean);
  const last = segments.length - 1;
  const encoded = segments.map((segment, index) => encodeURIComponent(index === last ? segment.replace(/\.([a-z0-9]+)$/i, "~$1") : segment));
  return `${restRoot.replace(/\/+$/, "")}/${TEASER_IMAGE_NAMESPACE.join("/")}/${encoded.join("/")}`;
}

export function isTeaserImageRoute(route: readonly string[]): boolean {
  return TEASER_IMAGE_NAMESPACE.every((part, index) => route[index] === part);
}

/** Asset-Pfad aus den Routensegmenten (nach dem Namespace) oder null, wenn er nicht erlaubt ist. */
export function teaserImagePath(route: readonly string[]): string | null {
  const segments = route.slice(TEASER_IMAGE_NAMESPACE.length).map((segment) => decodeURIComponent(segment));
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) return null;
  const path = `/${segments.join("/")}`.replace(/~([a-z0-9]+)$/i, ".$1");
  const extension = path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (!extension || !MIME[extension] || !ALLOWED_PATH.test(path)) return null;
  return path;
}

function notFound(): Response {
  return new Response(JSON.stringify({ code: "rest_no_route", message: "Bild nicht gefunden.", data: { status: 404 } }), {
    status: 404,
    headers: { "content-type": "application/json; charset=UTF-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" },
  });
}

export async function teaserImageResponse(route: readonly string[], method = "GET"): Promise<Response> {
  const path = teaserImagePath(route);
  if (!path) return notFound();
  const upstream = await fetch(`${ASSET_BASE}${path.split("/").map(encodeURIComponent).join("/")}`, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return notFound();
  const extension = path.split(".").pop()!.toLowerCase();
  return new Response(method === "HEAD" ? null : upstream.body, {
    status: 200,
    headers: {
      "content-type": MIME[extension],
      "cache-control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
    },
  });
}
