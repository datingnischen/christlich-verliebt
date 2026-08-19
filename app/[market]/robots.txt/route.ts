import { notFound } from "next/navigation";
import { getMarket, isMarketCode } from "@/lib/markets";

export function generateStaticParams() { return [{ market: "de" }, { market: "at" }, { market: "ch" }]; }

export async function GET(_: Request, { params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (!isMarketCode(market)) notFound();
  const domain = getMarket(market).domain;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
