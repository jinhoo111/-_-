/**
 * Holding / watchlist list row: initials tile, name + sub, right-aligned mono value + PriceChange.
 * @startingPoint section="Data" subtitle="Holding row with price and delta" viewport="700x160"
 */
export interface TickerRowProps {
  /** Ticker used for the 2-letter tile, e.g. "SE". */
  symbol?: string;
  name: string;
  /** Secondary line, e.g. "12 shares" or "KOSPI". */
  sub?: string;
  /** Formatted price/value, e.g. "₩8,940,000". */
  value?: string;
  /** A <PriceChange size="sm" /> element. */
  change?: React.ReactNode;
  /** Row becomes hoverable/clickable when set. */
  onClick?: () => void;
  style?: React.CSSProperties;
}
