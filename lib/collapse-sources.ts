// Quellenabschnitte im Magazin: klein, standardmäßig zugeklappt und als
// eigener Block ans Ende des Beitrags. Inhalte und Links bleiben vollständig.
// Referenz: fitness-liebe lib/collapse-sources.ts (erweitert um h4 und
// Absatz-Labels wie „<p><strong>Quellen:</strong> …</p>“).

const SOURCE_HEADING = /<h([234])\b[^>]*>((?:(?!<\/h\1>)[\s\S])*?Quell(?:en|e)\b(?:(?!<\/h\1>)[\s\S])*?)<\/h\1>/gi;
// „Stand, Quellen & Transparenz“, „Genutzte Quellen“, „📚 Quellen“, „Quelle“ …
const SOURCE_TITLE = /^(?:[^\p{L}\p{N}]+)?(?:Stand,\s*)?(?:Genutzte\s+|Verwendete\s+|Weitere\s+)?Quellen?[^?]*$/iu;
// Absatz-Label nur im Plural („Quellen:“, „📚Quellen & Datenstand:“), damit
// einzelne Bild- oder Grafiknachweise („Quelle: Statista“) an ihrem Platz bleiben.
// Auch kursiv umschlossen: „<p><em><strong>Quellen:</strong></em></p>“.
const SOURCE_PARAGRAPH = /<p\b[^>]*>\s*(?:<(?:em|i)\b[^>]*>\s*)?<(strong|b)\b[^>]*>((?:(?!<\/\1>)[\s\S])*?Quellen\b(?:(?!<\/\1>)[\s\S])*?)<\/\1>\s*:?\s*(?:<\/(?:em|i)>\s*)?((?:(?!<\/p>)[\s\S])*?)<\/p>(\s*<(ul|ol)\b[\s\S]*?<\/\5>)?/gi;
const PARAGRAPH_TITLE = /^(?:[^\p{L}\p{N}]+)?(?:Stand,\s*)?(?:Genutzte\s+|Verwendete\s+|Weitere\s+)?Quellen\b[^?]*$/iu;

function headingText(inner: string) {
  return inner
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|#038);/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionEnd(html: string, from: number, level: string) {
  // Ein h2-Abschnitt endet am nächsten h2 bzw. an einer eingebauten Sektion
  // (FAQ-Karte), ein h3-/h4-Abschnitt schon an der nächsten gleich hohen
  // oder höheren Überschrift.
  const stop = level === "2" ? /<h2\b|<section\b/gi : level === "3" ? /<h[23]\b|<section\b/gi : /<h[234]\b|<section\b/gi;
  stop.lastIndex = from;
  const match = stop.exec(html);
  return match ? match.index : html.length;
}

type Found = { start: number; end: number; body: string };

function findHeadingSection(html: string): Found | null {
  SOURCE_HEADING.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SOURCE_HEADING.exec(html))) {
    const text = headingText(match[2]).replace(/:$/, "");
    // Ratgeberfragen wie „Welche Quellen sollte ich prüfen?“ sind Inhalt.
    if (!SOURCE_TITLE.test(text)) continue;
    const bodyStart = match.index + match[0].length;
    const end = sectionEnd(html, bodyStart, match[1]);
    const body = html.slice(bodyStart, end).trim();
    // Der h2-Titel selbst entfällt, die Summary ersetzt ihn; Unterüberschriften
    // wie „Genutzte Quellen“ bleiben als Zwischentitel erhalten.
    return {
      start: match.index,
      end,
      body: match[1] === "2" ? body : `<p class="magazine-sources__label">${match[2].trim()}</p>${body}`,
    };
  }
  return null;
}

function findParagraphSection(html: string): Found | null {
  SOURCE_PARAGRAPH.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SOURCE_PARAGRAPH.exec(html))) {
    const label = headingText(match[2]).replace(/:$/, "");
    if (!PARAGRAPH_TITLE.test(label)) continue;
    const rest = match[3].replace(/^(?:\s|<br\s*\/?>)+/i, "").replace(/^((?:(?!<(?:em|i)\b)[\s\S])*)<\/(?:em|i)>\s*$/i, "$1").trim();
    const body = [
      `<p class="magazine-sources__label">${match[2].trim().replace(/:$/, "")}</p>`,
      rest ? `<p>${rest}</p>` : "",
      match[4] ? match[4].trim() : "",
    ].filter(Boolean).join("\n");
    return { start: match.index, end: match.index + match[0].length, body };
  }
  return null;
}

export function collapseSourceSections(html: string, summaryLabel = "Quellen & Transparenz") {
  if (!html || html.includes('class="magazine-sources"')) return html;

  const parts: string[] = [];
  let rest = html;
  for (let guard = 0; guard < 10; guard += 1) {
    const found = findHeadingSection(rest) ?? findParagraphSection(rest);
    if (!found) break;
    parts.push(found.body);
    rest = `${rest.slice(0, found.start)}${rest.slice(found.end)}`;
  }

  if (!parts.length) return html;

  const body = parts.join("\n").replace(/<h[34]\b[^>]*>([\s\S]*?)<\/h[34]>/gi, '<p class="magazine-sources__label">$1</p>');
  return `${rest.trimEnd()}\n<details class="magazine-sources">\n<summary>${summaryLabel}</summary>\n<div class="magazine-sources__body">\n${body}\n</div>\n</details>\n`;
}
