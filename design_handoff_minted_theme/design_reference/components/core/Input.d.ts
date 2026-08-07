/** Text field with label, hint/error line, optional prefix/suffix. 48px tall, mint focus ring. */
export interface InputProps {
  label?: string;
  /** Helper line under the field. */
  hint?: string;
  /** Error message; replaces hint and turns the border coral. */
  error?: string;
  /** Leading adornment, e.g. "₩" or a search glyph. */
  prefix?: React.ReactNode;
  /** Trailing adornment, e.g. "KRW". */
  suffix?: React.ReactNode;
  /** Use IBM Plex Mono for the value (amounts, tickers). */
  mono?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  type?: string;
  style?: React.CSSProperties;
}
