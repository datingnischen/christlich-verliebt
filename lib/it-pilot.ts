import data from "../data/it-ticino.json" with { type: "json" };

/**
 * Italienischer Pilot christlich-verliebt.ch/it/ für das Tessin (wie tierisch-verliebt.ch/it/).
 * Gleiche Schweizer ICONY-Plattform und Mitglieder; ICONY bleibt bewusst bei der Schweiz.
 */
export type ItSection = { heading: string; icon: "church" | "people" | "tree" | "cup" | "heart" | "calendar" | "phone"; html: string };
/** Belegte Kennzahl; `source` verweist auf einen Eintrag in `sources`. */
export type ItFact = { label: string; value: string; note: string; source: string };
export type ItPlace = { name: string; denomination: string; address: string; text: string; url: string };
export type ItCommunity = { name: string; text: string; url: string };
export type ItEvent = { name: string; when: string; text: string };
export type ItSpot = { name: string; where: string; text: string };
export type ItFaq = { question: string; answer: string };
export type ItSource = { title: string; url: string };
/** Stadtführer mit belegten Angaben (Kirchen, Termine, Treffpunkte, Bahn); Quellen erscheinen eingeklappt am Seitenende. */
export type ItGuide = {
  facts: ItFact[];
  places: ItPlace[];
  communities: ItCommunity[];
  events: ItEvent[];
  dateSpots: ItSpot[];
  faq: ItFaq[];
  sources: ItSource[];
};
export type ItCity = Omit<(typeof data.cities)[number], "sections" | "guide"> & { sections: ItSection[]; guide: ItGuide };

/**
 * Indexierbar seit 2026-10-20 (Christians Entscheidung): Die Ratgeberseiten stehen für sich, die Registrierung
 * läuft bis zur italienischen ICONY-Oberfläche auf Deutsch (Hinweis über IT_PLATFORM_ITALIAN). false = noindex + keine Sitemap.
 */
export const IT_PILOT_INDEXABLE = true;

/**
 * Liefert ICONY Registrierung und Profile auf Italienisch? Solange false, zeigt jede Seite den Hinweis, dass die
 * Plattform auf Italienisch im Aufbau und auf Deutsch auf christlich-verliebt.ch verfügbar ist. Mit der
 * italienischen Oberfläche auf true setzen und die Adressen in IT_PLATFORM umstellen.
 */
export const IT_PLATFORM_ITALIAN = false;

/**
 * Registrierung, Login und Suche bleiben auf der deutschsprachigen Schweizer Plattform, bis ICONY die
 * italienische Oberfläche liefert; dann nur diese Adressen umstellen.
 */
export const IT_PLATFORM = {
  registrationUrl: "https://christlich-verliebt.ch/registration/?AID=location",
  loginUrl: "https://christlich-verliebt.ch/login/",
  searchUrl: "https://christlich-verliebt.ch/suche/?AID=location",
} as const;

export const IT_HOME = data.home as unknown as Omit<typeof data.home, "sections" | "guide" | "faq"> & { sections: ItSection[]; guide: ItGuide };
export const IT_CITIES = data.cities as unknown as ItCity[];

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

/** Chi siamo: Redaktions- und Autorenseite (indexierbar, in Sitemap und llms.txt); Inhalt in components/it-about.tsx. */
export const IT_ABOUT_SLUG = "chi-siamo";
export const IT_ABOUT = {
  metaTitle: "Chi siamo: la redazione di single-cristiani.ch",
  title: "Chi siamo",
  description: "Chi c'è dietro single-cristiani.ch: chi cura le guide per il Ticino, come verifichiamo fonti e dati, il rapporto con christlich-verliebt.ch e i contatti.",
  lead: "single-cristiani.ch è una guida in italiano per chi, nella Svizzera italiana, cerca una relazione fondata sulla fede. Qui spieghiamo chi la cura, come lavoriamo e che rapporto abbiamo con la piattaforma christlich-verliebt.ch.",
} as const;

/** Herausgeber im JSON-LD: die Marke single-cristiani.ch, ohne Betreibernamen (Christians Vorgabe 2026-10-20); nicht ICONY. */
export const IT_PUBLISHER = {
  name: "single-cristiani.ch",
  logo: "/brand/single-cristiani-ch.svg",
} as const;

/** Autor der Inhalte; dieselbe Person wie auf christlich-verliebt.de/magazin/christian-m-haas/ (erster sameAs-Eintrag). */
export const IT_AUTHOR = {
  name: "Christian M. Haas",
  jobTitle: "Responsabile dei contenuti",
  image: "/brand/christian-m-haas.jpg",
  sameAs: [
    "https://christlich-verliebt.de/magazin/christian-m-haas/",
    "https://www.linkedin.com/in/christian-m-haas-457323379",
    "https://www.amazon.com/author/christian-m-haas",
    "https://datingnischen.de/christian",
  ],
} as const;

/** Italienische Kantonsnamen für die Karten-Tooltips (data/city-map.json ist deutsch beschriftet). */
export const IT_CANTON_NAMES: Record<string, string> = {
  "CH-AG": "Canton Argovia", "CH-AI": "Canton Appenzello Interno", "CH-AR": "Canton Appenzello Esterno", "CH-BE": "Canton Berna",
  "CH-BL": "Canton Basilea Campagna", "CH-BS": "Canton Basilea Città", "CH-FR": "Canton Friburgo", "CH-GE": "Canton Ginevra",
  "CH-GL": "Canton Glarona", "CH-GR": "Canton Grigioni", "CH-JU": "Canton Giura", "CH-LU": "Canton Lucerna", "CH-NE": "Canton Neuchâtel",
  "CH-NW": "Canton Nidvaldo", "CH-OW": "Canton Obvaldo", "CH-SG": "Canton San Gallo", "CH-SH": "Canton Sciaffusa", "CH-SO": "Canton Soletta",
  "CH-SZ": "Canton Svitto", "CH-TG": "Canton Turgovia", "CH-TI": "Canton Ticino", "CH-UR": "Canton Uri", "CH-VD": "Canton Vaud",
  "CH-VS": "Canton Vallese", "CH-ZG": "Canton Zugo", "CH-ZH": "Canton Zurigo",
};

/** Live-URL auf single-cristiani.ch, Seitenpfade mit Schrägstrich. */
export function itPublicUrl(slug = ""): string {
  return `${IT_ORIGIN}/${slug ? `${slug}/` : ""}`;
}

/** Autorenseite (= Chi siamo) und Person-@id für Article/AboutPage im JSON-LD. */
export function itAuthorUrl(): string {
  return itPublicUrl(IT_ABOUT_SLUG);
}
export function itAuthorId(): string {
  return `${itAuthorUrl()}#person`;
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

/** Stadtseiten liegen wie auf christlich-verliebt (/partnersuche/) unter /incontri/<città>/. */
export const IT_CITY_BASE = "incontri";
/** Magazin der italienischen Variante unter /magazine/<articolo>/. */
export const IT_MAGAZINE_BASE = "magazine";

/** Stadtseite (ohne Slug: Übersicht /incontri/). */
export function itCityUrl(slug = ""): string {
  return itPublicUrl(slug ? `${IT_CITY_BASE}/${slug}` : IT_CITY_BASE);
}

/** Magazinartikel (ohne Slug: Übersicht /magazine/). */
export function itMagazineUrl(slug = ""): string {
  return itPublicUrl(slug ? `${IT_MAGAZINE_BASE}/${slug}` : IT_MAGAZINE_BASE);
}
