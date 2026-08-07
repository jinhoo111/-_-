/** Segmented pill tabs — the app's view switcher (News / Flow / Journal sub-views). */
export interface TabsProps {
  /** Strings or {id, label}. */
  items?: (string | { id: string; label: string })[];
  /** Active item id. */
  value?: string;
  onChange?: (id: string) => void;
  size?: "md" | "sm";
  style?: React.CSSProperties;
}
