/** Native select styled to match Input. Options are strings or {value, label}. */
export interface SelectProps {
  label?: string;
  options?: (string | { value: string; label: string })[];
  value?: string;
  onChange?: (e: any) => void;
  style?: React.CSSProperties;
}
