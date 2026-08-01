"use client";

import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";

const DEMO_ROWS = [
  { name: "삼성전자", market: "KOSPI", note: "잠정실적 공시" },
  { name: "NVIDIA", market: "US", note: "8-K filing" },
  { name: "카카오", market: "KOSDAQ", note: "최대주주 변경" },
];

export function MonitorDemo() {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[var(--text-md)] text-[var(--color-text-tertiary)]">{t("monitor.demo.caption")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DEMO_ROWS.map((row) => (
          <Card key={row.name} className="pointer-events-none select-none blur-[2px]">
            <p className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{row.name}</p>
            <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{row.market}</p>
            <p className="mt-2 text-[var(--text-md)] text-[var(--color-text-secondary)]">{row.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
