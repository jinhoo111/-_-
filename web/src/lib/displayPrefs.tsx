"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Global display preferences (up/down arrow colors + display currency). Device-level
// preferences, persisted in localStorage — same pattern as theme (rh_theme) and language
// (rh_lang), NOT synced account data.
//
// Up/down colors: the app's default is the Korean convention (red=up / blue=down) via the
// CSS vars `--color-up` / `--color-down`. Overriding those two vars on <html> re-colors the
// WHOLE app (portfolio, quotes, indices, flow, monitor) without touching any component.
export type UpDownScheme = "kr" | "western" | "blue" | "green";
export type CurrencyCode = "USD" | "KRW" | "JPY" | "EUR" | "CNY";

export const CURRENCIES: { code: CurrencyCode; symbol: string; labelKey: string }[] = [
  { code: "USD", symbol: "$", labelKey: "prefs.currency.usd" },
  { code: "KRW", symbol: "₩", labelKey: "prefs.currency.krw" },
  { code: "EUR", symbol: "€", labelKey: "prefs.currency.eur" },
  { code: "JPY", symbol: "¥", labelKey: "prefs.currency.jpy" },
  { code: "CNY", symbol: "CN¥", labelKey: "prefs.currency.cny" },
];

export const UPDOWN_SCHEMES: { key: UpDownScheme; labelKey: string }[] = [
  { key: "kr", labelKey: "prefs.updown.kr" },
  { key: "western", labelKey: "prefs.updown.western" },
  { key: "blue", labelKey: "prefs.updown.blue" },
  { key: "green", labelKey: "prefs.updown.green" },
];

// "kr" and "western" map to the theme's convention tokens (data-price-convention
// attribute). "blue"/"green" are custom schemes applied as explicit var overrides.
const SCHEME_COLORS: Record<UpDownScheme, { up: string | null; down: string | null }> = {
  kr: { up: null, down: null },
  western: { up: null, down: null },
  blue: { up: "#2563eb", down: "#dc2626" },
  green: { up: "#16a34a", down: "#2563eb" },
};

interface DisplayPrefsValue {
  updown: UpDownScheme;
  currency: CurrencyCode;
  setUpdown: (s: UpDownScheme) => void;
  setCurrency: (c: CurrencyCode) => void;
}

const DisplayPrefsContext = createContext<DisplayPrefsValue | null>(null);

export function DisplayPrefsProvider({ children }: { children: ReactNode }) {
  const [updown, setUpdownState] = useState<UpDownScheme>("kr");
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  // Hydrate from localStorage on mount (mirrors LanguageProvider).
  useEffect(() => {
    try {
      const u = localStorage.getItem("rh_updown") as UpDownScheme | null;
      if (u && SCHEME_COLORS[u]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUpdownState(u);
      }
      const c = localStorage.getItem("rh_currency") as CurrencyCode | null;
      if (c && CURRENCIES.some((x) => x.code === c)) {
        setCurrencyState(c);
      }
    } catch {
      // storage unavailable
    }
  }, []);

  // Apply the up/down color scheme: set the data-price-convention attribute for
  // the theme-backed kr/western conventions, and override CSS vars for custom ones.
  useEffect(() => {
    const { up, down } = SCHEME_COLORS[updown];
    const el = document.documentElement;
    // Theme-backed conventions
    if (updown === "western") el.setAttribute("data-price-convention", "western");
    else el.removeAttribute("data-price-convention");
    // Custom schemes: explicit var overrides
    if (up) el.style.setProperty("--color-up", up);
    else el.style.removeProperty("--color-up");
    if (down) el.style.setProperty("--color-down", down);
    else el.style.removeProperty("--color-down");
  }, [updown]);

  function setUpdown(s: UpDownScheme) {
    setUpdownState(s);
    try {
      localStorage.setItem("rh_updown", s);
    } catch {
      // ignore
    }
  }
  function setCurrency(c: CurrencyCode) {
    setCurrencyState(c);
    try {
      localStorage.setItem("rh_currency", c);
    } catch {
      // ignore
    }
  }

  return <DisplayPrefsContext.Provider value={{ updown, currency, setUpdown, setCurrency }}>{children}</DisplayPrefsContext.Provider>;
}

export function useDisplayPrefs() {
  const ctx = useContext(DisplayPrefsContext);
  if (!ctx) throw new Error("useDisplayPrefs must be used within DisplayPrefsProvider");
  return ctx;
}
