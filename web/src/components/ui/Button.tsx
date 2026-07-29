import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "default" | "primary";
type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-[var(--btn-h-sm)] px-[13px] gap-[5px] text-[var(--text-sm)]",
  md: "h-[var(--btn-h-md)] px-[18px] gap-1.5 text-[var(--text-md)]",
  lg: "h-[var(--btn-h-lg)] px-6 gap-[7px] text-[var(--text-lg)]",
};

const VARIANT_CLASS: Record<Variant, string> = {
  default:
    "border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-overlay)]",
  primary:
    "border border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] text-[var(--color-accent-on)] font-semibold hover:bg-[var(--color-accent-hover)] hover:border-[var(--color-accent-hover)]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
