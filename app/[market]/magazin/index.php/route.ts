import { handleWpRest, wpRestPreflight, wpRestResponse } from "@/lib/wp-rest-compat";

// WordPress-Schreibweise ohne schöne Permalinks: /magazin/index.php?rest_route=/wp/v2/posts
// Auch /magazin/?rest_route=/wp/v2/posts landet hier (proxy.ts); ohne rest_route geht es ins Magazin.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ market: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { market } = await context.params;
  const params = new URL(request.url).searchParams;
  const route = params.get("rest_route");
  if (!route) return new Response(null, { status: 308, headers: { Location: "/magazin/" } });
  params.delete("rest_route");
  return wpRestResponse(handleWpRest(route, params, market), request.method);
}

export const HEAD = GET;

export function OPTIONS() {
  return wpRestPreflight();
}
