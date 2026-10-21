import type { Metadata } from "next";
import "../globals.css";
import { IT_ICONS, IT_ORIGIN } from "@/lib/it-pilot";
import { assetHost } from "@/lib/static-asset";
import { Analytics } from "@vercel/analytics/next";
import { vercelAnalyticsProps } from "@/lib/vercel-analytics";

// Root-Layout der italienischen Variante single-cristiani.ch (intern /ch/it/, Route app/(italiano)/[market]/it):
// eigene Route-Gruppe, damit <html lang="it-CH"> schon im ausgelieferten HTML steht (Seobility/Google), nicht erst per Skript.
export const metadata: Metadata = {
  title: "single-cristiani.ch",
  description: "Incontri per single cristiani nella Svizzera italiana.",
  // Absolut auf die eigene Domain, auch in der Vorschau: Google liest das Favicon nur von der Website selbst.
  icons: {
    icon: [
      { url: `${IT_ORIGIN}${IT_ICONS.favicon.path}`, sizes: "any" },
      { url: `${IT_ORIGIN}${IT_ICONS.png.path}`, type: "image/png", sizes: "144x144" },
    ],
    apple: `${IT_ORIGIN}${IT_ICONS.apple.path}`,
  },
};

export default function ItalianRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it-CH"><body>{children}<Analytics {...vercelAnalyticsProps(assetHost)} /></body></html>;
}
