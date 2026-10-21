import type { Metadata } from "next";
import "../globals.css";
import { getMarket, isMarketCode } from "@/lib/markets";
import { staticAsset, assetHost } from "@/lib/static-asset";
import { Analytics } from "@vercel/analytics/next";
import { vercelAnalyticsProps } from "@/lib/vercel-analytics";

// Root-Layout der deutschen Seiten (de/at/ch). Es liegt im Segment [market], damit <html lang> zum Markt passt;
// die italienische Variante (single-cristiani.ch, intern /ch/it/) hat ihr eigenes Root-Layout in app/(italiano)/layout.tsx.

export const metadata: Metadata = {
  title: "christlich-verliebt",
  description: "Christliche Partnersuche für Menschen mit gemeinsamen Werten.",
  icons: {
    icon: staticAsset("/brand/icon.png"),
    apple: staticAsset("/brand/apple-icon.png"),
  },
};

export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ market: string }> }>) {
  const { market } = await params;
  const lang = isMarketCode(market) ? getMarket(market).locale : "de";
  return <html lang={lang}><body>{children}<Analytics {...vercelAnalyticsProps(assetHost)} /></body></html>;
}
