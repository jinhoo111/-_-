/** Surface container: 20px radius, 1px border, --surface-1. Optional header row (title/subtitle/action). */
export interface CardProps {
  title?: string;
  subtitle?: string;
  /** Right-aligned header element (e.g. small Button or Badge). */
  action?: React.ReactNode;
  /** CSS padding. Default var(--space-6). */
  padding?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
