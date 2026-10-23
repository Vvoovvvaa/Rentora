import type { Metadata } from "next";
import { Providers } from "./provider";

import "./globals.css";
import "./home.css";
import "./responsive.css";
import "./home-refinement.css";
import "./home-story.css";
import "./system-polish.css";
import "./subscription.css";
import "./explore-home-polish.css";
import "./home-redesign.css";

export const metadata: Metadata = {
  title: "Rentora — discover places to live across Armenia",
  description:
    "Find real homes in Armenia with map search, comparison and direct conversations.",
  icons: {
    icon: [
      {
        url: "/brand/rentora-symbol.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/brand/rentora-symbol.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}