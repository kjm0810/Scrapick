import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";
const UPDATED_AT = "2026-04-09";

const CONTENT = {
  ko: {
    title: "개인정보처리방침",
    description:
      "scrapicker에서 처리하는 정보, 광고 쿠키 사용 고지, 사용자 선택권(맞춤 광고 해제 포함)을 안내합니다.",
    updatedLabel: `최종 업데이트: ${UPDATED_AT}`,
    sections: [
      {
        title: "1) 수집 및 처리 범위",
        body: "서비스 사용 과정에서 URL 입력값, 요청 시각, 오류 로그 등 운영 안정성 확보를 위한 최소한의 기술 로그가 생성될 수 있습니다.",
      },
      {
        title: "2) 추출 데이터 처리 원칙",
        body: "기본 사용자 흐름에서 추출 결과는 브라우저에서 확인 및 다운로드되며, 별도 서버 데이터베이스에 기본 저장하지 않습니다.",
      },
      {
        title: "3) 광고 및 쿠키",
        body: "본 사이트는 Google AdSense 광고를 포함할 수 있습니다. Google 및 제3자 공급업체는 사용자의 이전 방문 정보 등을 바탕으로 쿠키를 사용해 광고를 제공할 수 있습니다.",
      },
      {
        title: "4) 맞춤 광고 선택권",
        body: "사용자는 Google 광고 설정 또는 업계 표준 선택 해제 페이지를 통해 맞춤 광고를 제어할 수 있습니다.",
      },
      {
        title: "5) 제3자 광고 네트워크 고지",
        body: "Google 외 제3자 광고 공급업체가 광고를 제공하는 경우, 해당 업체의 정책 및 선택 해제 방법은 각 공급업체 안내를 따릅니다.",
      },
      {
        title: "6) 문의 및 권리 행사",
        body: "개인정보 및 서비스 운영 관련 문의는 문의 페이지 또는 하단 이메일 채널을 통해 접수할 수 있습니다.",
      },
    ],
    optOutGoogle: "Google 광고 설정",
    optOutNai: "aboutads.info 선택 해제",
    ctaContact: "문의하기",
    ctaTerms: "이용약관 보기",
  },
  en: {
    title: "Privacy Policy",
    description:
      "How scrapicker handles operational data, ad cookie disclosures, and user choices including personalized ad opt-out paths.",
    updatedLabel: `Last updated: ${UPDATED_AT}`,
    sections: [
      {
        title: "1) Data scope",
        body: "To operate the service, minimal technical logs may be generated, such as URL input, request timestamps, and error events.",
      },
      {
        title: "2) Extraction data handling",
        body: "In the default flow, extracted results are reviewed and downloaded in the browser and are not persisted in a server-side database by default.",
      },
      {
        title: "3) Ads and cookies",
        body: "This site may display Google AdSense ads. Google and third-party vendors may use cookies to serve ads based on prior visits.",
      },
      {
        title: "4) User choice for personalized ads",
        body: "Users can manage personalized ads through Google Ads Settings or industry opt-out pages.",
      },
      {
        title: "5) Third-party vendor disclosure",
        body: "If third-party ad networks are used, their policies and opt-out methods follow each vendor's official guidance.",
      },
      {
        title: "6) Contact and rights requests",
        body: "For privacy and service-operation inquiries, use the contact page or the email listed in the site footer.",
      },
    ],
    optOutGoogle: "Google Ads Settings",
    optOutNai: "aboutads.info opt-out",
    ctaContact: "Contact",
    ctaTerms: "Read Terms",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo ? `${SITE_NAME} 개인정보처리방침` : `${SITE_NAME} Privacy Policy`;
  const description = isKo
    ? "광고 쿠키 고지, 데이터 처리 범위, 맞춤 광고 선택권을 포함한 scrapicker 개인정보처리방침."
    : "scrapicker privacy policy covering data scope, ad cookies, and personalized ad choices.";

  return {
    title,
    description,
    alternates: {
      canonical: "/privacy",
      languages: {
        "ko-KR": "/privacy",
        "en-US": "/privacy",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/privacy",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PrivacyPage() {
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
          <a
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            {t.optOutGoogle}
          </a>
          <a
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            href="https://www.aboutads.info/"
            target="_blank"
            rel="noreferrer"
          >
            {t.optOutNai}
          </a>
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            {t.ctaContact}
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
