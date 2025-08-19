import type { Metadata } from "next";
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "HungryFools.dev — Directory of hungry and foolish vibecoders who ship at superhuman speed.",
  description:
    "The directory of hungry and foolish vibecoders who ship at superhuman speed.",
  keywords: [
    "vibecoders",
    "vibe-coding",
    "ai-powered developers",
    "developers",
    "programmers",
    "coders",
    "software engineers",
    "tech",
    "startup",
    "indie hackers",
    "builders",
  ],
  authors: [{ name: "HungryFools.dev" }],
  creator: "HungryFools.dev",
  publisher: "HungryFools.dev",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hungryfools.dev",
    siteName: "HungryFools.dev",
    title: "HungryFools.dev — Directory of hungry and foolish vibecoders",
    description:
      "The directory of hungry and foolish vibecoders who ship at superhuman speed.",
    images: [
      {
        url: "https://cdn.hungryfools.dev/og-images/og-image-bd85993b-e328-429f-8d7f-9218c35134c9.png",
        width: 1200,
        height: 630,
        alt: "HungryFools.dev - Directory of hungry and foolish vibecoders",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "HungryFools.dev — Directory of hungry and foolish vibecoders",
    description:
      "The directory of hungry and foolish vibecoders who ship at superhuman speed.",
    images: [
      "https://cdn.hungryfools.dev/og-images/og-image-bd85993b-e328-429f-8d7f-9218c35134c9.png",
    ],
    creator: "@ohwellnotreally",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  metadataBase: new URL("https://hungryfools.dev"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelifySans.variable} antialiased`}
      >
        <SessionProvider>
          <CookieConsent />
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
