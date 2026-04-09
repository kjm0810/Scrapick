import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";
const UPDATED_AT = "2026-04-09";

const CONTENT = {
  ko: {
    title: "scrapicker 소개",
    description:
      "scrapicker는 시각 기반 웹 데이터 추출을 더 빠르고 안정적으로 만들기 위해 운영되는 실전형 서비스입니다.",
    intro:
      "우리는 단순 데모가 아닌 실제 업무 자동화에 바로 연결 가능한 스크래핑 워크플로를 만드는 데 집중합니다. 서비스 문서, 정책, 운영 연락 채널을 공개하고 지속적으로 개선합니다.",
    updatedLabel: `최종 업데이트: ${UPDATED_AT}`,
    cards: [
      {
        title: "운영 목적",
        body: "반복적인 웹 데이터 수집 작업을 표준화해 팀의 조사/리포팅 시간을 단축합니다.",
      },
      {
        title: "핵심 방식",
        body: "Playwright 렌더링 기반으로 페이지를 캡처하고, AI로 추출 가능한 요소를 분석합니다.",
      },
      {
        title: "데이터 처리 원칙",
        body: "기본 UX 기준으로 추출 결과는 브라우저 다운로드 중심이며 서버 DB 저장을 기본값으로 두지 않습니다.",
      },
    ],
    principlesTitle: "운영 원칙",
    principles: [
      "사용자가 이해할 수 있는 설명과 문서 우선",
      "정책 페이지(개인정보처리방침/이용약관) 상시 공개",
      "문의 채널과 응답 기준 명확화",
      "과장 없는 기능 안내와 한계 고지",
    ],
    ctaContact: "문의하기",
    ctaPrivacy: "개인정보처리방침",
  },
  en: {
    title: "About scrapicker",
    description:
      "scrapicker is a practical service focused on fast and reliable visual web data extraction workflows.",
    intro:
      "Our goal is not a one-time demo but repeatable automation in real-world operations. We keep documentation, policies, and support channels publicly visible and updated.",
    updatedLabel: `Last updated: ${UPDATED_AT}`,
    cards: [
      {
        title: "Mission",
        body: "Standardize repetitive web data collection so teams can spend less time on manual reporting.",
      },
      {
        title: "Core approach",
        body: "Render pages with Playwright, then detect extractable elements with visual AI analysis.",
      },
      {
        title: "Data handling principle",
        body: "In the default user flow, extracted results are downloaded in the browser rather than persisted in a server database.",
      },
    ],
    principlesTitle: "Operating principles",
    principles: [
      "Explainability first for users",
      "Always-available policy pages",
      "Clear support channel and response expectation",
      "Honest communication about features and limits",
    ],
    ctaContact: "Contact",
    ctaPrivacy: "Privacy Policy",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo ? `${SITE_NAME} 소개 | 운영 철학` : `${SITE_NAME} About | Operating Principles`;
  const description = isKo
    ? "scrapicker 운영 목적, 핵심 기술, 데이터 처리 원칙, 문의 및 정책 접근 경로를 확인하세요."
    : "Learn about scrapicker mission, technical approach, data handling principles, and policy transparency.";

  return {
    title,
    description,
    alternates: {
      canonical: "/about",
      languages: {
        "ko-KR": "/about",
        "en-US": "/about",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/about",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function AboutPage() {
  const locale = detectLocaleFromHeaders(await headers());
  const t = CONTENT[locale];

  return (
    <MarketingFrame locale={locale} currentPage="about" title={t.title} description={t.description}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{t.updatedLabel}</p>
        <p className="mt-3 text-sm text-slate-700">{t.intro}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {t.cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900">{t.principlesTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {t.principles.map((principle) => (
            <li key={principle} className="rounded-lg bg-slate-50 px-3 py-2">
              {principle}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            {t.ctaContact}
          </Link>
          <Link
            href="/privacy"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.ctaPrivacy}
          </Link>
        </div>
      </section>
    </MarketingFrame>
  );
}
