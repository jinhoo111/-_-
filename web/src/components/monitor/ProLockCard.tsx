"use client";

import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";

export function ProLockCard({ label }: { label?: string }) {
  const t = useT();
  return (
    <Card className="flex flex-col items-center gap-1 py-6 text-center">
      <span className="text-[var(--text-lg)]">🔒</span>
      <p className="text-[var(--text-md)] font-medium text-[var(--color-text-secondary)]">{label ?? t("monitor.pro.locked")}</p>
      <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.pro.hint")}</p>
    </Card>
  );
}
