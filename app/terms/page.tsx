import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";
const UPDATED_AT = "2026-04-09";

const CONTENT = {
  ko: {
    title: "이용약관",
    description: "scrapicker 서비스 이용 조건, 사용자 책임, 면책 및 정책 변경 절차를 안내합니다.",
    updatedLabel: `최종 업데이트: ${UPDATED_AT}`,
    sections: [
      {
        title: "1) 서비스 범위",
        body: "scrapicker는 웹 페이지 렌더링과 시각 기반 데이터 추출 보조 기능을 제공합니다. 결과 정확도는 대상 사이트 구조와 동적 상태에 따라 달라질 수 있습니다.",
      },
      {
        title: "2) 사용자 책임",
        body: "사용자는 대상 사이트의 약관, robots 정책, 관련 법령을 준수해야 하며, 제3자 권리를 침해하지 않는 범위에서 서비스를 사용해야 합니다.",
      },
      {
        title: "3) 금지 행위",
        body: "서비스 안정성을 해치는 과도한 요청, 비정상 트래픽 유도, 정책 위반 목적의 사용, 불법 데이터 수집 행위는 금지됩니다.",
      },
      {
        title: "4) 가용성 및 변경",
        body: "서비스 기능은 운영 상황에 따라 사전 고지 후 변경될 수 있으며, 장애 또는 유지보수로 일시 중단될 수 있습니다.",
      },
      {
        title: "5) 면책",
        body: "서비스 사용 결과로 발생한 직접/간접 손해에 대해 법령이 허용하는 범위 내에서 책임이 제한될 수 있습니다. 중요한 의사결정 전에는 결과 검증이 필요합니다.",
      },
      {
        title: "6) 약관 및 정책 업데이트",
        body: "약관 또는 정책이 변경될 경우 페이지 상단의 업데이트 일자를 갱신하며, 중대한 변경 사항은 사이트 내에서 안내합니다.",
      },
    ],
    ctaPrivacy: "개인정보처리방침 보기",
    ctaContact: "문의하기",
  },
  en: {
    title: "Terms of Service",
    description: "Service conditions, user responsibilities, disclaimers, and policy update practices for scrapicker.",
    updatedLabel: `Last updated: ${UPDATED_AT}`,
    sections: [
      {
        title: "1) Service scope",
        body: "scrapicker provides web rendering and visual extraction assistance. Output quality may vary by target site structure and dynamic behavior.",
      },
      {
        title: "2) User responsibility",
        body: "Users must comply with target-site terms, robots rules, and applicable laws, and must not violate third-party rights.",
      },
      {
        title: "3) Prohibited use",
        body: "Excessive traffic harming service stability, policy-evasion usage, and unlawful data collection activities are prohibited.",
      },
      {
        title: "4) Availability and changes",
        body: "Features may change with prior notice, and temporary interruptions may occur for maintenance or incidents.",
      },
      {
        title: "5) Disclaimer",
        body: "To the extent permitted by law, liability may be limited for direct or indirect losses. Validate extracted outputs before high-stakes decisions.",
      },
      {
        title: "6) Policy updates",
        body: "When terms or policies change, the update date on this page will be revised, and material updates will be announced on-site.",
      },
    ],
    ctaPrivacy: "Read Privacy Policy",
    ctaContact: "Contact",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo ? `${SITE_NAME} 이용약관` : `${SITE_NAME} Terms of Service`;
  const description = isKo
    ? "서비스 이용 조건과 책임 범위를 다루는 scrapicker 이용약관."
    : "scrapicker terms covering service scope, responsibilities, and disclaimers.";

  return {
    title,
    description,
    alternates: {
      canonical: "/terms",
      languages: {
        "ko-KR": "/terms",
        "en-US": "/terms",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/terms",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function TermsPage() {
  const locale = detectLocaleFromHeaders(await headers());
  const t = CONTENT[locale];

  return (
    <MarketingFrame locale={locale} title={t.title} description={t.description}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{t.updatedLabel}</p>
      </section>

      <section className="space-y-3">
        {t.sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-5 shadow-lg">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/privacy"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.ctaPrivacy}
          </Link>
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            {t.ctaContact}
          </Link>
        </div>
      </section>
    </MarketingFrame>
  );
}
