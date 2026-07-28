import type { Metadata } from "next";
import "./os-app.css";

export const metadata: Metadata = {
  title: "The Circle OS — See how you live",
  description:
    "A free lifestyle design system for one honest check-in, one meaningful move, and a clearer vision of how you live.",
  openGraph: {
    title: "The Circle OS — See how you live",
    description:
      "One honest check-in. One meaningful move. A clearer vision of how you live.",
    type: "website",
    images: [
      {
        url: "/os-og.png",
        width: 1536,
        height: 1024,
        alt: "The Circle OS — See how you live.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Circle OS — See how you live",
    description:
      "One honest check-in. One meaningful move. A clearer vision of how you live.",
    images: ["/os-og.png"],
  },
};

export default function CircleOSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
