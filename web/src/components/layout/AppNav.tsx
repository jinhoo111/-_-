"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
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

export function AppNav() {
  const t = useT();
  const isAdmin = useIsAdmin();
  const navItems = isAdmin ? [...NAV_ITEMS, { href: "/security", key: "nav.security" as const }] : NAV_ITEMS;

  return (
    <nav className="mx-auto flex max-w-4xl items-center gap-1 px-4 py-2">
      <span className="mr-4 text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">RichHub</span>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-[var(--radius-control)] px-3 py-1.5 text-[var(--text-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
        >
          {t(item.key)}
        </Link>
      ))}
      <LanguageToggle className="ml-4" />
      <form action="/auth/signout" method="post" className="ml-auto">
        <button
          type="submit"
          className="rounded-[var(--radius-control)] px-3 py-1.5 text-[var(--text-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-overlay)]"
        >
          {t("nav.logout")}
        </button>
      </form>
    </nav>
  );
}
