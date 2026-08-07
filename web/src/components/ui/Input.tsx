import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--surface-2)] px-4 text-[var(--text-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-glow-accent)] focus:outline-none ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
