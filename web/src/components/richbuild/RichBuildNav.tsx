"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { SettingsMenu } from "@/components/richbuild/SettingsMenu";

// RichBuild's own nav — deliberately separate from the dashboard's AppNav (spec §3:
// this is a 5-screen guest-first product, not another tab in the big dashboard).
export function RichBuildNav() {
  const t = useT();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setSignedIn(Boolean(data.user)))
      .catch(() => setSignedIn(false));
    // The nav lives in the persistent layout, so it doesn't remount on client-side
    // navigation from /richbuild/login back to /richbuild — without this subscription
    // it would keep showing "Login" right after a successful signup/login.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => subscription.unsubscribe();
  }, []);

  // Desktop-only page nav — the bottom tab bar is mobile-only (md:hidden), so without
  // this there was no way to move between pages at all on a desktop viewport.
  const topNavItems = [
    { href: "/richbuild", label: t("richbuild.nav.home") },
    { href: "/richbuild/add", label: t("richbuild.nav.addHolding") },
    { href: "/richbuild/help", label: t("richbuild.nav.help") },
  ];
  // Bottom nav's 3rd tab label depends on login state per the service plan mockup
  // (guest: 내종목/My Stocks, member: 내정보/My Info).
  const bottomItems = [
    { href: "/richbuild", label: t("richbuild.nav.bottomHome") },
    { href: "/richbuild#ranking", label: t("richbuild.nav.bottomRanking") },
    { href: "/richbuild#holdings", label: signedIn ? t("richbuild.nav.bottomMyInfo") : t("richbuild.nav.bottomMyStocks") },
  ];

  return (
    <>
      <nav className="mx-auto flex h-[68px] max-w-[1188px] items-center justify-between px-[1.65rem]">
        <Link
          href="/richbuild"
          className="font-display text-[22px] font-bold tracking-[var(--tracking-display)] text-[var(--text-primary)]"
        >
          Rich<span className="text-[var(--accent)]">Build</span>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {topNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 items-center rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.97] ${
                  active
                    ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)] shadow-[var(--shadow-glow-accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-1)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <SettingsMenu />
          {signedIn ? (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-[var(--text-primary)]"
              >
                {t("richbuild.nav.logout")}
              </button>
            </form>
          ) : (
            <Link href="/richbuild/login">
              <Button variant="primary" size="sm">
                {t("richbuild.nav.login")}
              </Button>
            </Link>
          )}
        </div>
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--border-default)] bg-[var(--surface-1)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {bottomItems.map((item) => {
          const active = pathname === "/richbuild" && item.href === "/richbuild";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-center text-[var(--text-2xs)] ${
                active ? "font-semibold text-[var(--accent)]" : "text-[var(--text-tertiary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
