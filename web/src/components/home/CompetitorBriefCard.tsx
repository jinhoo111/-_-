"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/lib/queries/useUserData";
import { useIsPro } from "@/lib/monitor/useIsPro";
import { SIGNAL_CATS, daysAgoYmd, evalAlert } from "@/lib/monitor/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProLockCard } from "@/components/monitor/ProLockCard";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/LanguageProvider";

// Ported from legacy renderCompetitorBrief: Pro-gated "이번 주 경쟁사 브리핑" card.
// Shows the most recent 7-day monitor signals; non-Pro users get a locked teaser.
interface BriefSignal {
  corp_name: string;
  category: string;
  report_nm: string;
  date: string;
  weight: string;
}

export function CompetitorBriefCard() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { data: userData } = useUserData();
  const isPro = useIsPro();

  const companies = useMemo(() => userData?.monitor_companies ?? [], [userData]);
  const hasAny = companies.some((co) => (co.signals || []).length > 0);

  const recent = useMemo<BriefSignal[]>(() => {
    const since7 = daysAgoYmd(7);
    const out: BriefSignal[] = [];
    for (const co of companies) {
      for (const s of co.signals || []) {
        if ((s.date || "") >= since7) {
          out.push({ corp_name: co.corp_name, category: s.category, report_nm: s.report_nm, date: s.date, weight: s.weight });
        }
      }
    }
    out.sort(
      (a, b) =>
        (b.weight === "high" ? 1 : 0) - (a.weight === "high" ? 1 : 0) ||
        (b.date || "").localeCompare(a.date || ""),
    );
    return out;
  }, [companies]);

  const alertCos = useMemo(() => companies.filter((co) => evalAlert(co).severity !== "info").length, [companies]);

  if (!userData || !hasAny) return null;

  if (!isPro) {
    const preview = recent.slice(0, 2).map((s) => `${s.weight === "high" ? "🔴" : "🟠"} ${s.corp_name} ${s.report_nm}`);
    return <ProLockCard label={t("home.competitor.locked")} previewRows={preview} />;
  }

  const rows = recent.slice(0, 3);
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">{t("home.competitor.title")}</span>
        <span className="rounded-full bg-[var(--color-accent-bg)] px-2 py-0.5 text-[var(--text-xs)] font-bold text-[var(--color-accent)]">
          {t("home.competitor.pro")}
        </span>
      </div>
      <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        {t("home.competitor.summary", { count: recent.length, alerts: alertCos })}
      </p>
      {rows.length ? (
        rows.map((s, i) => {
          const cat = (SIGNAL_CATS as Record<string, { labelKey: string; color: string }>)[s.category];
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5 text-[var(--text-sm)]">
              <span>{s.weight === "high" ? "🔴" : "🟠"}</span>
              <b className="text-[var(--color-text-primary)]">{s.corp_name}</b>
              {cat && (
                <span style={{ background: `${cat.color}1f`, color: cat.color }} className="rounded px-1.5 py-0.5 text-[var(--text-2xs)] font-bold">
                  {t(cat.labelKey)}
                </span>
              )}
              <span className="text-[var(--color-text-secondary)]">{s.report_nm}</span>
            </div>
          );
        })
      ) : (
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("home.competitor.none")}</p>
      )}
      <p className="text-[var(--text-sm)] text-[var(--color-warning-text)]">{t("home.aiDev")}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={() => router.push("/monitor")}>
          {t("home.competitor.radar")}
        </Button>
        <Button size="sm" onClick={() => toast.show(t("home.aiDev"), "default")}>
          {t("home.competitor.aiSummary")}
        </Button>
      </div>
    </Card>
  );
}
