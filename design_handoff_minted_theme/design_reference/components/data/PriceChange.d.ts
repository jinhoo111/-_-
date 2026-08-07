/** The ONLY way to render price movement. Reads --price-up/--price-down so the KR/western color setting applies globally. */
export interface PriceChangeProps {
  /** Signed number, e.g. 2.1 or -0.8. */
  value?: number;
  /** Unit appended to the figure. Default "%". */
  suffix?: string;
  size?: "sm" | "md" | "lg";
  /** Show ↗ / ↘ direction glyph. Default true. */
  arrow?: boolean;
  /** Render as a soft-tinted pill. */
  badge?: boolean;
  style?: React.CSSProperties;
}
