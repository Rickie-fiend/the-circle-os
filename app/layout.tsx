import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "The Circle — Mastermind Fight Club",
  description:
    "An Exclusive Community for Modern Masculine Growth and One Truth.",
  metadataBase: new URL("https://theonecircle.club"),
  openGraph: {
    title: "The Circle — Mastermind Fight Club",
    description:
      "An Exclusive Community for Modern Masculine Growth and One Truth.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "The Circle — Mastermind Fight Club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Circle — Mastermind Fight Club",
    description:
      "An Exclusive Community for Modern Masculine Growth and One Truth.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${cormorant.variable}`}>{children}</body>
    </html>
  );
}
