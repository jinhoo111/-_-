"use client";

import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useMonitorStatus } from "@/lib/queries/useMonitor";

const DEMO_ROWS = [
  {
    corp_name: "삼성전자",
    stock_code: "005930",
    market: "KOSPI",
    price: "74,200",
    chg: "+1.2%",
    dir: "up" as const,
    disc: [
      { dt: "2025-06-23", nm: "[기재정정] 분기보고서 (2025.03)" },
      { dt: "2025-06-15", nm: "주요사항보고서 (유상증자결정)" },
    ],
  },
  {
    corp_name: "SK하이닉스",
    stock_code: "000660",
    market: "KOSPI",
    price: "189,500",
    chg: "-0.8%",
    dir: "down" as const,
    disc: [
      { dt: "2025-06-20", nm: "분기보고서 (2025.03)" },
      { dt: "2025-06-01", nm: "임원·주요주주 소유상황 보고서" },
    ],
  },
  {
    corp_name: "LG에너지솔루션",
    stock_code: "373220",
    market: "KOSPI",
    price: "302,000",
    chg: "+0.3%",
    dir: "up" as const,
    disc: [
      { dt: "2025-06-18", nm: "주요사항보고서 (전환사채 취득)" },
      { dt: "2025-06-10", nm: "기업설명회(IR) 개최 공고" },
    ],
  },
];

export function MonitorDemo() {
  const t = useT();
  const { data: status } = useMonitorStatus();
  const ready = status?.ready ?? false;

  return (
    <div className="flex flex-col gap-3">
      {status !== undefined && (
        <div
          className="flex items-center gap-2.5 rounded-[var(--radius-lg)] border p-3"
          style={
            ready
              ? { background: "var(--color-success-bg)", borderColor: "var(--color-success)" }
              : { background: "var(--color-warning-bg)", borderColor: "var(--color-warning-border)" }
          }
        >
          <span className="text-[1.1rem]">{ready ? "✅" : "🔑"}</span>
          <div>
            <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-strong)]">
              {ready ? t("monitor.banner.connected.title") : t("monitor.banner.pending.title")}
            </div>
            <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
              {ready ? t("monitor.banner.connected.body") : t("monitor.banner.pending.body")}
            </div>
          </div>
        </div>
      )}

      <p className="text-[var(--text-md)] text-[var(--color-text-tertiary)]">{t("monitor.demo.caption")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DEMO_ROWS.map((co) => (
          <Card key={co.corp_name} className="pointer-events-none select-none opacity-60 blur-[0.4px]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{co.corp_name}</p>
                <p className="mt-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                  {co.market} · {co.stock_code}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[var(--text-lg)] font-bold text-[var(--color-text-strong)]">
                  {co.price}
                  <span className="ml-0.5 text-[var(--text-xs)] font-normal">원</span>
                </p>
                <p
                  className="text-[var(--text-sm)] font-semibold"
                  style={{ color: co.dir === "up" ? "var(--color-up)" : "var(--color-down)" }}
                >
                  {co.chg}
                </p>
              </div>
            </div>

            <div className="mt-2.5 border-t border-[var(--color-border-faint)] pt-2">
              <div className="mb-1.5 text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                {t("monitor.disc.all")}
              </div>
              {co.disc.map((d) => (
                <div key={d.nm} className="flex items-start gap-2 border-b border-[var(--color-border-faint)] py-1 text-[var(--text-xs)] last:border-b-0">
                  <span className="flex-shrink-0 text-[var(--color-text-tertiary)]">{d.dt}</span>
                  <span className="text-[var(--color-text-strong)]">{d.nm}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-1.5">
              <div className="flex-1 rounded-[6px] bg-[var(--color-bg-overlay)] p-2 text-center">
                <div className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">{t("monitor.demo.holdings")}</div>
                <div className="mt-0.5 text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)]">{t("monitor.demo.collapsed")}</div>
              </div>
              <div className="flex-1 rounded-[6px] bg-[var(--color-bg-overlay)] p-2 text-center">
                <div className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">{t("monitor.demo.changes")}</div>
                <div className="mt-0.5 text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)]">{t("monitor.demo.collapsed")}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div
        className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed p-5 text-center text-[var(--text-sm)]"
        style={{ background: "var(--color-warning-bg)", borderColor: "var(--color-warning-text)", color: "var(--color-warning-text)" }}
      >
        {t("monitor.demo.footerNotice")}
      </div>
    </div>
  );
}
