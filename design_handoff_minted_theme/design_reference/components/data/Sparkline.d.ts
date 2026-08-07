/** Minimal trend line: 2.5px stroke + gradient area fill. No axes/gridlines — for reading exact values use a full chart. */
export interface SparklineProps {
  /** Series values, oldest first. */
  data?: number[];
  /** viewBox width (scales to container). Default 400. */
  width?: number;
  /** Rendered height in px. Default 64. */
  height?: number;
  /** Line color. Default var(--chart-line); use var(--price-down) for losing series, --chart-alt-* for comparisons. */
  stroke?: string;
  /** Gradient area under the line. Default true. */
  fill?: boolean;
  style?: React.CSSProperties;
}
