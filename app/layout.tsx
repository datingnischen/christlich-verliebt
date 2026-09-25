import type { Metadata } from "next";
import "./globals.css";
import { staticAsset } from "@/lib/static-asset";

export const metadata: Metadata = {
  title: "christlich-verliebt",
  description: "Christliche Partnersuche für Menschen mit gemeinsamen Werten.",
  icons: {
    icon: staticAsset("/brand/icon.png"),
    apple: staticAsset("/brand/apple-icon.png"),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
