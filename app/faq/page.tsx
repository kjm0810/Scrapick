import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";

const CONTENT = {
  ko: {
    title: "FAQ: 자주 묻는 질문",
    description: "scrapicker를 사용하면서 자주 묻는 질문을 한 곳에 정리했습니다.",
    items: [
      {
        q: "iframe 접근이 막힌 사이트도 분석할 수 있나요?",
        a: "네. scrapicker는 서버 브라우저(Playwright) 렌더링 기반이어서 일반 iframe 제약이 있는 사이트도 상대적으로 안정적으로 처리합니다.",
      },
      {
        q: "추출 데이터는 서버에 저장되나요?",
        a: "기본 UX 기준으로 결과 데이터는 브라우저에서 처리/다운로드되며 서버 DB에 저장하지 않는 흐름으로 구성되어 있습니다.",
      },
      {
        q: "무한 스크롤 페이지도 가능한가요?",
        a: "서버 렌더 단계에서 자동 스크롤을 통해 추가 콘텐츠를 로드한 뒤 캡처/분석하는 방식으로 대응합니다.",
      },
      {
        q: "결과가 완벽하지 않을 때는 어떻게 하나요?",
        a: "뷰포트를 맞춰 재스캔하거나 CSV로 내보내 후처리하면 정확도를 빠르게 높일 수 있습니다.",
      },
    ],
    cta: "사용 가이드 보기",
  },
  en: {
    title: "FAQ: Frequently Asked Questions",
    description: "Common questions and answers about using scrapicker.",
    items: [
      {
        q: "Can it analyze sites where iframe access is blocked?",
        a: "Yes. scrapicker uses server-side browser rendering (Playwright), which is more robust than standard iframe-only approaches.",
      },
      {
        q: "Is extracted data stored on the server?",
        a: "By default, extracted results are processed and downloaded in the browser flow and are not stored in a server database.",
      },
      {
        q: "Does it work with infinite-scroll pages?",
        a: "The render stage can auto-scroll to load additional content before capture and analysis.",
      },
      {
        q: "What if extraction is not perfect?",
        a: "Adjust viewport focus and rescan, or export CSV and apply quick post-processing for higher quality.",
      },
    ],
    cta: "Read Guide",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo
    ? `${SITE_NAME} FAQ | 자주 묻는 질문`
    : `${SITE_NAME} FAQ | Frequently Asked Questions`;
  const description = isKo
    ? "scrapicker FAQ: iframe 제한, 데이터 저장 방식, 무한 스크롤 대응, 정확도 개선 방법을 확인하세요."
    : "scrapicker FAQ covering iframe restrictions, data handling, infinite scroll support, and quality tips.";

  return {
    title,
    description,
    alternates: {
      canonical: "/faq",
      languages: {
        "ko-KR": "/faq",
        "en-US": "/faq",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/faq",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function FaqPage() {
  const locale = detectLocaleFromHeaders(await headers());
  const t = CONTENT[locale];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <MarketingFrame locale={locale} currentPage="faq" title={t.title} description={t.description}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="space-y-3">
        {t.items.map((item) => (
          <article key={item.q} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{item.q}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.a}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <Link
          href="/guide"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          {t.cta}
        </Link>
      </section>
    </MarketingFrame>
  );
}
