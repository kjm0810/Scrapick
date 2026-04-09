import Link from "next/link";
import type { ReactNode } from "react";

import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";
import type { SiteLocale } from "@/lib/locale";

type MarketingPage = "landing" | "guide" | "faq";

interface MarketingFrameProps {
  locale: SiteLocale;
  currentPage: MarketingPage;
  title: string;
  description: string;
  children: ReactNode;
}

const UI_TEXT = {
  ko: {
    badge: "AI Visual Web Scraper",
    home: "앱",
    landing: "랜딩",
    guide: "가이드",
    faq: "FAQ",
    homeCta: "스크래퍼 열기",
    footerTitle: "문의 및 제휴",
    footerDescription: "서비스 관련 문의는 아래 이메일로 연락 주세요.",
    footerEmailLabel: "문의 이메일",
    footerCopyright: "All rights reserved.",
  },
  en: {
    badge: "AI Visual Web Scraper",
    home: "App",
    landing: "Landing",
    guide: "Guide",
    faq: "FAQ",
    homeCta: "Open Scraper",
    footerTitle: "Contact",
    footerDescription: "For support or partnership inquiries, reach out by email.",
    footerEmailLabel: "Contact Email",
    footerCopyright: "All rights reserved.",
  },
} as const;

export default function MarketingFrame({
  locale,
  currentPage,
  title,
  description,
  children,
}: MarketingFrameProps) {
  const t = UI_TEXT[locale];
  const navItems: SiteHeaderNavItem[] = [
    { key: "home", href: "/", label: t.home, isActive: false },
    { key: "landing", href: "/landing", label: t.landing, isActive: currentPage === "landing" },
    { key: "guide", href: "/guide", label: t.guide, isActive: currentPage === "guide" },
    { key: "faq", href: "/faq", label: t.faq, isActive: currentPage === "faq" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d8f2ea_0%,_#f8fafc_50%,_#eff6ff_100%)] text-slate-900">
      <SiteHeader
        badge={t.badge}
        brandTitle="scrapicker"
        logoAlt="scrapicker logo"
        navItems={navItems}
        rightContent={
          <Link
            href="/"
            className="inline-flex w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-700"
          >
            {t.homeCta}
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg backdrop-blur sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>
        </section>
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-100">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 sm:py-6">
          <div>
            <h2 className="text-sm font-semibold">{t.footerTitle}</h2>
            <p className="mt-1 text-sm text-slate-300">{t.footerDescription}</p>
          </div>
          <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-200">
            <span>{t.footerEmailLabel}:</span>
            <a className="font-medium text-teal-300 underline-offset-2 hover:underline" href="mailto:kimjungmin988@gmail.com">
              kimjungmin988@gmail.com
            </a>
          </p>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} scrapicker. {t.footerCopyright}</p>
        </div>
      </footer>
    </div>
  );
}
