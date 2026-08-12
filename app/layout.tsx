import type { Metadata } from "next";
import "./globals.css";

// The typefaces are served from public/fonts and declared in globals.css.
//
// They used to come from next/font/google, which fetches them during the build.
// That made a network hiccup able to fail a production deploy, and it did:
// a build died fetching Cormorant while the preview of the same commit passed
// seconds later, so production silently stayed on the previous commit. It also
// never worked under vinext on Windows, which emitted a raw disk path into the
// stylesheet and left both faces falling back to a system sans.
//
// Self-hosting removes the build-time network dependency entirely.

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('circle-theme')==='light'?'light':'dark'}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
