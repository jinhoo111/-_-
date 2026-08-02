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
      <nav className="mx-auto flex max-w-4xl items-center gap-2 px-2 py-2 sm:px-4">
        <span className="shrink-0 text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">RichHub</span>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-[var(--radius-control)] border-b-2 px-3 py-1.5 text-[var(--text-md)] transition-colors ${
                  active
                    ? "border-[var(--color-accent-primary)] font-semibold text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
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
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-[var(--radius-control)] px-3 py-1.5 text-[var(--text-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-overlay)]"
            >
              {t("nav.logout")}
            </button>
          </form>
        </div>
      </nav>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 truncate px-1 py-2 text-center text-[var(--text-2xs)] whitespace-nowrap ${
                active ? "font-semibold text-[var(--color-accent-primary)]" : "text-[var(--color-text-tertiary)]"
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
