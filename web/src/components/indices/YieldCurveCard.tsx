import { classifyYieldCurve } from "@/lib/indices/constants";
import { useT } from "@/lib/i18n/LanguageProvider";

export function YieldCurveCard({ tenYear, twoYear, noDataLabel }: { tenYear: number | null; twoYear: number | null; noDataLabel: string }) {
  const t = useT();

  if (tenYear == null || twoYear == null) {
    return (
      <div className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">{t("indices.yieldCurve.marketLabel")} 10Y-2Y</span>
          <span className="text-[var(--text-xs)] text-[var(--text-muted)]">{t("indices.yieldCurve.source")}</span>
        </div>
        <div className="font-mono text-[var(--text-xl)] font-semibold text-[var(--text-primary)]">{noDataLabel}</div>
      </div>
    );
  }

  const bp = Math.round((tenYear - twoYear) * 100);
  const band = classifyYieldCurve(bp);
  const inverted = bp < 0;

  return (
    <div
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] px-5 py-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">{t("indices.yieldCurve.marketLabel")} 10Y-2Y</span>
        <span className="text-[var(--text-xs)] text-[var(--text-muted)]">{t("indices.yieldCurve.source")}</span>
      </div>
      <div className="font-mono text-[var(--text-xl)] font-semibold text-[var(--text-primary)]">
        {bp >= 0 ? "+" : ""}
        {bp}bp
      </div>
      <span
        className="w-fit rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[var(--text-xs)] font-semibold"
        style={{ background: `var(${band.bg})`, color: `var(${band.fg})` }}
      >
        {t(band.labelKey)}
        {inverted ? t("indices.yieldCurve.inverted") : ""}
      </span>
    </div>
  );
}
