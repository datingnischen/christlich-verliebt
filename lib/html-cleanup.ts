// Überschriften ohne Text aus dem Import (z. B. <h3>&nbsp;</h3>) entfernen; Seobility meldet sie als „leere Überschrift“.
export function withoutEmptyHeadings(html: string): string {
  return html.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (match: string, _level: string, inner: string) =>
    inner.replace(/<[^>]+>/g, "").replace(/&nbsp;| |\s/g, "") ? match : "");
}

// Importierte Bilder ohne Alt-Text (alt="" oder gar keins) bekommen den Seitentitel; Seobility zählt leere Alt-Texte als fehlend.
export function withImageAlt(html: string, title: string): string {
  const alt = title.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return html.replace(/<img\b[^>]*>/gi, (tag: string) => (/\balt="[^"]+"/i.test(tag) ? tag : tag.replace(/\salt=""/i, "").replace(/^<img\b/i, `<img alt="${alt}"`)));
}

// Seobility „Strukturproblem“: keine übersprungenen Ebenen (h2 → h4). Die H1 kommt aus der Vorlage, der Inhalt beginnt
// deshalb mit h2. Gleich tiefe Geschwister bleiben gleich tief (h2, h4, h4, h3 → h2, h3, h3, h3).
export function withoutHeadingSkips(html: string, base = 1): string {
  const stack: Array<{ original: number; level: number }> = [];
  let open = 0;
  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/gi, (_match: string, close: string, levelText: string, attrs: string) => {
    // Überschriften verschachteln sich nicht: das schließende Tag gehört zur zuletzt geöffneten.
    if (close) return `</h${open}>`;
    const original = Number(levelText);
    while (stack.length && stack[stack.length - 1].original >= original) stack.pop();
    const parent = stack.length ? stack[stack.length - 1].level : base;
    open = Math.max(2, Math.min(original, parent + 1));
    stack.push({ original, level: open });
    return `<h${open}${attrs}>`;
  });
}

// Seobility „Probleme mit Strong-/Bold-Tags“ (viele, leere, zu lange, doppelte): höchstens `max` Hervorhebungen bleiben
// <strong>; weitere, doppelte und lange werden zu <span class="em-strong"> (gleiche Optik per CSS), leere entfallen.
export function limitStrong(html: string, max = 4): string {
  const seen = new Set<string>();
  let kept = 0;
  // Doppelt verschachtelt (<strong><strong>x</strong></strong>) erst glätten, sonst entsteht ungültiges HTML.
  let flat = html;
  for (let previous: string = ""; previous !== flat; ) {
    previous = flat;
    flat = flat.replace(/<(strong|b)\b([^>]*)>(\s*)<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>(\s*)<\/\1>/gi, "<$1$2>$3$4$5</$1>");
  }
  return flat.replace(/<(strong|b)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match: string, _tag: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&nbsp;|\u00a0/g, " ").replace(/\s+/g, " ").trim();
    // Leer: Tag entfällt, ein enthaltenes Leerzeichen bleibt (sonst kleben die Nachbarwörter zusammen).
    if (!text) return inner.replace(/&nbsp;|\u00a0/g, " ").trim() ? inner : /\s|&nbsp;/.test(inner) ? " " : "";
    const key = text.toLowerCase();
    const keep = kept < max && text.length <= 70 && !seen.has(key);
    seen.add(key);
    if (keep) {
      kept += 1;
      return match;
    }
    return `<span class="em-strong"${attrs.replace(/\sclass="[^"]*"/i, "")}>${inner}</span>`;
  });
}
