import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "christlich-verliebt",
  description: "Christliche Partnersuche für Menschen mit gemeinsamen Werten.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
