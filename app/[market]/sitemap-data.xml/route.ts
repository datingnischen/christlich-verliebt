import { notFound } from "next/navigation";
import { getPages } from "@/lib/content";
import { isMarketCode } from "@/lib/markets";

export function generateStaticParams() { return [{ market: "de" }, { market: "at" }, { market: "ch" }]; }

export async function GET(_: Request, { params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (!isMarketCode(market)) notFound();
  const urls = getPages(market).map(page => `<url><loc>${page.canonical}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
