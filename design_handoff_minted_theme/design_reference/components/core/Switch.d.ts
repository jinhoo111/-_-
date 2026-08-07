/** Toggle switch (48×28). Mint when on. Used for settings like theme, price-color convention. */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  /** Text rendered to the right. */
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}
