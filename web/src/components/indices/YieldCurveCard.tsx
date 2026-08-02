import { classifyYieldCurve } from "@/lib/indices/constants";
import { useT } from "@/lib/i18n/LanguageProvider";

export function YieldCurveCard({ tenYear, twoYear, noDataLabel }: { tenYear: number | null; twoYear: number | null; noDataLabel: string }) {
  const t = useT();

  if (tenYear == null || twoYear == null) {
    return (
      <div className="flex flex-col gap-1 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("indices.yieldCurve.marketLabel")} 10Y-2Y</span>
          <span className="text-[var(--text-2xs)] text-[var(--color-text-disabled)]">{t("indices.yieldCurve.source")}</span>
        </div>
        <div className="font-mono text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{noDataLabel}</div>
      </div>
    );
  }

  const bp = Math.round((tenYear - twoYear) * 100);
  const band = classifyYieldCurve(bp);
  const inverted = bp < 0;

  return (
    <div
      className="flex flex-col gap-1 rounded-[10px] border-l-4 bg-[var(--color-bg-surface)] px-3 py-2.5"
      style={{ borderLeftColor: `var(${band.bar})`, borderTop: "1px solid var(--color-border-default)", borderRight: "1px solid var(--color-border-default)", borderBottom: "1px solid var(--color-border-default)" }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("indices.yieldCurve.marketLabel")} 10Y-2Y</span>
        <span className="text-[var(--text-2xs)] text-[var(--color-text-disabled)]">{t("indices.yieldCurve.source")}</span>
      </div>
      <div className="font-mono text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">
        {bp >= 0 ? "+" : ""}
        {bp}bp
      </div>
      <span
        className="w-fit rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-2xs)] font-semibold"
        style={{ background: `var(${band.bg})`, color: `var(${band.fg})` }}
      >
        {t(band.labelKey)}
        {inverted ? t("indices.yieldCurve.inverted") : ""}
      </span>
    </div>
  );
}
