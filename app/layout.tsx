import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

import { ADSENSE_CLIENT, ADSENSE_SCRIPT_SRC } from "@/lib/adsense";
import { detectLocaleFromHeaders } from "@/lib/locale";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "scrapicker",
  title: {
    default: "scrapicker",
    template: "%s | scrapicker",
  },
  description: "AI visual web scraper powered by Playwright rendering.",
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = detectLocaleFromHeaders(await headers());
  const siteUrl = getSiteUrl();
  const siteOrigin = siteUrl?.origin ?? "https://scrapicker.app";
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "scrapicker",
    url: siteOrigin,
    email: "kimjungmin988@gmail.com",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "scrapicker",
    url: siteOrigin,
    inLanguage: ["ko-KR", "en-US"],
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Analytics />
        <Script
          id="adsense-script"
          src={ADSENSE_SCRIPT_SRC}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
