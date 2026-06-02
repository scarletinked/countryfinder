import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CountryFinder",
  description: "Find countries on a map — 10 rounds, score up to 1000 points",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
