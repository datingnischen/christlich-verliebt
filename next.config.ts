import type { NextConfig } from "next";
import { ABOUT_PAGE_MOVES } from "./lib/about";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  async redirects() {
    // Live-Host ohne Länderpräfix (nur .de hat diese Seiten) und Vercel-Vorschau mit /de-Präfix.
    return Object.entries(ABOUT_PAGE_MOVES.de ?? {}).flatMap(([source, destination]) => [
      { source, destination, permanent: true, has: [{ type: "host" as const, value: "(?:www\\.)?christlich-verliebt\\.de" }] },
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
};

export default nextConfig;
