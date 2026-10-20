import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItCityPage, ItHomePage, ItShell } from "@/components/it-pages";
import { IT_LEGAL, ItLegalPage, type ItLegalSlug } from "@/components/it-legal";
import { IT_CITIES, IT_HOME, IT_LEGAL_PAGES, IT_PILOT_INDEXABLE, getItCity, itPublicUrl } from "@/lib/it-pilot";
import { publicUrl } from "@/lib/markets";
import { safeJsonLd } from "@/lib/site-entities";
import { staticAsset } from "@/lib/static-asset";

type Props = { params: Promise<{ market: string; slug?: string[] }> };

// Italienische Variante nur auf christlich-verliebt.ch (Vorschau /ch/it/…, live über nginx ebenfalls /ch/it/…).
export function generateStaticParams() {
  return [{ market: "ch", slug: undefined }, ...IT_CITIES.map((city) => ({ market: "ch", slug: [city.slug] })), ...IT_LEGAL_PAGES.map((slug) => ({ market: "ch", slug: [slug] }))];
}
export const dynamicParams = false;

async function resolve(params: Props["params"]) {
  const { market, slug = [] } = await params;
  if (market !== "ch" || slug.length > 1) notFound();
  if (!slug.length) return { kind: "home" as const, url: itPublicUrl(), metaTitle: IT_HOME.metaTitle, title: IT_HOME.title, description: IT_HOME.description };
  if ((IT_LEGAL_PAGES as readonly string[]).includes(slug[0])) {
    const legal = slug[0] as ItLegalSlug;
    return { kind: "legal" as const, url: itPublicUrl(legal), metaTitle: IT_LEGAL[legal].metaTitle, title: IT_LEGAL[legal].title, description: IT_LEGAL[legal].description, legal };
  }
  const city = getItCity(slug[0]);
  if (!city) notFound();
  return { kind: "city" as const, url: itPublicUrl(city.slug), metaTitle: city.metaTitle, title: city.title, description: city.description, city };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolve(params);
  const image = page.kind === "city" ? page.city : IT_HOME;
  return {
    title: { absolute: page.metaTitle },
    description: page.description,
    alternates: { canonical: page.url, languages: page.kind === "home" ? { "it-CH": page.url, "de-CH": publicUrl("ch") } : undefined },
    // Pilot: erst indexieren, wenn ICONY die italienische Registrierung ausliefert (lib/it-pilot.ts).
    robots: { index: IT_PILOT_INDEXABLE && page.kind !== "legal", follow: true },
    openGraph: { title: page.title, description: page.description, url: page.url, locale: "it_CH", type: "website", siteName: "single-cristiani.ch", images: [{ url: staticAsset(image.heroImage), width: 1600, height: 900, alt: image.heroImageAlt }] },
  };
}

export default async function ItPilot({ params }: Props) {
  const page = await resolve(params);
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": `${page.url}#webpage`, url: page.url, name: page.title, description: page.description, inLanguage: "it-CH" },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Svizzera italiana", item: itPublicUrl() },
      ...(page.kind === "city" ? [{ "@type": "ListItem", position: 2, name: page.city.name, item: page.url }] : []),
      ...(page.kind === "legal" ? [{ "@type": "ListItem", position: 2, name: page.title, item: page.url }] : []),
    ] },
    ...(page.kind === "home" ? [{ "@type": "FAQPage", "@id": `${page.url}#faq`, inLanguage: "it-CH", mainEntity: IT_HOME.faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })) }] : []),
  ] };
  return <ItShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }} />
    {page.kind === "home" ? <ItHomePage /> : page.kind === "legal" ? <ItLegalPage slug={page.legal} /> : <ItCityPage city={page.city} />}
  </ItShell>;
}
