import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homing Parrot",
  description: "It's like a Homing Pigeon, except prettier. Find countries, US states and Canadian provinces on a map.",
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
