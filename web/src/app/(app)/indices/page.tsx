"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useQuotes } from "@/lib/queries/useQuotes";
import { useCrypto, useFxRates } from "@/lib/queries/useIndices";
import {
  SECTION_DEFAULT,
  KR_INDICES,
  US_INDICES,
  VIX_INDEX,
  FUTURES,
  COMMODITIES,
  CRYPTO,
  FX_PAIRS,
  YIELD_CURVE_SYMBOLS,
  INDEX_LINK_MAP,
  yahooSymbolsForSections,
  type SectionKey,
  type IndexItem,
} from "@/lib/indices/constants";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { IndexCard } from "@/components/indices/IndexCard";
import { YieldCurveCard } from "@/components/indices/YieldCurveCard";
import { IndexGrid } from "@/components/indices/IndexGrid";
import { IndicesSettingsPanel } from "@/components/indices/IndicesSettingsPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChip } from "@/components/ui/FilterChip";
import { Tabs } from "@/components/ui/Tabs";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { IndexCardStatus } from "@/components/indices/IndexCard";

/** Deterministic synthetic intraday series for cards without a real series. */
function syntheticSeries(changePercent: number | null, n = 10): number[] {
  const drift = (changePercent ?? 0) / 100;
  const base = 50;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wobble = Math.sin(i * 1.7) * 3 + Math.cos(i * 0.9) * 2;
    out.push(base + drift * 120 * t + wobble);
  }
  return out;
}

const SECTION_CHIPS: { key: SectionKey; labelKey: string }[] = [
  { key: "kr", labelKey: "indices.section.kr" },
  { key: "us", labelKey: "indices.section.us" },
  { key: "vix", labelKey: "indices.section.vix" },
  { key: "rates", labelKey: "indices.section.rates" },
  { key: "futures", labelKey: "indices.section.futures" },
  { key: "crypto", labelKey: "indices.section.crypto" },
  { key: "fx", labelKey: "indices.section.fx" },
  { key: "commodities", labelKey: "indices.section.commodities" },
];

function fmtFx(currency: string, value: number | null): string | null {
  if (value == null) return null;
  return currency === "KRW" ? Math.round(value).toLocaleString() : value.toFixed(4);
}

const LOAD_TIME_STORAGE_KEY = "indices.loadTimeHistory";
const LOAD_TIME_HISTORY_SIZE = 5;

function loadHistory(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOAD_TIME_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function saveHistory(history: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOAD_TIME_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export default function IndicesPage() {
  const t = useT();
  const { data: userData, isLoading } = useUserData();
  const updateUserData = useUpdateUserData();

  const settings: Record<SectionKey, boolean> = useMemo(
    () => ({ ...SECTION_DEFAULT, ...(userData?.indices_settings ?? {}) }),
    [userData],
  );

  // Quick multi-select category chips (a fast version of the settings panel).
  // Empty = show all enabled sections; otherwise only the selected ones.
  const [activeChips, setActiveChips] = useState<SectionKey[]>([]);
  const enabledSections = SECTION_CHIPS.filter((c) => settings[c.key]);
  const visibleSections = activeChips.length ? enabledSections.filter((c) => activeChips.includes(c.key)) : enabledSections;

  // Sparkline range selector (mockup: 1W/1M/3M/1Y tabs).
  const [ixRange, setIxRange] = useState<string>("1M");
  const ixRangePts: Record<string, number> = { "1W": 7, "1M": 10, "3M": 12, "1Y": 14 };

  const yahooSymbols = useMemo(() => yahooSymbolsForSections(settings), [settings]);
  const {
    data: quotes,
    isFetching: quotesFetching,
    isError: quotesError,
    refetch: refetchQuotes,
  } = useQuotes(yahooSymbols);
  const {
    data: crypto,
    isFetching: cryptoFetching,
    isError: cryptoErrorFlag,
    refetch: refetchCrypto,
  } = useCrypto(settings.crypto);
  const {
    data: fxRates,
    isFetching: fxFetching,
    isError: fxErrorFlag,
    refetch: refetchFx,
  } = useFxRates(settings.fx);

  const refreshing = quotesFetching || cryptoFetching || fxFetching;

  // Rolling average of the last few refresh durations, mirroring legacy's
  // "소요시간 : 평균 약 N초" header indicator. Persisted so it survives reloads.
  const historyRef = useRef<number[]>([]);
  const refreshStartRef = useRef<number | null>(null);
  const [avgLoadSeconds, setAvgLoadSeconds] = useState<number | null>(null);
  const wasRefreshingRef = useRef(false);

  useEffect(() => {
    historyRef.current = loadHistory();
    if (historyRef.current.length > 0) {
      const avg = historyRef.current.reduce((a, b) => a + b, 0) / historyRef.current.length;
      setAvgLoadSeconds(avg);
    }
  }, []);

  useEffect(() => {
    if (refreshing && !wasRefreshingRef.current) {
      refreshStartRef.current = Date.now();
    } else if (!refreshing && wasRefreshingRef.current && refreshStartRef.current != null) {
      const elapsedSeconds = (Date.now() - refreshStartRef.current) / 1000;
      const next = [...historyRef.current, elapsedSeconds].slice(-LOAD_TIME_HISTORY_SIZE);
      historyRef.current = next;
      saveHistory(next);
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      setAvgLoadSeconds(avg);
      refreshStartRef.current = null;
    }
    wasRefreshingRef.current = refreshing;
  }, [refreshing]);

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  function handleToggleSection(key: SectionKey, value: boolean) {
    updateUserData({ indices_settings: { ...settings, [key]: value } });
  }

  function handleRefresh() {
    refetchQuotes();
    if (settings.crypto) refetchCrypto();
    if (settings.fx) refetchFx();
  }

  function quoteStatus(hasValue: boolean): IndexCardStatus {
    if (quotesFetching) return "loading";
    if (quotesError) return "error";
    if (!hasValue) return "empty";
    return "ok";
  }

  function renderItems(items: IndexItem[]) {
    return items.map((item) => {
      const q = quotes?.[item.symbol];
      const delta =
        q != null && q.changePercent != null
          ? (q.changePercent >= 0 ? "+" : "−") + Math.abs(q.changePercent * q.price / 100).toLocaleString(undefined, { maximumFractionDigits: q.price >= 100 ? 0 : 2 })
          : null;
      return (
        <IndexCard
          key={item.symbol}
          name={t(item.nameKey)}
          value={q ? q.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : null}
          changePercent={q?.changePercent ?? null}
          delta={delta}
          sparkData={q?.changePercent != null ? syntheticSeries(q.changePercent, ixRangePts[ixRange] ?? 10) : null}
          href={INDEX_LINK_MAP[item.symbol]}
          noDataLabel={t("indices.noData")}
          loadingLabel={t("indices.loading")}
          errorLabel={t("indices.error.quote")}
          status={quoteStatus(!!q)}
          state={q?.state}
          stateLabel={t}
        />
      );
    });
  }

  const cryptoStatus: IndexCardStatus = cryptoFetching ? "loading" : cryptoErrorFlag ? "error" : "ok";
  const fxStatus: IndexCardStatus = fxFetching ? "loading" : fxErrorFlag ? "error" : "ok";
  const fxRefRate = fxRates?.KRW ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.indices")}
        subtitle={t("indices.subtitle")}
        action={
          <div className="flex items-center gap-3">
            <Tabs
              items={["1W", "1M", "3M", "1Y"].map((k) => ({ id: k, label: t(`indices.range.${k.toLowerCase()}`) }))}
              value={ixRange}
              onChange={setIxRange}
              size="sm"
            />
            {avgLoadSeconds != null && (
              <span className="hidden text-[var(--text-xs)] text-[var(--text-muted)] sm:inline">
                {t(refreshing ? "indices.loadTime.refreshing" : "indices.loadTime.idle", { seconds: avgLoadSeconds.toFixed(1) })}
              </span>
            )}
            <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? t("indices.refreshing") : t("indices.refresh")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={t("indices.filter.all")}
          active={activeChips.length === 0}
          onClick={() => setActiveChips([])}
        />
        {enabledSections.map((c) => (
          <FilterChip
            key={c.key}
            label={t(c.labelKey)}
            active={activeChips.includes(c.key)}
            onClick={() =>
              setActiveChips((prev) =>
                prev.includes(c.key) ? prev.filter((x) => x !== c.key) : [...prev, c.key],
              )
            }
          />
        ))}
        <span className="ml-1 font-mono text-[var(--text-xs)] text-[var(--text-muted)]">
          {visibleSections.length} / {enabledSections.length}
        </span>
      </div>

      <IndicesSettingsPanel settings={settings} onToggle={handleToggleSection} />

      {settings.kr && visibleSections.some((c) => c.key === "kr") && (
        <IndexGrid title={t("indices.section.kr")} subtitle={t("indices.source.yahooDelayed")}>
          {renderItems(KR_INDICES)}
        </IndexGrid>
      )}
      {settings.us && visibleSections.some((c) => c.key === "us") && (
        <IndexGrid title={t("indices.section.us")} subtitle={t("indices.source.yahooDelayed")}>
          {renderItems(US_INDICES)}
        </IndexGrid>
      )}
      {settings.vix && visibleSections.some((c) => c.key === "vix") && (
        <IndexGrid title={t("indices.section.vix")} subtitle={t("indices.source.yahooDelayed")}>
          {renderItems(VIX_INDEX)}
        </IndexGrid>
      )}
      {settings.rates && visibleSections.some((c) => c.key === "rates") && (
        <IndexGrid title={t("indices.section.rates")} subtitle={t("indices.source.ratesNote")}>
          <YieldCurveCard
            tenYear={quotes?.[YIELD_CURVE_SYMBOLS.tenYear]?.price ?? null}
            twoYear={quotes?.[YIELD_CURVE_SYMBOLS.twoYear]?.price ?? null}
            noDataLabel={t("indices.noData")}
          />
        </IndexGrid>
      )}
      {settings.futures && visibleSections.some((c) => c.key === "futures") && (
        <IndexGrid title={t("indices.section.futures")} subtitle={t("indices.source.yahooDelayed")}>
          {renderItems(FUTURES)}
        </IndexGrid>
      )}
      {settings.crypto && visibleSections.some((c) => c.key === "crypto") && (
        <IndexGrid title={t("indices.section.crypto")} subtitle={t("indices.source.coingeckoLive")}>
          {CRYPTO.map(({ id, symbol }) => {
            const q = crypto?.[id];
            return (
              <IndexCard
                key={id}
                name={symbol}
                value={q ? "$" + q.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : null}
                changePercent={q?.changePercent ?? null}
                delta={q ? (q.changePercent != null && q.changePercent >= 0 ? "+" : "−") + "$" + (q.price * (q.changePercent ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 }) : null}
                sparkData={q ? syntheticSeries(q.changePercent, ixRangePts[ixRange] ?? 10) : null}
                href={INDEX_LINK_MAP[id]}
                noDataLabel={t("indices.noData")}
                loadingLabel={t("indices.loading")}
                errorLabel={t("indices.error.crypto")}
                status={cryptoStatus}
              />
            );
          })}
        </IndexGrid>
      )}
      {settings.fx && visibleSections.some((c) => c.key === "fx") && (
        <div className="flex flex-col gap-2">
          <IndexGrid title={t("indices.section.fx")} subtitle={t("indices.source.fxRef")}>
            {FX_PAIRS.map(({ pair, currency }) => (
              <IndexCard
                key={pair}
                name={pair}
                value={fmtFx(currency, fxRates?.[currency] ?? null)}
                changePercent={null}
                href={INDEX_LINK_MAP[currency]}
                noDataLabel={t("indices.noData")}
                loadingLabel={t("indices.loading")}
                errorLabel={t("indices.error.fx")}
                status={fxRefRate == null ? fxStatus : "ok"}
              />
            ))}
          </IndexGrid>
          {fxRefRate != null && (
            <div className="text-[var(--text-xs)] text-[var(--text-muted)]">
              {t("indices.fx.refRate", { rate: Math.round(fxRefRate).toLocaleString() })}
            </div>
          )}
        </div>
      )}
      {settings.commodities && visibleSections.some((c) => c.key === "commodities") && (
        <IndexGrid title={t("indices.section.commodities")} subtitle={t("indices.source.yahooDelayed")}>
          {renderItems(COMMODITIES)}
        </IndexGrid>
      )}
    </div>
  );
}
