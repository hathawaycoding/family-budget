import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Budget",
  description: "Monthly household worksheet for July through December 2026"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
