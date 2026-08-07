/** Encouraging empty placeholder — never blame the user; suggest the first step. */
export interface EmptyStateProps {
  /** Small glyph/icon shown in a rounded tile. Unicode or an icon element. */
  glyph?: React.ReactNode;
  title: string;
  description?: string;
  /** Usually a primary Button for the first action. */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
