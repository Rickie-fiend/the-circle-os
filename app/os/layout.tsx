import type { Metadata } from "next";
import { CircleStateProvider, OSFrame } from "./circle-os-shell";
import { CircleOSPwa } from "./pwa-register";
import { CircleAuthBoundary } from "./auth/auth-boundary";
import "./os-app.css";

export const metadata: Metadata = {
  title: "The Circle OS — See how you live",
  description:
    "See how you want to live, how you live now, and what may help you feel like yourself.",
  manifest: "/circle-os.webmanifest?v=4",
  icons: {
    icon: "/brand/the-circle-mark.svg",
    apple: "/brand/circle-os-icon-180.png?v=4",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Circle OS",
  },
  openGraph: {
    title: "The Circle OS — See how you live",
    description:
      "One honest check-in. One meaningful move. A clearer vision of how you live.",
    type: "website",
    images: [
      {
        url: "/os-profile-og.png",
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
    images: ["/os-profile-og.png"],
  },
};

export default function CircleOSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CircleAuthBoundary><CircleStateProvider>
      <CircleOSPwa />
      <OSFrame>{children}</OSFrame>
    </CircleStateProvider></CircleAuthBoundary>
  );
}
