export type CityQuizHint = { before: string; anchor: string; href: string; after: string };

// Redaktioneller Hinweis auf den „Kassel-Single-Check“ (Verteilerseite kasseler-singles.de) – bewusst nur auf der
// deutschen Kassel-Seite, nicht in der Stadtvorlage für alle Städte.
const HINTS: Record<string, CityQuizHint> = {
  "de:/partnersuche/kassel/": {
    before: "Glaube ist dir wichtig, aber nicht das Einzige, was verbinden soll? Unter ",
    anchor: "Kasseler Singles nach Interessen",
    href: "https://kasseler-singles.de/#quiz",
    after: " findest du mit drei Fragen weitere Nischenbörsen für Kassel.",
  },
};

export function cityQuizHint(market: string, path: string): CityQuizHint | null {
  return HINTS[`${market}:${path}`] ?? null;
}
