/** Pill label for status, tags, and small figures. Soft tinted fills, never saturated blocks. */
export interface BadgeProps {
  tone?: "neutral" | "accent" | "positive" | "negative" | "warning" | "info";
  /** IBM Plex Mono — use when the content is a figure ("+4.2%"). */
  mono?: boolean;
  size?: "md" | "sm";
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
