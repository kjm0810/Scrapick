import type { Metadata } from "next";
import { headers } from "next/headers";

import ScrapickerClient from "@/components/ScrapickerClient";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo
    ? `${SITE_NAME} | AI 비주얼 웹 스크래퍼`
    : `${SITE_NAME} | AI Visual Web Scraper`;

  const description = isKo
    ? "scrapicker는 대형 사이트를 Playwright로 렌더링하고, 추출 가능한 이미지/가격/텍스트를 분석해 CSV/JSON으로 내보낼 수 있는 AI 웹 스크래퍼입니다."
    : "scrapicker is an AI visual web scraper that renders large websites with Playwright, extracts images/prices/text, and exports CSV/JSON.";

  return {
    title,
    description,
    keywords: isKo
      ? [
          "scrapicker",
          "웹 스크래퍼",
          "AI 스크래핑",
          "Playwright",
          "가격 추출",
          "CSV 내보내기",
        ]
      : [
          "scrapicker",
          "web scraper",
          "AI scraping",
          "Playwright",
          "price extraction",
          "CSV export",
        ],
    alternates: {
      canonical: "/",
      languages: {
        "ko-KR": "/",
        "en-US": "/",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Page() {
  const locale = detectLocaleFromHeaders(await headers());

  return <ScrapickerClient locale={locale} />;
}
