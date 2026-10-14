// schema.org-Graph der Website: ICONY GmbH als Betreiber, die Marke christlich-verliebt mit ihren eigenen Profilen
// (sameAs aus SOCIAL_CHANNELS in lib/about.ts) und die Website je Länderdomain. Magazinbeiträge verweisen per @id darauf.
// Reine Funktionen ohne @/-Importe, damit tests/site-entities.test.mjs sie direkt laden kann.

export const BRAND_NAME = "christlich-verliebt";

export const PLATFORM_OPERATOR = {
  name: "ICONY GmbH",
  url: "https://www.icony.com",
} as const;

// Autorenprofil gibt es nur auf .de (app/[market]/magazin/christian-m-haas); dieselbe @id wie dort und in lib/videos.ts.
export const AUTHOR_PROFILE_URL = "https://christlich-verliebt.de/magazin/christian-m-haas/";
export const AUTHOR = {
  name: "Christian M. Haas",
  jobTitle: "Datingexperte & Autor",
  profileUrl: AUTHOR_PROFILE_URL,
  personId: `${AUTHOR_PROFILE_URL}#person`,
} as const;

export type Crumb = { name: string; url: string };

export type SiteGraphPage = {
  type: "WebPage" | "AboutPage" | "CollectionPage";
  url: string;
  name: string;
  description: string;
  /** Sichtbarer bzw. logischer Pfad ab der Startseite, letzter Eintrag = diese Seite. */
  breadcrumb?: Crumb[];
  /** @id einer Person/Sache, die auf der Seite vorkommt und im selben Graphen steht (extraNodes). */
  mentions?: string;
};

/** `siteRoot` ist die absolute Startseiten-URL mit Schrägstrich, z. B. https://christlich-verliebt.de/ */
export function siteEntityIds(siteRoot: string) {
  return {
    website: `${siteRoot}#website`,
    brand: `${siteRoot}#brand`,
    operator: `${siteRoot}#operator`,
  };
}

/** Sprache nach Länderdomain (de-DE, de-AT, de-CH). */
export function siteLanguage(siteRoot: string) {
  const tld = new URL(siteRoot).hostname.split(".").pop();
  return tld === "at" ? "de-AT" : tld === "ch" ? "de-CH" : "de-DE";
}

export function websiteNode(siteRoot: string) {
  const ids = siteEntityIds(siteRoot);
  return {
    "@type": "WebSite",
    "@id": ids.website,
    url: siteRoot,
    name: new URL(siteRoot).hostname,
    alternateName: BRAND_NAME,
    inLanguage: siteLanguage(siteRoot),
    publisher: { "@id": ids.operator },
    about: { "@id": ids.brand },
  };
}

export function operatorNode(siteRoot: string) {
  return {
    "@type": "Organization",
    "@id": siteEntityIds(siteRoot).operator,
    name: PLATFORM_OPERATOR.name,
    url: PLATFORM_OPERATOR.url,
  };
}

export function brandNode(siteRoot: string, sameAs: string[]) {
  return {
    "@type": "Brand",
    "@id": siteEntityIds(siteRoot).brand,
    name: BRAND_NAME,
    url: siteRoot,
    sameAs,
  };
}

export function breadcrumbNode(id: string, trail: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Betreiber, Marke (mit eigenen offiziellen Profilen als `sameAs`) und Website, optional plus aktuelle Seite. */
export function buildSiteGraph({ siteRoot, sameAs, page, extraNodes = [] }: { siteRoot: string; sameAs: string[]; page?: SiteGraphPage; extraNodes?: Record<string, unknown>[] }) {
  const ids = siteEntityIds(siteRoot);
  const graph: Record<string, unknown>[] = [operatorNode(siteRoot), brandNode(siteRoot, sameAs), websiteNode(siteRoot)];

  if (page) {
    const breadcrumbId = `${page.url}#breadcrumb`;
    graph.push({
      "@type": page.type,
      "@id": `${page.url}#webpage`,
      url: page.url,
      name: page.name,
      description: page.description,
      inLanguage: siteLanguage(siteRoot),
      isPartOf: { "@id": ids.website },
      about: { "@id": ids.brand },
      ...(page.breadcrumb?.length ? { breadcrumb: { "@id": breadcrumbId } } : {}),
      ...(page.mentions ? { mentions: { "@id": page.mentions } } : {}),
    });
    if (page.breadcrumb?.length) graph.push(breadcrumbNode(breadcrumbId, page.breadcrumb));
  }

  graph.push(...extraNodes);
  return { "@context": "https://schema.org", "@graph": graph };
}

const BERLIN_CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Berlin",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** WordPress-Daten und `updated` kommen ohne Zone; das Magazin wird in Berlin gepflegt. */
export function withBerlinOffset(date?: string | null) {
  if (!date) return undefined;
  if (/(Z|[+-]\d{2}:\d{2})$/.test(date)) return date;
  const local = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date;
  const wallAsUtc = Date.parse(`${local}Z`);
  if (Number.isNaN(wallAsUtc)) return undefined;
  const part = Object.fromEntries(BERLIN_CLOCK.formatToParts(new Date(wallAsUtc)).map((p) => [p.type, Number(p.value)]));
  const berlinWall = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second);
  const offsetMinutes = Math.round((berlinWall - wallAsUtc) / 60000);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  return `${local}${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export type MagazineArticleGraphInput = {
  siteRoot: string;
  /** Eigene Profile der Marke (brandSameAs()), damit WebSite.about nicht ins Leere zeigt. */
  sameAs: string[];
  /** Magazinseiten ohne Beitragsdatum (Werkzeug-/CMS-Seiten) bekommen nur Seite und Breadcrumb, kein BlogPosting. */
  kind?: "post" | "page";
  magazineName: string;
  magazineUrl: string;
  url: string;
  headline: string;
  description: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorImage?: string;
};

/** BlogPosting (Beiträge) bzw. WebPage (CMS-Seiten) mit Breadcrumb, Autor Christian M. Haas, Website, Marke und Betreiber. */
export function buildMagazineArticleGraph(input: MagazineArticleGraphInput) {
  const ids = siteEntityIds(input.siteRoot);
  const pageId = `${input.url}#webpage`;
  const breadcrumbId = `${input.url}#breadcrumb`;
  const isPost = (input.kind ?? "post") === "post";
  const trail: Crumb[] = [
    { name: "Startseite", url: input.siteRoot },
    { name: input.magazineName, url: input.magazineUrl },
    { name: input.headline, url: input.url },
  ];

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": pageId,
      url: input.url,
      name: input.headline,
      description: input.description,
      inLanguage: siteLanguage(input.siteRoot),
      isPartOf: { "@id": ids.website },
      breadcrumb: { "@id": breadcrumbId },
      ...(input.image ? { primaryImageOfPage: { "@type": "ImageObject", url: input.image } } : {}),
    },
    breadcrumbNode(breadcrumbId, trail),
  ];

  if (isPost) {
    const published = withBerlinOffset(input.datePublished);
    const modified = withBerlinOffset(input.dateModified ?? input.datePublished);
    graph.push({
      "@type": "BlogPosting",
      "@id": `${input.url}#article`,
      headline: input.headline,
      description: input.description,
      url: input.url,
      mainEntityOfPage: { "@id": pageId },
      isPartOf: { "@id": ids.website },
      inLanguage: siteLanguage(input.siteRoot),
      ...(input.image ? { image: [input.image] } : {}),
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      author: {
        "@type": "Person",
        "@id": AUTHOR.personId,
        name: AUTHOR.name,
        url: AUTHOR.profileUrl,
        jobTitle: AUTHOR.jobTitle,
        ...(input.authorImage ? { image: input.authorImage } : {}),
      },
      publisher: { "@id": ids.operator },
    });
  }

  graph.push(websiteNode(input.siteRoot), brandNode(input.siteRoot, input.sameAs), operatorNode(input.siteRoot));
  return { "@context": "https://schema.org", "@graph": graph };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}
