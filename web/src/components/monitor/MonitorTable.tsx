"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { evalAlert } from "@/lib/monitor/constants";
import type { MonitorCompany } from "@/lib/types/userData";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--color-error-text)",
  warn: "var(--color-warning)",
  info: "var(--color-text-tertiary)",
};

export function MonitorTable({ companies, onSelect }: { companies: MonitorCompany[]; onSelect: (corpCode: string) => void }) {
  const t = useT();
  if (!companies.length) return <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.table.empty")}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[var(--text-table)]">
        <thead>
          <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            <th className="py-2 pr-2">{t("monitor.table.name")}</th>
            <th className="py-2 pr-2">{t("monitor.table.market")}</th>
            <th className="py-2 pr-2">{t("monitor.table.severity")}</th>
            <th className="py-2 pr-2">{t("monitor.table.signals")}</th>
            <th className="py-2 pr-2">{t("monitor.table.lastChecked")}</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((co) => {
            const eval_ = evalAlert(co);
            return (
              <tr
                key={co.corp_code}
                onClick={() => onSelect(co.corp_code)}
                className="cursor-pointer border-b border-[var(--color-border-faint)] hover:bg-[var(--color-bg-overlay)]"
              >
                <td className="py-2 pr-2 font-semibold text-[var(--color-text-primary)]">{co.corp_name}</td>
                <td className="py-2 pr-2 text-[var(--color-text-tertiary)]">{co.market}</td>
                <td className="py-2 pr-2 font-semibold" style={{ color: SEVERITY_COLOR[eval_.severity] }}>
                  {t(`monitor.severity.${eval_.severity}`)}
                </td>
                <td className="py-2 pr-2">{co.signals?.length ?? 0}</td>
                <td className="py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                  {co.lastCheckedAt ? new Date(co.lastCheckedAt).toLocaleString() : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
