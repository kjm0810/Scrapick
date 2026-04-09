import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export interface SiteHeaderNavItem {
  key: string;
  href: string;
  label: string;
  isActive?: boolean;
}

interface SiteHeaderProps {
  badge: string;
  brandTitle?: string;
  logoAlt?: string;
  supportText?: string;
  navItems?: SiteHeaderNavItem[];
  rightContent?: ReactNode;
}

export default function SiteHeader({
  badge,
  brandTitle = "scrapicker",
  logoAlt = "scrapicker logo",
  supportText,
  navItems = [],
  rightContent,
}: SiteHeaderProps) {
  return (
    <header className="border-b border-teal-100/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-tight text-slate-900 sm:text-[0px]" style={{display:'none'}}>{brandTitle}</p>
              <div className="logo"></div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">{badge}</p>
            </div>
          </Link>
          {rightContent}
        </div>

        {supportText ? <p className="text-sm text-slate-600">{supportText}</p> : null}

        {navItems.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  item.isActive
                    ? "border-teal-500 bg-teal-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
