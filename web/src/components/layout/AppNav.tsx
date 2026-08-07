"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useIsAdmin } from "@/lib/admin/useIsAdmin";

const NAV_ITEMS = [
  { href: "/portfolio", key: "nav.portfolio" as const },
  { href: "/indices", key: "nav.indices" as const },
  { href: "/journal", key: "nav.journal" as const },
  { href: "/news", key: "nav.news" as const },
  { href: "/research", key: "nav.research" as const },
  { href: "/flow", key: "nav.flow" as const },
  { href: "/monitor", key: "nav.monitor" as const },
];

const BOTTOM_NAV_ITEMS = [
  { href: "/portfolio", key: "nav.portfolio" as const },
  { href: "/indices", key: "nav.indices" as const },
  { href: "/news", key: "nav.news" as const },
  { href: "/flow", key: "nav.flow" as const },
  { href: "/journal", key: "nav.journal" as const },
];

export function AppNav() {
  const t = useT();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const navItems = isAdmin ? [...NAV_ITEMS, { href: "/security", key: "nav.security" as const }] : NAV_ITEMS;

  return (
    <>
      <nav className="mx-auto flex h-[68px] max-w-[1080px] items-center gap-6 px-6">
        <Link href="/portfolio" className="shrink-0 font-display text-[22px] font-bold tracking-[var(--tracking-display)] text-[var(--text-primary)]">
          RichHub<span className="text-[var(--accent)]">.</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`h-10 shrink-0 rounded-[var(--radius-pill)] px-4 text-[var(--text-base)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  active
                    ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label={t("nav.settings")}
            title={t("nav.settings")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-base)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="h-10 rounded-[var(--radius-pill)] px-3 text-[var(--text-sm)] font-medium text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)]"
            >
              {t("nav.logout")}
            </button>
          </form>
        </div>
      </nav>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--border-default)] bg-[var(--surface-1)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 truncate px-1 py-2 text-center text-[var(--text-2xs)] whitespace-nowrap ${
                active ? "font-semibold text-[var(--accent)]" : "text-[var(--text-tertiary)]"
              }`}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
