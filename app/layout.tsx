/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://squad-party.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Squad Party — Party Games With Your Squad",
    template: "%s | Squad Party",
  },
  description:
    "Party games with your squad — trivia, drawing, word games, and custom creations. One link, everyone plays.",
  keywords: [
    "party games",
    "multiplayer",
    "trivia",
    "drawing games",
    "word games",
    "game studio",
    "custom games",
  ],
  authors: [{ name: "VargasJR", url: "https://vargasjr.dev" }],
  openGraph: {
    title: "Squad Party — Party Games With Your Squad",
    description:
      "Trivia, drawing, word games, and custom creations. One link, everyone plays.",
    type: "website",
    url: SITE_URL,
    siteName: "Squad Party",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Squad Party — Party Games With Your Squad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Squad Party — Party Games With Your Squad",
    description:
      "Trivia, drawing, word games, and custom creations. One link, everyone plays.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  themeColor: "#FF6B6B",
  icons: {
    icon: [
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
