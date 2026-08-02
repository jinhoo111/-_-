"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export function AppFooter() {
  const t = useT();

  return (
    <footer
      className="mx-auto mt-8 w-full max-w-4xl px-2 py-6 text-[var(--text-xs)] leading-[1.65] text-[var(--color-text-tertiary)] sm:px-4"
      style={{ borderTop: "1px solid var(--color-border-input)" }}
    >
      <div>
        <strong className="text-[var(--color-text-secondary)]">{t("footer.disclaimer.title")}</strong> · {t("footer.disclaimer.body")}
      </div>
      <div className="mt-1.5">{t("footer.sources")}</div>
    </footer>
  );
}
