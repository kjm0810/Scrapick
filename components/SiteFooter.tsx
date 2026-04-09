import Link from "next/link";

import type { SiteLocale } from "@/lib/locale";

interface SiteFooterProps {
  locale: SiteLocale;
}

const UI_TEXT = {
  ko: {
    quickLinksTitle: "바로가기",
    policyLinksTitle: "정책 문서",
    contactTitle: "문의 및 운영 정보",
    contactDescription:
      "서비스 관련 문의, 제휴, 데이터 협업 요청은 아래 이메일로 전달해 주세요. 평일 기준 1~2영업일 이내 답변합니다.",
    contactEmailLabel: "문의 이메일",
    adDisclosure:
      "광고 고지: 본 사이트는 Google AdSense 광고를 포함할 수 있으며, 광고 최적화를 위해 쿠키가 사용될 수 있습니다.",
    copyright: "All rights reserved.",
    links: {
      app: "앱",
      landing: "랜딩",
      guide: "가이드",
      faq: "FAQ",
      resources: "리소스",
      about: "소개",
      contact: "문의하기",
      privacy: "개인정보처리방침",
      terms: "이용약관",
    },
  },
  en: {
    quickLinksTitle: "Quick Links",
    policyLinksTitle: "Policies",
    contactTitle: "Contact and Operations",
    contactDescription:
      "For support, partnership, and data workflow inquiries, email us below. We usually respond within 1-2 business days.",
    contactEmailLabel: "Contact Email",
    adDisclosure:
      "Ad disclosure: This site may display Google AdSense ads and uses cookies for ad delivery and measurement.",
    copyright: "All rights reserved.",
    links: {
      app: "App",
      landing: "Landing",
      guide: "Guide",
      faq: "FAQ",
      resources: "Resources",
      about: "About",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  },
} as const;

const EMAIL = "kimjungmin988@gmail.com";

export default function SiteFooter({ locale }: SiteFooterProps) {
  const t = UI_TEXT[locale];
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:grid-cols-3 sm:px-6">
        <section className="sm:col-span-1">
          <h2 className="text-sm font-semibold">{t.contactTitle}</h2>
          <p className="mt-2 text-sm text-slate-300">{t.contactDescription}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-200">
            <span>{t.contactEmailLabel}:</span>
            <a className="font-medium text-teal-300 underline-offset-2 hover:underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold">{t.quickLinksTitle}</h2>
          <nav className="mt-2 grid gap-1 text-sm text-slate-200">
            <Link href="/" className="hover:text-white">
              {t.links.app}
            </Link>
            <Link href="/landing" className="hover:text-white">
              {t.links.landing}
            </Link>
            <Link href="/guide" className="hover:text-white">
              {t.links.guide}
            </Link>
            <Link href="/faq" className="hover:text-white">
              {t.links.faq}
            </Link>
            <Link href="/resources" className="hover:text-white">
              {t.links.resources}
            </Link>
            <Link href="/about" className="hover:text-white">
              {t.links.about}
            </Link>
            <Link href="/contact" className="hover:text-white">
              {t.links.contact}
            </Link>
          </nav>
        </section>

        <section>
          <h2 className="text-sm font-semibold">{t.policyLinksTitle}</h2>
          <nav className="mt-2 grid gap-1 text-sm text-slate-200">
            <Link href="/privacy" className="hover:text-white">
              {t.links.privacy}
            </Link>
            <Link href="/terms" className="hover:text-white">
              {t.links.terms}
            </Link>
          </nav>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{t.adDisclosure}</p>
        </section>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 text-xs text-slate-400 sm:px-6">
          © {year} scrapicker. {t.copyright}
        </div>
      </div>
    </footer>
  );
}
