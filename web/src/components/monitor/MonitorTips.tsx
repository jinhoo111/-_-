"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";

const DISMISS_KEY = "rh_monitor_tips_dismissed";

// Dismissible onboarding tips card, ported from legacy's HELP_CONTENT.monitor.tips.
export function MonitorTips() {
  const t = useT();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  const tips = [t("monitor.tips.kr"), t("monitor.tips.us"), t("monitor.tips.radar"), t("monitor.tips.memo")];

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("monitor.tips.title")}</p>
        <button onClick={dismiss} className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
          {t("monitor.tips.dismiss")}
        </button>
      </div>
      <ul className="flex flex-col gap-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        {tips.map((tip) => (
          <li key={tip}>• {tip}</li>
        ))}
      </ul>
    </Card>
  );
}
