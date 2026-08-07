import { type SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-[var(--control-height)] cursor-pointer appearance-none rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--surface-2)] px-4 pr-10 text-[var(--text-base)] text-[var(--color-text-primary)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-glow-accent)] focus:outline-none ${className}`}
        {...props}
      />
    );
  },
);
Select.displayName = "Select";
