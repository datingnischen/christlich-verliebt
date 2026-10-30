"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// ICONY-GA4 auf unseren Vercel-Seiten hinter dem ICONY-nginx (Freigabe Uwe Thomas, 2026-10-30).
// Kein eigener Banner: GA4 lädt nur, wenn der Besucher auf derselben Domain im ICONY-Consent
// (localStorage "ccp_state") Google Analytics zugestimmt hat. Ohne Zustimmung, auf Vercel-Vorschauhosts und
// auf Domains ohne Eintrag passiert nichts. IDs = trackingId4 der jeweiligen ICONY-Plattform.
// Vorlage: agent-skills/templates/icony-ga4 – Änderungen dort pflegen und in die Apps kopieren.

const ICONY_GA4_BY_HOST: Record<string, string> = {
  "ab50.ch": "G-TXBSN1VY0S",
  "ab50.de": "G-T9W3YHCGTS",
  "akademikersingles.de": "G-M53442BQYK",
  "alleinerziehende-singles.at": "G-S1VTLJRXZR",
  "alleinerziehende-singles.ch": "G-7XWFT0ZV1S",
  "alleinerziehende-singles.de": "G-53JCKW32RV",
  "baeckersingles.de": "G-GGHVRYVEYG",
  "blaulichtsingles.ch": "G-RLNJ521QFY",
  "christlich-verliebt.at": "G-K41EZ0DME7",
  "christlich-verliebt.ch": "G-9KPJNV5QHR",
  "christlich-verliebt.de": "G-8Y545BK6ZS",
  "dich-mit-stich.at": "G-372JS11YRL",
  "dich-mit-stich.ch": "G-V0P40TE8E4",
  "dich-mit-stich.de": "G-821DTW4T9X",
  "eishockey-liebe.de": "G-MZ397RWY6L",
  "elflirt.at": "G-WRFP8CTQ00",
  "elflirt.ch": "G-3TPR0NYNGZ",
  "elflirt.de": "G-J76HK10S1T",
  "er-sucht-ihn.de": "G-ZVR182TJFX",
  "er-sucht-sie.de": "G-2RYSKQG8CD",
  "farmersingles.de": "G-SFN052PR54",
  "fitness-liebe.de": "G-Z5MWQRY08M",
  "fussballsingles.de": "G-NKQRBTF8G3",
  "gastrosingles.de": "G-YYPQ238FZE",
  "girlflirt.de": "G-Y3FCJQ5H6W",
  "handwerksingles.de": "G-7BD1C3NC9Y",
  "hannover-singles.de": "G-K07BBPBP90",
  "jobsingles.de": "G-FV26PJYN1S",
  "koelner-single.de": "G-BFN9LMD85C",
  "mediasingles.de": "G-TR9MXBE0W6",
  "medicsingles.de": "G-R24Y0S0J03",
  "metzgersingles.de": "G-NM615332Q1",
  "mycityflirt.de": "G-L802PC7TVD",
  "ost-singles.de": "G-HLDQN3484Y",
  "partnersuche-hamburg.de": "G-B9P7M8SN82",
  "polizeisingles.de": "G-73GPVW2S6Q",
  "prinz-sucht-prinzessin.de": "G-FGT9C9W9K7",
  "schwer-verliebt.de": "G-DQ613XMV4B",
  "sie-sucht-ihn.de": "G-79VPGD8J1H",
  "sie-sucht-sie.de": "G-G4TKKQFWCD",
  "singlebuure.ch": "G-2KR5EWD71E",
  "singles-muenchen.de": "G-G69ZN1E9L1",
  "tattoosingles.de": "G-47D55G5M93",
  "tierisch-verliebt.at": "G-Q7NEPTFRH6",
  "tierisch-verliebt.ch": "G-JHT73LGS00",
  "tierisch-verliebt.de": "G-W345P54Z7K",
  "veggie-sucht-veggie.de": "G-52L6PT1TVS",
};

// CCPluginIds.GoogleAnalytics im ICONY-Consent
const ICONY_CCP_GOOGLE_ANALYTICS = 1;

type IconyConsentState = { acceptedAll?: unknown; acceptedPlugins?: unknown };
type Gtag = (...args: unknown[]) => void;
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag; __iconyGa4Id?: string };

export function iconyGa4IdForHost(hostname: string): string | undefined {
  return ICONY_GA4_BY_HOST[hostname.toLowerCase().replace(/^www\./, "")];
}

export function hasIconyAnalyticsConsent(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const state = JSON.parse(raw) as IconyConsentState;
    if (state.acceptedAll === true) return true;
    return Array.isArray(state.acceptedPlugins) && state.acceptedPlugins.some((id) => Number(id) === ICONY_CCP_GOOGLE_ANALYTICS);
  } catch {
    return false;
  }
}

function readConsent(): string | null {
  try {
    return window.localStorage.getItem("ccp_state");
  } catch {
    return null;
  }
}

function ensureGtag(id: string): Gtag {
  const w = window as GtagWindow;
  if (w.__iconyGa4Id === id && w.gtag) return w.gtag;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag.js erwartet das arguments-Objekt, kein Array
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", id, { send_page_view: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
  w.__iconyGa4Id = id;
  return w.gtag;
}

export function IconyGa4() {
  const pathname = usePathname();
  useEffect(() => {
    const id = iconyGa4IdForHost(window.location.hostname);
    if (!id || !hasIconyAnalyticsConsent(readConsent())) return;
    ensureGtag(id)("event", "page_view", {
      send_to: id,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);
  return null;
}
