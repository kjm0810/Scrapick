import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";

const CONTENT = {
  ko: {
    title: "사용 가이드: 3분 만에 스크래핑 시작",
    description:
      "처음 사용하는 분도 빠르게 실행할 수 있도록 scrapicker의 기본 흐름을 단계별로 정리했습니다.",
    steps: [
      {
        title: "1) URL 입력 후 페이지 불러오기",
        body: "분석할 사이트 주소를 입력하고 페이지를 불러오면 서버 렌더링 결과가 준비됩니다.",
      },
      {
        title: "2) AI 추출 실행",
        body: "스크린샷 기준으로 이미지/가격/텍스트 후보를 감지하고 박스로 표시합니다.",
      },
      {
        title: "3) 스크롤로 후보 검토",
        body: "뷰포트가 바뀌면 오른쪽 리스트가 유동적으로 갱신되어 현재 화면 기준으로 검토할 수 있습니다.",
      },
      {
        title: "4) CSV/JSON 내보내기",
        body: "결과 테이블에서 원하는 포맷으로 바로 다운로드해 후처리/자동화에 연결하세요.",
      },
    ],
    tipsTitle: "실전 팁",
    tips: [
      "동적 콘텐츠가 많은 사이트는 페이지 로드 후 몇 초 기다린 뒤 스캔하면 정확도가 올라갑니다.",
      "가격 추출이 중요하면 상품 리스트 구간을 먼저 화면에 맞춰 두고 스캔하세요.",
      "중복 항목이 많을 때는 CSV로 저장해 엑셀/스크립트에서 정규화하는 방식이 효율적입니다.",
    ],
    ctaPrimary: "스크래퍼 실행",
    ctaFaq: "FAQ 보기",
  },
  en: {
    title: "Guide: Start scraping in 3 minutes",
    description:
      "This quick guide walks you through the core scrapicker flow so you can run your first extraction right away.",
    steps: [
      {
        title: "1) Enter a URL and load the page",
        body: "Provide a target URL and load it to prepare a server-rendered preview.",
      },
      {
        title: "2) Run AI extraction",
        body: "The scan detects image/price/text candidates from the screenshot and marks them with boxes.",
      },
      {
        title: "3) Review results while scrolling",
        body: "As the viewport changes, the right-hand list updates dynamically for what is visible now.",
      },
      {
        title: "4) Export CSV/JSON",
        body: "Download the extracted table instantly and move it into your workflow.",
      },
    ],
    tipsTitle: "Pro tips",
    tips: [
      "For heavy dynamic pages, wait a few seconds after load before scanning for better accuracy.",
      "If prices matter most, place the product list in view before triggering extraction.",
      "When duplicates are expected, export CSV and normalize data in spreadsheets or scripts.",
    ],
    ctaPrimary: "Open Scraper",
    ctaFaq: "Open FAQ",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo
    ? `${SITE_NAME} 가이드 | 사용법 안내`
    : `${SITE_NAME} Guide | How to Use`;
  const description = isKo
    ? "scrapicker 사용 가이드: URL 입력, AI 추출, 스크롤 검토, CSV/JSON 내보내기까지 단계별 안내."
    : "Step-by-step scrapicker guide from URL input and AI extraction to review and CSV/JSON export.";

  return {
    title,
    description,
    alternates: {
      canonical: "/guide",
      languages: {
        "ko-KR": "/guide",
        "en-US": "/guide",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/guide",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function GuidePage() {
  const locale = detectLocaleFromHeaders(await headers());
  const t = CONTENT[locale];

  return (
    <MarketingFrame locale={locale} currentPage="guide" title={t.title} description={t.description}>
      <section className="grid gap-4">
        {t.steps.map((step) => (
          <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{step.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900">{t.tipsTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {t.tips.map((tip) => (
            <li key={tip} className="rounded-lg bg-slate-50 px-3 py-2">
              {tip}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            {t.ctaPrimary}
          </Link>
          <Link
            href="/faq"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.ctaFaq}
          </Link>
        </div>
      </section>
    </MarketingFrame>
  );
}
