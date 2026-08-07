"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <span
      className={`inline-flex overflow-hidden rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--surface-2)] p-0.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("ko")}
        aria-pressed={lang === "ko"}
        className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-xs)] font-semibold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
          lang === "ko" ? "bg-[var(--surface-0)] text-[var(--accent)]" : "text-[var(--text-secondary)]"
        }`}
      >
        KO
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-xs)] font-semibold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
          lang === "en" ? "bg-[var(--surface-0)] text-[var(--accent)]" : "text-[var(--text-secondary)]"
        }`}
      >
        EN
      </button>
    </span>
  );
}
