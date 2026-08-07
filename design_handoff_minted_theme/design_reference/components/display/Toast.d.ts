/** Transient notification card (360px). Raised surface with tinted icon disc — no colored left borders. */
export interface ToastProps {
  tone?: "success" | "error" | "info";
  title: string;
  description?: string;
  /** Shows the × control when provided. */
  onDismiss?: () => void;
  style?: React.CSSProperties;
}
