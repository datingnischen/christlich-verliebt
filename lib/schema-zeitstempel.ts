/**
 * Vorlage: Zeitstempel für strukturierte Daten (JSON-LD).
 *
 * Google wertet `dateModified`, `dateCreated` und `datePublished` als
 * schema.org/DateTime. Ein reiner Tag ("2026-11-07") löst in der Search
 * Console "Ungültiger Datum/Uhrzeit-Wert" aus (gemeldet am 17. November 2026
 * für datingformate.de, Profilseiten). Liegt in den Daten nur ein Tag, wird
 * die Uhrzeit deterministisch aus Tag und Slug abgeleitet: stabil über Builds,
 * gestreut zwischen 8 und 21 Uhr, nie rund und nicht für alle Seiten dieselbe
 * Sekunde (Regel „Keine erkennbar automatischen Zeitstempel").
 */

const BERLIN = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const pad = (n: number) => String(n).padStart(2, "0");

/** Offset von Europe/Berlin zu einem Zeitpunkt, in Minuten. */
function berlinOffsetMinuten(zeitpunkt: number): number {
  const teil = Object.fromEntries(BERLIN.formatToParts(new Date(zeitpunkt)).map((p) => [p.type, p.value]));
  const wand = Date.UTC(+teil.year, +teil.month - 1, +teil.day, +teil.hour, +teil.minute, +teil.second);
  return Math.round((wand - zeitpunkt) / 60000);
}

/** Uhrzeit aus Tag und Slug: 8–21 Uhr, nie rund, je Seite verschieden, aber stabil. */
function abgeleiteteUhrzeit(tag: string, seed: string): string {
  let h = 2166136261;
  for (const zeichen of `${tag}:${seed}`) {
    h = Math.imul(h ^ zeichen.charCodeAt(0), 16777619) >>> 0;
  }
  const minute = 1 + ((h >>> 5) % 58);
  return `${pad(8 + (h % 14))}:${pad(minute === 30 ? 31 : minute)}:${pad(1 + ((h >>> 13) % 58))}`;
}

/**
 * Macht aus einem gepflegten Datum einen vollständigen DateTime-Wert mit
 * Zeitzone. Werte, die schon eine Zone tragen, bleiben unverändert.
 */
export function schemaZeitstempel(wert: string | null | undefined, seed: string): string | undefined {
  if (!wert) return undefined;
  const text = wert.trim();
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) return text;
  const treffer = text.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/);
  if (!treffer) return undefined;
  const [, tag, stunde, minute, sekunde] = treffer;
  const zeit = stunde ? `${stunde}:${minute}:${sekunde ?? "00"}` : abgeleiteteUhrzeit(tag, seed);
  const naiv = Date.parse(`${tag}T${zeit}Z`);
  if (Number.isNaN(naiv)) return undefined;
  const offset = berlinOffsetMinuten(naiv - berlinOffsetMinuten(naiv) * 60000);
  const vorzeichen = offset < 0 ? "-" : "+";
  const betrag = Math.abs(offset);
  return `${tag}T${zeit}${vorzeichen}${pad(Math.floor(betrag / 60))}:${pad(betrag % 60)}`;
}
