// Vercel Web Analytics hinter einem fremden nginx: Die Live-Domain reicht nur Seitenrouten an
// Vercel durch, deshalb müssen Script und Beacons absolut vom Vercel-Host geladen werden
// (gleiches Prinzip wie der Asset-Host in next.config). Vercel übergibt die projektspezifischen
// Pfade beim Build in NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG; ohne sie gelten die
// klassischen /_vercel/insights-Pfade. Außerhalb von production (next dev) bleibt alles Standard.
const LEGACY_ENDPOINTS = {
  scriptSrc: "/_vercel/insights/script.js",
  viewEndpoint: "/_vercel/insights/view",
  eventEndpoint: "/_vercel/insights/event",
  sessionEndpoint: "/_vercel/insights/session",
};

export type VercelAnalyticsEndpoints = {
  scriptSrc?: string;
  viewEndpoint?: string;
  eventEndpoint?: string;
  sessionEndpoint?: string;
};

function configuredEndpoints(): VercelAnalyticsEndpoints {
  const raw = process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG;
  if (!raw) return {};
  try {
    return (JSON.parse(raw) as { analytics?: VercelAnalyticsEndpoints }).analytics ?? {};
  } catch {
    return {};
  }
}

/** Props für <Analytics />: leer, wenn kein Asset-Host gesetzt ist oder nicht in production gebaut wird. */
export function vercelAnalyticsProps(assetHost: string | undefined): VercelAnalyticsEndpoints {
  const host = (assetHost ?? "").replace(/\/+$/, "");
  if (!host || process.env.NODE_ENV !== "production") return {};
  const configured = configuredEndpoints();
  const absolute = (path: string) =>
    /^https?:\/\//i.test(path) ? path : `${host}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    scriptSrc: absolute(configured.scriptSrc ?? LEGACY_ENDPOINTS.scriptSrc),
    viewEndpoint: absolute(configured.viewEndpoint ?? LEGACY_ENDPOINTS.viewEndpoint),
    eventEndpoint: absolute(configured.eventEndpoint ?? LEGACY_ENDPOINTS.eventEndpoint),
    sessionEndpoint: absolute(configured.sessionEndpoint ?? LEGACY_ENDPOINTS.sessionEndpoint),
  };
}
