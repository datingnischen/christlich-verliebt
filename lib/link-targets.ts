// Gleicher Linktext soll in allen Artikeln auf dasselbe Ziel zeigen (Seobility „identische Linktexte, unterschiedliche
// Ziele“, Crawl 16.10.2026), tote Ziele werden nicht verlinkt. Sichtbarer Text bleibt immer erhalten.

const OWN_ORIGIN = /^https?:\/\/(?:www\.)?christlich-verliebt\.(?:de|at|ch)/i;
const TEXT_ANCHOR = /<a\b([^>]*?)\bhref="([^"]*)"([^>]*)>([^<]+)<\/a>/gi;
const SITE = "https://christlich-verliebt.de";

// Schlagwort-Archive gibt es nach dem WordPress-Abschied nicht mehr (404).
const DEAD = /^\/magazin\/tag\//;
// Entfernte Artikel und ihr Ersatz.
const MOVED: Record<string, string> = {
  "/magazin/karwoche-geschichte-hintergruende-und-brauchtum": "/magazin/karwoche",
};
// Themenwörter mit festem Ziel.
const PREFERRED: Record<string, string> = {
  ostern: "/magazin/ostern",
  symbole: "/magazin/christliche-symbole",
};

const keyOf = (text: string) => text.replace(/&nbsp;| /g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().toLowerCase();

function internalPath(href: string): string | null {
  const local = OWN_ORIGIN.test(href) ? href.replace(OWN_ORIGIN, "") || "/" : href;
  if (!local.startsWith("/") || local.startsWith("//")) return null;
  const path = local.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (/\.[a-z0-9]{2,4}$/i.test(path)) return null;
  return MOVED[path] ?? path;
}

const slugOf = (text: string) =>
  text.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Themenwörter und verschobene Artikel werden umgeleitet, tote Ziele entlinkt; sonst bleibt das häufigste Ziel verlinkt. */
export function withUniqueLinkTargets<T extends { contentHtml: string }>(entries: T[]): T[] {
  const counts = new Map<string, Map<string, number>>();
  for (const entry of entries) {
    for (const match of entry.contentHtml.matchAll(TEXT_ANCHOR)) {
      const path = internalPath(match[2]);
      const key = keyOf(match[4]);
      if (!path || !key || DEAD.test(path)) continue;
      const targets = counts.get(key) ?? new Map<string, number>();
      targets.set(path, (targets.get(path) ?? 0) + 1);
      counts.set(key, targets);
    }
  }
  const canonical = new Map<string, string>();
  for (const [key, targets] of counts) {
    if (PREFERRED[key]) canonical.set(key, PREFERRED[key]);
    else if (targets.size > 1) {
      const slug = slugOf(key);
      const [best] = [...targets].sort((a, b) => b[1] - a[1] || Number(b[0].endsWith(`/${slug}`)) - Number(a[0].endsWith(`/${slug}`)) || a[0].localeCompare(b[0]));
      canonical.set(key, best[0]);
    }
  }
  const href = (path: string) => (path === "/" ? `${SITE}/` : `${SITE}${path}/`);
  return entries.map((entry) => ({
    ...entry,
    contentHtml: entry.contentHtml.replace(TEXT_ANCHOR, (match, before: string, rawHref: string, after: string, text: string) => {
      const path = internalPath(rawHref);
      if (!path) return match;
      if (DEAD.test(path)) return text;
      const key = keyOf(text);
      const target = canonical.get(key);
      if (target && path !== target) return PREFERRED[key] ? `<a${before}href="${href(target)}"${after}>${text}</a>` : text;
      // Verschobener Artikel: direkt auf den Ersatz verlinken.
      return MOVED[rawHref.replace(OWN_ORIGIN, "").split(/[?#]/)[0].replace(/\/+$/, "")] ? `<a${before}href="${href(path)}"${after}>${text}</a>` : match;
    }),
  }));
}
