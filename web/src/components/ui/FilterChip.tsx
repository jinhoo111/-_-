"use client";

import { useState } from "react";

export function FilterChip({
  label,
  active,
  onClick,
  className = "",
}: {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`h-9 cursor-pointer rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
        active
          ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
          : hover
            ? "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
            : "border-[var(--border-default)] bg-[var(--surface-1)] font-medium text-[var(--text-secondary)]"
      } ${className}`}
    >
      {label}
    </button>
  );
}
