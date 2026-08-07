/** Loading shimmer block. Match the shape of the content it replaces. */
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  /** CSS border-radius. Default var(--radius-sm). */
  radius?: string;
  style?: React.CSSProperties;
}
