import type { Metadata } from "next";
import "../globals.css";
import { staticAsset, assetHost } from "@/lib/static-asset";
import { Analytics } from "@vercel/analytics/next";
import { vercelAnalyticsProps } from "@/lib/vercel-analytics";

// Root-Layout der italienischen Variante single-cristiani.ch (intern /ch/it/, Route app/(italiano)/[market]/it):
// eigene Route-Gruppe, damit <html lang="it-CH"> schon im ausgelieferten HTML steht (Seobility/Google), nicht erst per Skript.
export const metadata: Metadata = {
  title: "single-cristiani.ch",
  description: "Incontri per single cristiani nella Svizzera italiana.",
  icons: {
    icon: staticAsset("/brand/icon.png"),
    apple: staticAsset("/brand/apple-icon.png"),
  },
};

export default function ItalianRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it-CH"><body>{children}<Analytics {...vercelAnalyticsProps(assetHost)} /></body></html>;
}
