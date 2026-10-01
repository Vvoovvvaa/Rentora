import type { Metadata } from "next";
import "./globals.css";
import "./home.css";
import "./responsive.css";
import "./home-refinement.css";
import "./system-polish.css";

export const metadata: Metadata = {
  title: "Rentora — find a place you’ll love",
  description: "A considered way to discover homes in Armenia.",
  icons: {
    icon: [{ url: "/brand/rentora-symbol.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/brand/rentora-symbol.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
