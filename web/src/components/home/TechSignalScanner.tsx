"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useUserData } from "@/lib/queries/useUserData";
import { isKrTicker } from "@/lib/types/userData";
import {
  classifySignal,
  GRADE_META,
  isLeveragedETF,
  SIGNAL_ORDER,
  SIGNAL_THRESHOLDS,
  TECH_SIG,
  type TechGrade,
  type TechSignal,
} from "@/lib/market/technical";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";

// Ported from legacy scanTechSignals / renderTechCard. Eligible = held/buy/watch (not
// hidden) with a ticker. Results are cached per-day in localStorage under `tech_scan`.
const CACHE_KEY = "tech_scan";

interface ScannedResult {
  ticker: string;
  name: string;
  signals: TechSignal[];
  grade: TechGrade;
}

interface ApiResult {
  signals?: TechSignal[];
  rsi?: number | null;
  mfi?: number | null;
}

export function TechSignalScanner() {
  const t = useT();
  const { data: userData } = useUserData();
  const [results, setResults] = useState<Record<string, ScannedResult>>({});
  const [scanning, setScanning] = useState(false);

  const targets = useMemo(() => {
    const stocks = userData?.stocks ?? [];
    return stocks.filter((s) => !s.hidden && ["hold", "buy", "watch"].includes(s.status) && s.ticker?.trim());
  }, [userData]);

  // Restore the daily cache on mount (legacy `tech_scan` behavior). Intentional
  // client-side localStorage hydration, same pattern as LanguageProvider — disable
  // the v7 set-state-in-effect rule inline per repo convention.
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c && c.date === new Date().toISOString().slice(0, 10) && c.data) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResults(c.data);
      }
    } catch {
      // ignore malformed cache
    }
  }, []);

  const scanned = Object.keys(results).length > 0;
  const hit = useMemo(
    () =>
      Object.values(results)
        .filter((r) => r.signals.length > 0 || r.grade.grade !== "NONE")
        .sort((a, b) => {
          const amin = a.signals.length ? Math.min(...a.signals.map((s) => SIGNAL_ORDER[s.key] ?? 9)) : 9;
          const bmin = b.signals.length ? Math.min(...b.signals.map((s) => SIGNAL_ORDER[s.key] ?? 9)) : 9;
          return amin - bmin;
        }),
    [results],
  );

  async function handleScan() {
    if (scanning) return;
    if (!targets.length) {
      setResults({});
      return;
    }
    setScanning(true);
    try {
      const slice = targets.slice(0, 50);
      const symbols = slice.map((s) => s.ticker.trim().toUpperCase());
      const res = await fetch(`/api/market/technical?symbols=${encodeURIComponent(symbols.join(","))}`);
      const data = await res.json();
      const api: Record<string, ApiResult> = data?.results ?? {};
      const out: Record<string, ScannedResult> = {};
      for (const s of slice) {
        const d = api[s.ticker.trim().toUpperCase()];
        if (!d) continue;
        out[s.ticker] = {
          ticker: s.ticker,
          name: s.name,
          signals: d.signals ?? [],
          grade: classifySignal(d.rsi ?? null, d.mfi ?? null, isLeveragedETF(s.ticker, s.name)),
        };
      }
      setResults(out);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: new Date().toISOString().slice(0, 10), data: out }));
      } catch {
        // storage full / unavailable — ignore
      }
    } finally {
      setScanning(false);
    }
  }

  if (!targets.length) return null;

  let body: ReactNode;
  if (scanning && !scanned) {
    body = <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">⟳ {t("home.tech.analyzing")}</p>;
  } else if (!scanned) {
    body = <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("home.tech.idle")}</p>;
  } else if (!hit.length) {
    body = <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("home.tech.none")}</p>;
  } else {
    body = (
      <div className="flex flex-col">
        {hit.map((r) => (
          <div key={r.ticker} className="border-b border-[var(--color-border-default)] py-2 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[var(--color-bg-badge)] px-1 py-0.5 text-[var(--text-2xs)] font-bold text-[var(--color-text-placeholder)]">
                {isKrTicker(r.ticker) ? t("home.tech.mktKr") : t("home.tech.mktUs")}
              </span>
              <b className="text-[var(--text-sm)] text-[var(--color-text-primary)]">{r.name}</b>
              <span className="font-mono text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{r.ticker}</span>
              <span className="ml-auto flex flex-wrap items-center gap-3">
                {r.signals.map((s) => (
                  <SignalChip key={s.key} sig={s} />
                ))}
              </span>
            </div>
            <GradeBadge grade={r.grade} />
          </div>
        ))}
      </div>
    );
  }

  const presentKeys = [...new Set(hit.flatMap((r) => r.signals.map((s) => s.key)))]
    .filter((k) => TECH_SIG[k])
    .sort((a, b) => (SIGNAL_ORDER[a] ?? 9) - (SIGNAL_ORDER[b] ?? 9));

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">{t("home.tech.title")}</span>
        <Button size="sm" onClick={handleScan} disabled={scanning} className="font-semibold">
          {scanning ? `⟳ ${t("home.tech.scanning")}` : t("home.tech.scan")}
        </Button>
      </div>
      {body}
      {presentKeys.length > 0 && (
        <div className="mt-1 border-t border-[var(--color-border-default)] pt-2">
          <div className="mb-1 text-[var(--text-2xs)] font-bold text-[var(--color-text-secondary)]">{t("home.tech.legend")}</div>
          {presentKeys.map((k) => (
            <div key={k} className="text-[var(--text-2xs)] leading-[1.7] text-[var(--color-text-tertiary)]">
              <b className="text-[var(--color-text-secondary)]">{t(TECH_SIG[k].labelKey)}</b> — {t(TECH_SIG[k].basisKey)}
            </div>
          ))}
        </div>
      )}
      <p className="text-[var(--text-2xs)] leading-[1.6] text-[var(--color-text-tertiary)]">
        <b className="text-[var(--color-text-secondary)]">※</b> {t("home.tech.disclaimer")}
      </p>
    </Card>
  );
}

function SignalChip({ sig }: { sig: TechSignal }) {
  const t = useT();
  const meta = TECH_SIG[sig.key];
  const col = meta.tone === "up" ? "var(--color-success)" : meta.tone === "down" ? "var(--color-error)" : "var(--color-warning-text)";
  const bg = meta.tone === "up" ? "var(--color-success-bg)" : meta.tone === "down" ? "var(--color-error-bg)" : "var(--color-warning-bg)";
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span style={{ background: bg, color: col }} className="rounded-full px-2 py-0.5 text-[var(--text-xs)] font-bold">
        {t(meta.labelKey)}
      </span>
      <span className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">{t(sig.detailKey, sig.detailParams)}</span>
    </span>
  );
}

function GradeBadge({ grade }: { grade: TechGrade }) {
  const t = useT();
  const m = GRADE_META[grade.grade];
  if (!m) return null;
  const col = m.tone === "up" ? "var(--color-success)" : "var(--color-error)";
  const bg = m.tone === "up" ? "var(--color-success-bg)" : "var(--color-error-bg)";
  const th = grade.isLeveraged ? SIGNAL_THRESHOLDS.lev : SIGNAL_THRESHOLDS.normal;
  const over = grade.grade.includes("OVERBOUGHT");
  const dir = over ? t("home.tech.overbought") : t("home.tech.oversold");
  const rsiTh = over ? th.rsiOB : th.rsiOS;
  const mfiTh = over ? th.mfiOB : th.mfiOS;
  const rsiV = grade.rsi != null ? Math.round(grade.rsi * 100) / 100 : "—";
  const mfiV = grade.mfi != null ? grade.mfi : "—";
  return (
    <div className="mt-1.5">
      <span style={{ background: bg, color: col }} className="rounded-full px-2 py-0.5 text-[var(--text-xs)] font-bold">
        {m.emoji} {t(m.textKey)}
      </span>
      {grade.isLeveraged && (
        <div className="mt-0.5 text-[var(--text-2xs)] text-[var(--color-warning-text)]">{t("home.tech.levWarning")}</div>
      )}
      <div className="mt-0.5 text-[var(--text-2xs)] leading-[1.6] text-[var(--color-text-tertiary)]">
        {t("home.tech.rsiMfi", { rsi: String(rsiV), mfi: String(mfiV) })}
        <br />
        {t("home.tech.threshold", { dir, rsiTh: String(rsiTh), mfiTh: String(mfiTh) })}
      </div>
    </div>
  );
}
