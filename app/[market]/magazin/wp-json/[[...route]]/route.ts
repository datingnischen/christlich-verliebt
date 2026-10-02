import { handleWpRest, wpRestPreflight, wpRestResponse } from "@/lib/wp-rest-compat";

// WordPress-kompatibler REST-Endpunkt je Markt (aus den Magazin-Dateien erzeugt), siehe lib/wp-rest-compat.ts.
// Intern /<market>/magazin/wp-json/wp/v2/posts; auf den Produktionshosts ohne Länderpräfix sichtbar:
// https://christlich-verliebt.de/magazin/wp-json/wp/v2/posts (proxy.ts schreibt den Host auf den Markt um).
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ market: string; route?: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { market, route = [] } = await context.params;
  const result = handleWpRest(`/${route.join("/")}`, new URL(request.url).searchParams, market);
  return wpRestResponse(result, request.method);
}

export const HEAD = GET;

export function OPTIONS() {
  return wpRestPreflight();
}
