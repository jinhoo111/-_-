"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export function AppFooter() {
  const t = useT();

  return (
    <footer
      className="mx-auto mt-8 w-full max-w-[1080px] px-6 py-8 text-[var(--text-xs)] leading-[1.65] text-[var(--text-muted)]"
      style={{ borderTop: "1px solid var(--border-default)" }}
    >
      <div>
        <strong className="text-[var(--text-secondary)]">{t("footer.disclaimer.title")}</strong> · {t("footer.disclaimer.body")}
      </div>
      <div className="mt-1.5">{t("footer.sources")}</div>
    </footer>
  );
}
