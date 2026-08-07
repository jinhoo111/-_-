/** Square icon-only button (44px hit target). Pass the glyph as children; `label` is required for accessibility. */
export interface IconButtonProps {
  /** Accessible name / tooltip. Required. */
  label: string;
  /** Square edge in px. Default 44 (minimum hit target). */
  size?: number;
  /** Highlighted state (mint tint). */
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
