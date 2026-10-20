import data from "../data/it-ticino.json" with { type: "json" };

/**
 * Italienischer Pilot christlich-verliebt.ch/it/ für das Tessin (wie tierisch-verliebt.ch/it/).
 * Gleiche Schweizer ICONY-Plattform und Mitglieder; ICONY bleibt bewusst bei der Schweiz.
 */
export type ItSection = { heading: string; icon: "church" | "people" | "tree" | "cup" | "heart" | "calendar" | "phone"; html: string };
export type ItCity = (typeof data.cities)[number] & { sections: ItSection[] };

/** Erst indexieren, wenn ICONY die italienische Registrierung ausliefert. Bis dahin noindex und nicht in der Sitemap. */
export const IT_PILOT_INDEXABLE = false;

/**
 * Registrierung, Login und Suche bleiben auf der deutschsprachigen Schweizer Plattform, bis ICONY die
 * italienische Oberfläche liefert; dann nur diese Adressen umstellen.
 */
export const IT_PLATFORM = {
  registrationUrl: "https://christlich-verliebt.ch/registration/?AID=location",
  loginUrl: "https://christlich-verliebt.ch/login/",
  searchUrl: "https://christlich-verliebt.ch/suche/?AID=location",
} as const;

export const IT_HOME = data.home as typeof data.home & { sections: ItSection[] };
export const IT_CITIES = data.cities as ItCity[];

export function getItCity(slug: string): ItCity | null {
  return IT_CITIES.find((city) => city.slug === slug) ?? null;
}

/**
 * Eigene Domain der italienischen Variante (registriert 2026-10-20, DNS auf Vercel). Sie liefert die Seiten
 * direkt aus (proxy.ts), christlich-verliebt.ch/it/ leitet dorthin um. Vorschau bleibt /ch/it/ auf Vercel.
 */
export const IT_HOST = "single-cristiani.ch";
export const IT_ORIGIN = `https://${IT_HOST}`;

/** Rechtstexte der eigenen Domain (Betreiber Christian Mogge, nicht ICONY). */
export const IT_LEGAL_PAGES = ["note-legali", "privacy"] as const;

/** Live-URL auf single-cristiani.ch, Seitenpfade mit Schrägstrich. */
export function itPublicUrl(slug = ""): string {
  return `${IT_ORIGIN}/${slug ? `${slug}/` : ""}`;
}

/** ICONY-Profilfenster der Schweizer Plattform für eine Tessiner Postleitzahl (Format wie data/city-widgets.json). */
export function itWidgetUrl(postcode: string): string {
  return `https://js.icony.com/frame/?h=300&id=christlichverliebtch&pc=CE302F&z=${postcode}&ds=&ctr=41&it=1`;
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

export function nearestItCities(slug: string, count = 4) {
  const origin = getItCity(slug);
  if (!origin) return [];
  return IT_CITIES.filter((city) => city.slug !== slug)
    .map((city) => ({ city, km: distanceKm(origin.geo, city.geo) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count);
}
