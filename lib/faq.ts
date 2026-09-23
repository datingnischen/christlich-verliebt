import type { PublicPage } from "./content";

export type FaqItem = { id: string; question: string; answerHtml: string; answerText: string };
export type FaqGroup = { id: string; title: string; lead: string | null; items: FaqItem[] };
export type FaqContent = { intro: string | null; groups: FaqGroup[]; count: number };

export function isFaqPage(page: Pick<PublicPage, "path">): boolean {
  return page.path === "/faq/";
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function plainText(html: string): string {
  return decodeEntities(html.replace(/<\/(p|li|ul|ol)>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base || "frage";
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
}

function cleanAnswer(html: string): string {
  return html
    .replace(/\s*\}\s*(?=<\/p>)/g, "")
    .replace(/(?:&nbsp;|\s)*\|(?:&nbsp;|\s)*/g, " · ")
    .replace(/<p>\s*<\/p>/g, "")
    .trim();
}

/** Zerlegt die importierte FAQ (h2 = Thema, strong + div = Frage/Antwort) in strukturierte Gruppen. */
export function parseFaq(contentHtml: string): FaqContent | null {
  const token = /<h2\b[^>]*>([\s\S]*?)<\/h2>\s*(?:<p>([\s\S]*?)<\/p>)?|<strong>([^<]+)<\/strong>\s*<div>([\s\S]*?)<\/div>/gi;
  const groups: FaqGroup[] = [];
  const groupIds = new Set<string>();
  const itemIds = new Set<string>();
  let firstTokenAt = -1;
  for (const match of contentHtml.matchAll(token)) {
    if (firstTokenAt < 0) firstTokenAt = match.index ?? 0;
    if (match[1] !== undefined) {
      const title = plainText(match[1]);
      groups.push({ id: uniqueId(`thema-${slugify(title)}`, groupIds), title, lead: match[2] ? plainText(match[2]) : null, items: [] });
      continue;
    }
    const question = plainText(match[3]);
    const answerHtml = cleanAnswer(match[4]);
    if (!groups.length) groups.push({ id: uniqueId("thema-allgemeines", groupIds), title: "Allgemeines", lead: null, items: [] });
    // Reine Linkzeilen („Mehr dazu in der Hilfe“) tragen im strukturierten Antworttext keine Information.
    const answerText = plainText(answerHtml.replace(/<p>(?:\s|·|<a\b[^>]*>[^<]*<\/a>)*<\/p>/g, "")) || plainText(answerHtml);
    groups[groups.length - 1].items.push({ id: uniqueId(slugify(question), itemIds), question, answerHtml, answerText });
  }
  const filled = groups.filter(group => group.items.length);
  const count = filled.reduce((sum, group) => sum + group.items.length, 0);
  if (count < 3) return null;
  const introParagraphs = [...contentHtml.slice(0, Math.max(firstTokenAt, 0)).matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => plainText(match[1])).filter(Boolean);
  return { intro: introParagraphs.join(" ") || null, groups: filled, count };
}

export function faqTitle(page: Pick<PublicPage, "domain">): string {
  return `FAQ ${page.domain}: Kosten, Sicherheit & Ablauf erklärt`;
}

export function faqDescription(page: Pick<PublicPage, "domain">, faq: FaqContent): string {
  return `${faq.count} Antworten zur christlichen Partnersuche bei ${page.domain}: Anmeldung, Kosten, Premium, Profilprüfung, Fake-Profile, Datenschutz & Kündigung.`;
}

export function faqJsonLd(page: Pick<PublicPage, "canonical" | "domain" | "locale" | "heroTitle">, faq: FaqContent, title: string, description: string) {
  const home = `https://${page.domain}/`;
  const canonical = page.canonical;
  const organizationId = `${home}#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "ICONY GmbH",
        url: `${home}impressum.html`,
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        url: home,
        name: page.domain,
        inLanguage: page.locale,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: home },
          { "@type": "ListItem", position: 2, name: "FAQ", item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        url: canonical,
        name: title,
        headline: page.heroTitle,
        description,
        inLanguage: page.locale,
        isPartOf: { "@id": `${home}#website` },
        publisher: { "@id": organizationId },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
        about: { "@type": "Thing", name: "Christliche Partnersuche" },
        mainEntity: faq.groups.flatMap(group => group.items.map(item => ({
          "@type": "Question",
          "@id": `${canonical}#${item.id}`,
          name: item.question,
          url: `${canonical}#${item.id}`,
          acceptedAnswer: { "@type": "Answer", text: item.answerText, url: `${canonical}#${item.id}` },
        }))),
      },
    ],
  };
}
