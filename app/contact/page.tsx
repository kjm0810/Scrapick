import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";
const EMAIL = "kimjungmin988@gmail.com";
const UPDATED_AT = "2026-04-09";

const CONTENT = {
  ko: {
    title: "문의하기",
    description: "서비스 문의, 제휴, 오류 제보, 기능 개선 제안은 이메일로 접수받고 있습니다.",
    updatedLabel: `최종 업데이트: ${UPDATED_AT}`,
    intro:
      "문의 시 대상 URL, 발생 시점, 기대 결과를 함께 보내주시면 더 빠르게 확인할 수 있습니다. 운영 기준으로 평일 1~2영업일 내 회신합니다.",
    sections: [
      {
        title: "지원 가능한 문의",
        bullets: [
          "스크래핑 결과 품질 이슈 및 재현 사례",
          "업무 자동화 연계(내보내기 포맷, 워크플로우)",
          "기능 개선 요청 및 우선순위 제안",
          "기술/비즈니스 협업 제안",
        ],
      },
      {
        title: "빠른 처리를 위한 포함 정보",
        bullets: [
          "문제가 발생한 대상 URL",
          "사용 환경(브라우저/기기) 및 시간대",
          "예상 결과와 실제 결과 비교",
          "오류 메시지 또는 화면 캡처",
        ],
      },
    ],
    emailLabel: "문의 이메일",
    ctaAbout: "서비스 소개 보기",
    ctaTerms: "이용약관 보기",
  },
  en: {
    title: "Contact",
    description: "We accept support requests, partnership inquiries, bug reports, and product feedback by email.",
    updatedLabel: `Last updated: ${UPDATED_AT}`,
    intro:
      "For faster handling, include the target URL, timestamp, expected output, and observed result. Typical response time is within 1-2 business days.",
    sections: [
      {
        title: "Inquiry types we handle",
        bullets: [
          "Extraction quality issues and reproducible cases",
          "Workflow integration and export requirements",
          "Feature requests and priority feedback",
          "Technical and business partnerships",
        ],
      },
      {
        title: "Details that help us resolve faster",
        bullets: [
          "Target URL where the issue occurred",
          "Environment info (browser/device/time)",
          "Expected vs observed result",
          "Error message or screenshot",
        ],
      },
    ],
    emailLabel: "Contact Email",
    ctaAbout: "Read About",
    ctaTerms: "Read Terms",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo ? `${SITE_NAME} 문의 | 지원 채널` : `${SITE_NAME} Contact | Support`;
  const description = isKo
    ? "scrapicker 지원/제휴 문의 채널과 응답 기준을 확인하세요."
    : "Get support, report issues, and send partnership inquiries to scrapicker.";

  return {
    title,
    description,
    alternates: {
      canonical: "/contact",
      languages: {
        "ko-KR": "/contact",
        "en-US": "/contact",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/contact",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ContactPage() {
  const locale = detectLocaleFromHeaders(await headers());
  const t = CONTENT[locale];

  return (
    <MarketingFrame locale={locale} title={t.title} description={t.description}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{t.updatedLabel}</p>
        <p className="mt-3 text-sm text-slate-700">{t.intro}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {t.sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="rounded-lg bg-slate-50 px-3 py-2">
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-5 shadow-lg">
        <p className="text-sm font-semibold text-slate-900">{t.emailLabel}</p>
        <a className="mt-1 inline-block text-sm font-medium text-teal-700 underline-offset-2 hover:underline" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/about"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.ctaAbout}
          </Link>
          <Link
            href="/terms"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.ctaTerms}
          </Link>
        </div>
      </section>
    </MarketingFrame>
  );
}
