import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { ABOUT_PAGE_MOVES } from "./lib/about";

// Der nginx vor den Live-Domains reicht nur Seitenrouten an Vercel weiter.
// Assets (/_next, /_next/image, public-Dateien) kommen darum absolut vom Vercel-Host.
const DEFAULT_ASSET_HOST = "https://christlich-verliebt.vercel.app";
const DEFAULT_ASSET_PATH_PREFIX = "/app-assets";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeAssetPathPrefix(value: string) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const trimmed = trimTrailingSlash(withLeadingSlash);
  return trimmed || DEFAULT_ASSET_PATH_PREFIX;
}

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const assetHost = trimTrailingSlash(process.env.NEXT_PUBLIC_ASSET_HOST || DEFAULT_ASSET_HOST);
  const assetHostname = new URL(assetHost).hostname;
  const assetPathPrefix = normalizeAssetPathPrefix(
    process.env.NEXT_PUBLIC_ASSET_PATH_PREFIX || DEFAULT_ASSET_PATH_PREFIX,
  );

  return {
    poweredByHeader: false,
    trailingSlash: true,
    assetPrefix: isDev ? undefined : `${assetHost}${assetPathPrefix}`,
    images: {
      // nginx vor den Live-Domains reicht /_next/image nicht weiter, darum optimiert der Vercel-Host.
      // Wegen trailingSlash mit Schrägstrich am Ende (so erzeugt Next.js den Pfad ohnehin).
      path: isDev ? "/_next/image/" : `${assetHost}/_next/image/`,
      remotePatterns: [
        {
          protocol: "https",
          hostname: assetHostname,
          pathname: `${assetPathPrefix}/**`,
        },
      ],
    },
    async redirects() {
      // Live-Host ohne Länderpräfix (nur .de hat diese Seiten) und Vercel-Vorschau mit /de-Präfix.
      return Object.entries(ABOUT_PAGE_MOVES.de ?? {}).flatMap(([source, destination]) => [
        { source, destination, permanent: true, has: [{ type: "host" as const, value: "(?:www\.)?christlich-verliebt\.de" }] },
        { source: `/de${source}`, destination: `/de${destination}`, permanent: true },
      ]);
    },
    async headers() {
      return [{
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      }];
    },
    async rewrites() {
      return [
        {
          source: `${assetPathPrefix}/:path*`,
          destination: "/:path*",
        },
      ];
    },
  };
}
