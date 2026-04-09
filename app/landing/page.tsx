import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";

const CONTENT = {
  ko: {
    title: "랜딩 페이지: 스크린샷 기반 AI 웹 스크래핑",
    description:
      "scrapicker는 Playwright로 대형 사이트를 렌더링한 뒤, 시각 기반으로 이미지/가격/텍스트를 추출해 CSV/JSON으로 즉시 내보냅니다.",
    cards: [
      {
        title: "대형 사이트 대응 렌더링",
        body: "브라우저 렌더링 기반으로 일반 iframe 제한 없이 페이지를 캡처하고 분석합니다.",
      },
      {
        title: "문서 전체 캡처 + 뷰포트 필터",
        body: "전체 길이 스크린샷에서 현재 스크롤 화면 기준으로 박스/리스트가 동기화되어 보입니다.",
      },
      {
        title: "즉시 내보내기",
        body: "추출 결과를 CSV/JSON으로 바로 내려받아 업무 자동화나 데이터 정리에 활용할 수 있습니다.",
      },
    ],
    ctaTitle: "지금 바로 테스트해보세요",
    ctaBody: "URL만 입력하면 시각 분석 기반으로 추출 가능한 요소를 바로 확인할 수 있습니다.",
    ctaPrimary: "스크래퍼 실행",
    ctaGuide: "사용 가이드 보기",
  },
  en: {
    title: "Landing: Screenshot-first AI Web Scraping",
    description:
      "scrapicker renders large websites with Playwright, extracts images/prices/text using visual analysis, and lets you export data to CSV/JSON instantly.",
    cards: [
      {
        title: "Rendering for large websites",
        body: "Browser rendering captures and analyzes pages without common iframe limitations.",
      },
      {
        title: "Full-page capture + viewport sync",
        body: "Boxes and extracted lists stay aligned with the currently visible viewport as you scroll.",
      },
      {
        title: "Instant export",
        body: "Download extracted results as CSV/JSON for automation workflows and data operations.",
      },
    ],
    ctaTitle: "Try it now",
    ctaBody: "Paste a URL and instantly inspect extractable elements with visual AI scanning.",
    ctaPrimary: "Open Scraper",
    ctaGuide: "Read Guide",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo
    ? `${SITE_NAME} 랜딩 | AI 웹 스크래핑 소개`
    : `${SITE_NAME} Landing | AI Web Scraping`;
  const description = isKo
    ? "scrapicker 랜딩 페이지에서 대형 사이트 렌더링, 전체 캡처, CSV/JSON 내보내기 기능을 확인하세요."
    : "Explore scrapicker features including large-site rendering, full-page capture, and CSV/JSON export.";

  return {
    title,
    description,
    alternates: {
      canonical: "/landing",
      languages: {
        "ko-KR": "/landing",
        "en-US": "/landing",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/landing",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LandingPage() {
  const locale = detectLocaleFromHeaders(await headers());
  const t = CONTENT[locale];

  return (
    <MarketingFrame locale={locale} currentPage="landing" title={t.title} description={t.description}>
      <section className="grid gap-4 md:grid-cols-3">
        {t.cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-5 shadow-lg sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t.ctaTitle}</h2>
        <p className="mt-2 text-sm text-slate-700">{t.ctaBody}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            {t.ctaPrimary}
          </Link>
          <Link
            href="/guide"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.ctaGuide}
          </Link>
        </div>
      </section>
    </MarketingFrame>
  );
}
