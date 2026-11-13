/**
 * Natürliche Uhrzeit für Beiträge, die nur ein Tagesdatum haben (z. B. `updated: "2026-09-28"`).
 *
 * Statt `T00:00:00` entsteht eine feste, unregelmäßige Tageszeit zwischen 7 und 22 Uhr, abgeleitet aus dem Slug:
 * Jeder Aufruf liefert für denselben Beitrag dieselbe Zeit, verschiedene Beiträge bekommen verschiedene Zeiten
 * (Christian, 2026-11-13: nach außen nie der Eindruck automatischer Erzeugung). Ergebnis ist Berliner Ortszeit
 * ohne Zone, wie die WordPress-Felder `date`/`modified`.
 */
const HOUR_WEIGHTS: Array<[number, number]> = [
  [7, 2], [8, 5], [9, 8], [10, 10], [11, 9], [12, 6], [13, 6], [14, 8],
  [15, 9], [16, 8], [17, 7], [18, 6], [19, 7], [20, 8], [21, 6], [22, 3],
];
const HOURS = HOUR_WEIGHTS.flatMap(([hour, weight]) => Array<number>(weight).fill(hour));

function hash(text: string): number {
  // FNV-1a (32 Bit), danach durchmischt
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** `YYYY-MM-DD` → `YYYY-MM-DDTHH:MM:SS` mit slug-abhängiger, nicht runder Uhrzeit. Volle Zeitstempel bleiben unverändert. */
export function naturalTimestamp(key: string, day: string, kind = "date"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const x = hash(`${key}|${kind}`);
  let hour = HOURS[x % HOURS.length];
  // Beitrag von heute: Uhrzeit nicht in die Zukunft legen
  const now = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).format(new Date());
  if (now.slice(0, 10) === day) hour = Math.max(0, Math.min(hour, Number(now.slice(11, 13)) - 1));
  let minute = Math.floor(x / HOURS.length) % 60;
  const second = 1 + (Math.floor(x / (HOURS.length * 60)) % 59);
  if ((minute === 0 || minute === 30) && second < 10) minute += 3;
  return `${day}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
}
