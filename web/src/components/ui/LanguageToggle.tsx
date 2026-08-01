"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <span
      className={`inline-flex overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border-input)] ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("ko")}
        aria-pressed={lang === "ko"}
        className={`px-2 py-1 text-[var(--text-sm)] ${
          lang === "ko" ? "bg-[var(--color-accent-primary)] text-white" : "text-[var(--color-text-secondary)]"
        }`}
      >
        KO
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-2 py-1 text-[var(--text-sm)] ${
          lang === "en" ? "bg-[var(--color-accent-primary)] text-white" : "text-[var(--color-text-secondary)]"
        }`}
      >
        EN
      </button>
    </span>
  );
}
