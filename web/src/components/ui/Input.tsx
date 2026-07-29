import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-[var(--btn-h-md)] w-full rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] px-3 text-[var(--text-lg)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-info)] ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
