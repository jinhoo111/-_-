"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useDisplayPrefs, CURRENCIES, type CurrencyCode } from "@/lib/displayPrefs";

// Language + currency + color scheme, grouped behind a gear icon next to Login/Logout
// — reuses the dashboard's existing LanguageToggle/ThemeToggle/displayPrefs instead of
// building parallel controls.
export function SettingsMenu() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { currency, setCurrency } = useDisplayPrefs();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("richbuild.nav.settings")}
        title={t("richbuild.nav.settings")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-[46px] right-0 z-30 flex w-56 flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-1)] p-3 shadow-[var(--shadow-raised)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">{t("richbuild.settings.language")}</span>
            <LanguageToggle />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">{t("richbuild.settings.currency")}</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              aria-label={t("richbuild.settings.currency")}
              className="h-8 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--surface-1)] px-2 text-[var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus:border-[var(--border-focus)] focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">{t("richbuild.settings.theme")}</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
