"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";

// Dismissible investment-disclaimer banner, ported from legacy #disclaimer-banner.
// The same copy also lives in the footer; this top strip is dismissible per device.
const DISMISS_KEY = "disclaimer_dismissed";

export function DisclaimerBanner() {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // One-time client-only hydration (mirrors LanguageProvider).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl items-start gap-3 bg-[var(--color-bg-overlay)] px-2 py-2 text-[var(--text-xs)] text-[var(--color-text-tertiary)] sm:px-4">
      <span className="flex-1 leading-[1.6]">
        <b className="text-[var(--color-text-secondary)]">{t("footer.disclaimer.title")}</b> · {t("footer.disclaimer.body")}
      </span>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="cursor-pointer shrink-0 underline"
      >
        {t("notice.dismiss")}
      </button>
    </div>
  );
}
