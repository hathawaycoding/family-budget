import type { Metadata } from "next";
import Script from "next/script";
import { themeHydrationScript } from "@/components/app-shell/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Budget",
  description: "Monthly household worksheet for July through December 2026"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body><Script id="theme-hydration" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeHydrationScript }} />{children}</body>
    </html>
  );
}
