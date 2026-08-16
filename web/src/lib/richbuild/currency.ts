import type { CurrencyCode } from "@/lib/displayPrefs";
import type { Market } from "@/lib/richbuild/types";

export type FxRates = { KRW: number | null; JPY: number | null; EUR: number | null; CNY: number | null };

// Same conversion pattern as the dashboard's portfolio page: pivot every native value
// through USD, then into the selected display currency.
export function convertToDisplay(nativeValue: number, nativeMarket: Market, currency: CurrencyCode, fxRates: FxRates | undefined): number {
  const fxRate = fxRates?.KRW ?? 1400; // same fallback the portfolio page uses when fxRates hasn't loaded yet
  const usdValue = nativeMarket === "kr" ? nativeValue / fxRate : nativeValue;
  const ratePerUSD: Record<CurrencyCode, number> = {
    USD: 1,
    KRW: fxRate,
    JPY: fxRates?.JPY ?? 0,
    EUR: fxRates?.EUR ? 1 / fxRates.EUR : 0,
    CNY: fxRates?.CNY ?? 0,
  };
  return usdValue * (ratePerUSD[currency] || 1);
}

// Force "en-US" formatting regardless of the browser's locale — without it,
// toLocaleString() can render a comma as the decimal separator on non-US locales.
export function formatCurrency(value: number, currency: CurrencyCode): string {
  if (currency === "KRW") return `₩${Math.round(value).toLocaleString("en-US")}`;
  if (currency === "JPY") return `¥${Math.round(value).toLocaleString("en-US")}`;
  if (currency === "CNY") return `CN¥${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
