import { brandSameAs } from "@/lib/about";
import { buildSiteGraph, safeJsonLd, type SiteGraphPage } from "@/lib/site-entities";

/** Site-Graph (ICONY als Betreiber, Marke mit eigenen Profilen, Website) je Länderdomain, optional mit Seitenknoten. */
export function SiteJsonLd({ siteRoot, page, extraNodes }: { siteRoot: string; page?: SiteGraphPage; extraNodes?: Record<string, unknown>[] }) {
  const graph = buildSiteGraph({ siteRoot, sameAs: brandSameAs(), page, extraNodes });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }} />;
}
