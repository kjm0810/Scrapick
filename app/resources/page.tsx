import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import MarketingFrame from "@/components/MarketingFrame";
import { detectLocaleFromHeaders } from "@/lib/locale";

const SITE_NAME = "scrapicker";
const UPDATED_AT = "2026-04-09";

const CONTENT = {
  ko: {
    title: "실전 리소스: 웹 스크래핑 운영 가이드",
    description:
      "데이터 수집 자동화를 실제 운영으로 연결할 때 필요한 체크리스트, 품질 관리, 비용 최적화 전략을 정리했습니다.",
    updatedLabel: `최종 업데이트: ${UPDATED_AT}`,
    sections: [
      {
        title: "1) 수집 시작 전 체크리스트",
        body: "목표를 선명하게 정의하면 불필요한 크롤링 비용을 크게 줄일 수 있습니다. 분석 목적, 저장 포맷, 갱신 주기, 실패 대응 정책을 먼저 정리하세요.",
        bullets: [
          "목표 KPI: 어떤 필드가 반드시 필요한지(가격, 이미지, 텍스트)",
          "실행 주기: 실시간/일간/주간 중 어떤 주기가 비즈니스에 맞는지",
          "품질 기준: 허용 가능한 누락률/중복률을 수치로 정의",
          "오류 대응: 재시도 횟수, 실패 URL 큐, 알림 채널 설정",
        ],
      },
      {
        title: "2) 품질을 높이는 스캔 운영법",
        body: "스크린샷 기반 추출은 뷰포트와 렌더링 타이밍에 민감합니다. 페이지가 안정화된 뒤 스캔하고, 결과는 샘플링 검수 루틴으로 관리하세요.",
        bullets: [
          "동적 페이지는 로드 후 대기 시간을 확보하고 스캔",
          "리스트 영역을 화면에 배치한 뒤 가격/텍스트를 추출",
          "중복 데이터는 CSV 정규화 파이프라인으로 후처리",
          "신뢰도(confidence) 임계값을 운영 환경별로 튜닝",
        ],
      },
      {
        title: "3) 정책/컴플라이언스 기본선",
        body: "도구를 운영 서비스로 전환할 때는 정책 문서와 사용자 고지가 중요합니다. 데이터 처리 방식, 광고 고지, 문의 채널을 명확히 공개하세요.",
        bullets: [
          "개인정보처리방침과 이용약관을 사이트에서 쉽게 접근 가능하게 유지",
          "광고 쿠키 사용 가능성 및 맞춤 광고 해제 경로 고지",
          "서비스 운영자 연락처와 응답 정책 명시",
          "페이지별 콘텐츠 목적과 업데이트 주기 공개",
        ],
      },
      {
        title: "4) 비용과 성능 균형 맞추기",
        body: "무조건 많은 페이지를 스캔하기보다, 비즈니스 가치가 높은 URL을 우선순위로 관리하면 비용 대비 성과가 좋아집니다.",
        bullets: [
          "핵심 URL 그룹 우선 스캔 후 롱테일 확장",
          "변동성이 낮은 페이지는 재수집 주기를 길게 설정",
          "실패율이 높은 도메인은 분리 모니터링",
          "결과 사용 부서 기준으로 출력 컬럼을 최소화",
        ],
      },
    ],
    ctaGuide: "가이드 보기",
    ctaApp: "앱 실행",
  },
  en: {
    title: "Practical Resources: Web Scraping Operations Guide",
    description:
      "A practical guide for turning data extraction into reliable operations, covering planning, quality control, compliance, and cost efficiency.",
    updatedLabel: `Last updated: ${UPDATED_AT}`,
    sections: [
      {
        title: "1) Pre-launch checklist",
        body: "Define your extraction objective before scaling. Clear scope reduces crawl waste and keeps your pipeline maintainable.",
        bullets: [
          "Target KPI: must-have fields (price, image, text)",
          "Cadence: real-time vs daily vs weekly scheduling",
          "Quality thresholds: acceptable missing/duplicate rates",
          "Failure policy: retries, queueing, and alerts",
        ],
      },
      {
        title: "2) Scanning practices for higher quality",
        body: "Screenshot-first extraction is sensitive to viewport and render timing. Stabilize the page state first, then run extraction.",
        bullets: [
          "Allow dynamic pages to settle before scanning",
          "Align viewport to the list region for price/text detection",
          "Normalize duplicates in post-processing with CSV pipelines",
          "Tune confidence thresholds per use case",
        ],
      },
      {
        title: "3) Compliance and trust basics",
        body: "If you plan to monetize and scale, operational transparency matters. Keep policy pages and contact channels visible.",
        bullets: [
          "Publish accessible privacy policy and terms",
          "Disclose ad cookie usage and opt-out paths",
          "Provide operator contact and response expectations",
          "Keep content goals and update cadence explicit",
        ],
      },
      {
        title: "4) Balancing cost and performance",
        body: "Not every URL has equal value. Prioritized crawling usually outperforms broad crawling in cost-to-value ratio.",
        bullets: [
          "Start with high-impact URL clusters first",
          "Use longer refresh windows on low-volatility pages",
          "Track high-failure domains separately",
          "Minimize export columns based on downstream needs",
        ],
      },
    ],
    ctaGuide: "Read Guide",
    ctaApp: "Open App",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromHeaders(await headers());
  const isKo = locale === "ko";

  const title = isKo ? `${SITE_NAME} 리소스 | 운영 가이드` : `${SITE_NAME} Resources | Operations Guide`;
  const description = isKo
    ? "스크래핑 자동화 운영을 위한 체크리스트, 품질 개선, 정책 준수, 비용 최적화 전략 모음."
    : "Operational resources for scraping automation: planning, quality, compliance, and cost optimization.";

  return {
    title,
    description,
    alternates: {
      canonical: "/resources",
      languages: {
        "ko-KR": "/resources",
        "en-US": "/resources",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: SITE_NAME,
      url: "/resources",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ResourcesPage() {
  const locale = detectLocaleFromHeaders(await headers());
  const t = CONTENT[locale];

  return (
    <MarketingFrame locale={locale} currentPage="resources" title={t.title} description={t.description}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{t.updatedLabel}</p>
      </section>

      <section className="grid gap-4">
        {t.sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{section.body}</p>
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
        <div className="flex flex-wrap gap-2">
          <Link
            href="/guide"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.ctaGuide}
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            {t.ctaApp}
          </Link>
        </div>
      </section>
    </MarketingFrame>
  );
}
