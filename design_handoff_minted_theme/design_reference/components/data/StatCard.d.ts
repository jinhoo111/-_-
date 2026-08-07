/**
 * Headline metric card: label, big mono value, optional PriceChange + note + Sparkline.
 * @startingPoint section="Data" subtitle="Metric card with trend and delta" viewport="700x240"
 */
export interface StatCardProps {
  /** What the number is, e.g. "Total portfolio". */
  label: string;
  /** Formatted figure with currency symbol, e.g. "₩24,180,500". */
  value: string;
  /** A <PriceChange /> element. */
  change?: React.ReactNode;
  /** Muted context text, e.g. "You're ahead of your plan". */
  note?: string;
  /** A <Sparkline /> element. */
  spark?: React.ReactNode;
  /** Right-of-label header control, e.g. a small <Tabs /> range switcher. */
  action?: React.ReactNode;
  /** Tighter padding + smaller value type, for dense grids (e.g. market indices). */
  compact?: boolean;
  style?: React.CSSProperties;
}
