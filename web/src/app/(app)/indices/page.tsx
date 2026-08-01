"use client";

import { useMemo } from "react";
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
import { useT } from "@/lib/i18n/LanguageProvider";

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

  const yahooSymbols = useMemo(() => yahooSymbolsForSections(settings), [settings]);
  const { data: quotes, isFetching: quotesFetching, refetch: refetchQuotes } = useQuotes(yahooSymbols);
  const { data: crypto, isFetching: cryptoFetching, refetch: refetchCrypto } = useCrypto(settings.crypto);
  const { data: fxRates, isFetching: fxFetching, refetch: refetchFx } = useFxRates(settings.fx);

  const refreshing = quotesFetching || cryptoFetching || fxFetching;

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

  function renderItems(items: IndexItem[]) {
    return items.map((item) => {
      const q = quotes?.[item.symbol];
      return (
        <IndexCard
          key={item.symbol}
          name={t(item.nameKey)}
          value={q ? q.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : null}
          changePercent={q?.changePercent ?? null}
          href={INDEX_LINK_MAP[item.symbol]}
          noDataLabel={t("indices.noData")}
        />
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)]">{t("nav.indices")}</h1>
        <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? t("indices.refreshing") : t("indices.refresh")}
        </Button>
      </div>

      <IndicesSettingsPanel settings={settings} onToggle={handleToggleSection} />

      {settings.kr && <IndexGrid title={t("indices.section.kr")}>{renderItems(KR_INDICES)}</IndexGrid>}
      {settings.us && <IndexGrid title={t("indices.section.us")}>{renderItems(US_INDICES)}</IndexGrid>}
      {settings.vix && <IndexGrid title={t("indices.section.vix")}>{renderItems(VIX_INDEX)}</IndexGrid>}
      {settings.rates && (
        <IndexGrid title={t("indices.section.rates")}>
          <YieldCurveCard
            tenYear={quotes?.[YIELD_CURVE_SYMBOLS.tenYear]?.price ?? null}
            twoYear={quotes?.[YIELD_CURVE_SYMBOLS.twoYear]?.price ?? null}
            noDataLabel={t("indices.noData")}
          />
        </IndexGrid>
      )}
      {settings.futures && <IndexGrid title={t("indices.section.futures")}>{renderItems(FUTURES)}</IndexGrid>}
      {settings.crypto && (
        <IndexGrid title={t("indices.section.crypto")}>
          {CRYPTO.map(({ id, symbol }) => {
            const q = crypto?.[id];
            return (
              <IndexCard
                key={id}
                name={symbol}
                value={q ? "$" + q.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : null}
                changePercent={q?.changePercent ?? null}
                href={INDEX_LINK_MAP[id]}
                noDataLabel={t("indices.noData")}
              />
            );
          })}
        </IndexGrid>
      )}
      {settings.fx && (
        <IndexGrid title={t("indices.section.fx")}>
          {FX_PAIRS.map(({ pair, currency }) => (
            <IndexCard
              key={pair}
              name={pair}
              value={fmtFx(currency, fxRates?.[currency] ?? null)}
              changePercent={null}
              href={INDEX_LINK_MAP[currency]}
              noDataLabel={t("indices.noData")}
            />
          ))}
        </IndexGrid>
      )}
      {settings.commodities && <IndexGrid title={t("indices.section.commodities")}>{renderItems(COMMODITIES)}</IndexGrid>}
    </div>
  );
}
