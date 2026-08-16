"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Tabs } from "@/components/ui/Tabs";
import { useDisplayPrefs, CURRENCIES, type CurrencyCode } from "@/lib/displayPrefs";
import { useRichbuildMarket } from "@/lib/richbuild/MarketProvider";
import type { Market } from "@/lib/richbuild/types";

const BOTTOM_ITEMS = [
  { href: "/richbuild", label: "Home" },
  { href: "/richbuild#ranking", label: "Ranking" },
  { href: "/richbuild#holdings", label: "Holdings" },
];

// RichBuild's own nav — deliberately separate from the dashboard's AppNav (spec §3:
// this is a 5-screen guest-first product, not another tab in the big dashboard).
export function RichBuildNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const { market, setMarket } = useRichbuildMarket();
  const { currency, setCurrency } = useDisplayPrefs();

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

  return (
    <>
      <nav className="mx-auto flex h-[68px] max-w-[1188px] items-center justify-between px-[1.65rem]">
        <Link
          href="/richbuild"
          className="font-display text-[22px] font-bold tracking-[var(--tracking-display)] text-[var(--text-primary)]"
        >
          Rich<span className="text-[var(--accent)]">Build</span>
        </Link>
        <div className="flex items-center gap-3">
          <Tabs
            size="sm"
            items={[
              { id: "kr", label: "KR" },
              { id: "us", label: "US" },
            ]}
            value={market}
            onChange={(v) => setMarket(v as Market)}
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            aria-label="Display currency"
            className="h-9 shrink-0 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-[var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus:border-[var(--border-focus)] focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          {signedIn ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Logout
              </button>
            </form>
          ) : (
            <Link href="/richbuild/login" className="text-[var(--text-sm)] font-semibold text-[var(--accent)]">
              Login
            </Link>
          )}
        </div>
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--border-default)] bg-[var(--surface-1)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {BOTTOM_ITEMS.map((item) => {
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
