"use client";

import { useMemo, useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useQuotes } from "@/lib/queries/useQuotes";
import { useCrypto, useFxRates, useHistory } from "@/lib/queries/useIndices";
import {
  SECTION_DEFAULT,
  SECTIONS,
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
import { Modal } from "@/components/ui/Modal";
import { IndexCard } from "@/components/indices/IndexCard";
import { YieldCurveCard } from "@/components/indices/YieldCurveCard";
import { IndexGrid } from "@/components/indices/IndexGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChip } from "@/components/ui/FilterChip";
import { Tabs } from "@/components/ui/Tabs";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { IndexCardStatus } from "@/components/indices/IndexCard";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const enabledSections = SECTION_CHIPS.filter((c) => settings[c.key]);
  const visibleSections = activeChips.length ? enabledSections.filter((c) => activeChips.includes(c.key)) : enabledSections;

  // Sparkline range selector (mockup: 1W/1M/3M/1Y tabs) — drives the history fetch.
  const [ixRange, setIxRange] = useState<string>("1M");

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

  // Real daily close series per symbol for the sparklines (drives the range tabs).
  const { data: history } = useHistory(yahooSymbols, ixRange);

  const refreshing = quotesFetching || cryptoFetching || fxFetching;

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        {/* PageHeader */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-44 rounded-[var(--radius-pill)]" />
            <Skeleton className="h-9 w-24 rounded-[var(--radius-pill)]" />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-[var(--radius-pill)]" />
          ))}
        </div>

        {/* Settings panel */}
        <Skeleton className="h-12 w-full rounded-[var(--radius-xl)]" />

        {/* Index cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-2.5 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-1 h-9 w-full" />
            </div>
          ))}
        </div>
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
      const hist = history?.[item.symbol];
      // For 1D the "one day" change is today's move vs previous close (the quote);
      // for longer ranges (1W/1M/3M/1Y) compute the gain over the SELECTED period
      // from the real daily series, so 1W shows the one-week gain, etc.
      const is1D = ixRange === "1D";
      let changePercent = q?.changePercent ?? null;
      let deltaAbs: number | null = null;
      if (!is1D && hist && hist.length >= 2) {
        const first = hist[0];
        const last = hist[hist.length - 1];
        if (first && isFinite(first)) {
          changePercent = ((last - first) / first) * 100;
          deltaAbs = last - first;
        }
      }
      const fmtDelta = (v: number) =>
        (v >= 0 ? "+" : "−") + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: q && q.price >= 100 ? 0 : 2 });
      const delta =
        q != null && deltaAbs != null
          ? fmtDelta(deltaAbs)
          : q != null && q.changePercent != null
            ? fmtDelta(q.changePercent * q.price / 100)
            : null;
      // Real curve when history exists; otherwise a single day's close (no fake
      // synthetic wobble) so the card still shows today's real value.
      const sparkData = hist && hist.length >= 2 ? hist : q ? [q.price] : null;
      return (
        <IndexCard
          key={item.symbol}
          name={t(item.nameKey)}
          value={q ? q.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : null}
          changePercent={changePercent}
          delta={delta}
          sparkData={sparkData}
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
              items={["1D", "1W", "1M", "3M", "1Y"].map((k) => ({ id: k, label: t(`indices.range.${k.toLowerCase()}`) }))}
              value={ixRange}
              onChange={setIxRange}
              size="sm"
            />
            <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? t("indices.refreshing") : t("indices.refresh")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t("indices.settings")}
          title={t("indices.settings")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
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
          {t("indices.filter.count", { visible: String(visibleSections.length), total: String(enabledSections.length) })}
        </span>
      </div>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t("indices.settings")}
      >
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map(({ key, labelKey }) => {
            const on = !!settings[key];
            return (
              <button
                key={key}
                onClick={() => handleToggleSection(key, !on)}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  on
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </Modal>

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
                sparkData={q ? [q.price] : null}
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
