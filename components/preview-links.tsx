"use client";

import { useEffect } from "react";
import { isPlatformPath, isPreviewHost, MARKET_CODES, previewHref, type MarketCode } from "@/lib/markets";

const MARKET_URL = new RegExp(`^https://(?:www\\.)?christlich-verliebt\\.(${MARKET_CODES.join("|")})(/[^?#]*)?([?#].*)?$`);
// Italienische Variante: single-cristiani.ch liegt auf der Vorschau unter /ch/it/ (lib/it-pilot.ts).
const ITALIAN_URL = /^https:\/\/(?:www\.)?single-cristiani\.ch(\/[^?#]*)?([?#].*)?$/;

/**
 * Im HTML stehen interne Links absolut auf der Live-Domain (christlich-verliebt.de/at/ch ohne Länderpräfix),
 * weil nginx die Seiten unter dem Upstream-Pfad /de/…, /at/…, /ch/… holt. Auf Vorschau-Hosts (localhost,
 * *.vercel.app) würde jeder Klick die Vorschau verlassen – darum zeigen die Links dort nach dem Laden auf den
 * Vercel-Pfad mit Präfix. ICONY-Plattformseiten (Login, Registrierung, Hilfe, Dating-Tipps, *.html) bleiben
 * immer auf der Live-Domain.
 */
export function PreviewLinks() {
  useEffect(() => {
    if (!isPreviewHost(window.location.hostname)) return;
    const rewrite = (element: Element, attribute: "href" | "action") => {
      const value = element.getAttribute(attribute);
      const italian = value?.match(ITALIAN_URL);
      if (italian) {
        element.setAttribute(attribute, `/ch/it${italian[1] || "/"}${italian[2] ?? ""}`);
        return;
      }
      const match = value?.match(MARKET_URL);
      if (!match) return;
      const market = match[1] as MarketCode;
      const path = match[2] || "/";
      if (isPlatformPath(path)) return;
      element.setAttribute(attribute, `${previewHref(market, path)}${match[3] ?? ""}`);
    };
    document.querySelectorAll("a[href]").forEach((anchor) => rewrite(anchor, "href"));
    document.querySelectorAll("form[action]").forEach((form) => rewrite(form, "action"));
  }, []);
  return null;
}
