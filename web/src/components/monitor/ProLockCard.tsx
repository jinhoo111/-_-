"use client";

import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";

// `previewRows` lets callers (radar/home teaser usage) pass 1-2 example signal strings to
// render above the lock overlay, mirroring legacy's _proLockCard sell rows
// ("🔴 LG전자 대규모 시설투자...", "🟠 키움증권 자기주식 취득...").
export function ProLockCard({ label, previewRows }: { label?: string; previewRows?: string[] }) {
  const t = useT();
  return (
    <Card className="flex flex-col items-center gap-1 py-6 text-center">
      {previewRows && previewRows.length > 0 && (
        <div className="mb-2 flex w-full flex-col gap-1 opacity-70 blur-[0.3px]">
          {previewRows.map((row) => (
            <p key={row} className="text-left text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              {row}
            </p>
          ))}
        </div>
      )}
      <span className="text-[var(--text-lg)]">🔒</span>
      <p className="text-[var(--text-md)] font-medium text-[var(--color-text-secondary)]">{label ?? t("monitor.pro.locked")}</p>
      <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.pro.hint")}</p>
    </Card>
  );
}
