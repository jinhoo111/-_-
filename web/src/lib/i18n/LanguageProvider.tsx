"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { t as translate, type Lang } from "./messages";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "rh_lang";

function detectLang(): Lang {
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) return "en";
  return "ko";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    // One-time sync from client-only localStorage after mount, so SSR/hydration
    // starts from the "ko" default and only switches once storage is readable.
    const stored = localStorage.getItem(STORAGE_KEY);
    const resolved = stored === "ko" || stored === "en" ? stored : detectLang();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(resolved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

export function useT() {
  const { lang } = useLang();
  return useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
}
