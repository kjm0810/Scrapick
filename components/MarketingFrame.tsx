import Link from "next/link";
import type { ReactNode } from "react";

import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import type { SiteLocale } from "@/lib/locale";

type MarketingPage = "landing" | "guide" | "faq" | "resources" | "about";

interface MarketingFrameProps {
  locale: SiteLocale;
  currentPage?: MarketingPage;
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
    resources: "리소스",
    about: "소개",
    homeCta: "스크래퍼 열기",
  },
  en: {
    badge: "AI Visual Web Scraper",
    home: "App",
    landing: "Landing",
    guide: "Guide",
    faq: "FAQ",
    resources: "Resources",
    about: "About",
    homeCta: "Open Scraper",
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
    { key: "resources", href: "/resources", label: t.resources, isActive: currentPage === "resources" },
    { key: "about", href: "/about", label: t.about, isActive: currentPage === "about" },
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

      <SiteFooter locale={locale} />
    </div>
  );
}
