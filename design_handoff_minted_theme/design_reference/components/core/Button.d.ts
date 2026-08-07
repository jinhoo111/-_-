/**
 * Primary action control. One primary button per view region; verbs for labels ("Add an investment").
 * @startingPoint section="Core" subtitle="Primary, secondary, ghost and danger actions" viewport="700x220"
 */
export interface ButtonProps {
  /** Visual weight. primary = mint fill (max one per region); secondary = raised surface; ghost = quiet; danger = destructive. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** md = 48px (default), sm = 36px compact. */
  size?: "md" | "sm";
  disabled?: boolean;
  /** Stretch to container width. */
  full?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
