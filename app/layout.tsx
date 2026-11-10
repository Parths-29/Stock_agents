import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import "./auth.css";
export const metadata: Metadata = {
  title: "StockPaws // Trading, with company.",
  description: "A paper trading terminal with five curious market companions.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
