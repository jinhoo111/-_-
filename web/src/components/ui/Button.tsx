import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "default" | "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-[var(--btn-h-sm)] px-[14px] gap-2 text-[var(--text-sm)]",
  md: "h-[var(--btn-h-lg)] px-5 gap-2 text-[var(--text-base)]",
  lg: "h-[var(--btn-h-lg)] px-6 gap-2.5 text-[var(--text-lg)]",
};

const VARIANT_CLASS: Record<Variant, string> = {
  default: "border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-overlay)]",
  primary: "border border-transparent bg-[var(--color-accent)] text-[var(--color-text-on-accent)] font-semibold hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-pressed)]",
  secondary: "border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-overlay)]",
  ghost: "border border-transparent bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]",
  danger: "border border-transparent bg-[var(--color-error-bg)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-[var(--color-text-on-accent)]",
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
        className={`inline-flex items-center justify-center rounded-[var(--radius-control)] font-semibold whitespace-nowrap transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
