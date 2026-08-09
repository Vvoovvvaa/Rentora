import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rentora — find a place you’ll love",
  description: "A considered way to discover homes in Armenia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
