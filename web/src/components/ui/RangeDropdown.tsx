"use client";

import { useState } from "react";

export type RangeKey = "1D" | "7D" | "1M" | "3M" | "9M" | "YTD" | "1Y" | "All";

export const RANGE_KEYS: RangeKey[] = ["1D", "7D", "1M", "3M", "9M", "YTD", "1Y", "All"];

/** Mockup-exact range dropdown: closed shows "1 month ▾", open shows abbr badge + full name + ✓. */
export function RangeDropdown({
  value,
  onChange,
  names,
  className = "",
}: {
  value: RangeKey;
  onChange: (k: RangeKey) => void;
  /** Full-name lookup, e.g. { "1D": "1 day", "1M": "1 month", ... } */
  names: Record<RangeKey, string>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<RangeKey | null>(null);
  return (
    <span className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-[var(--text-sm)] font-medium whitespace-nowrap transition-[border-color,background] duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
          open
            ? "border-[var(--border-focus)] bg-[var(--surface-2)]"
            : "border-[var(--border-strong)] bg-transparent"
        }`}
      >
        <span
          className={`rounded-[var(--radius-pill)] px-2 py-0.5 font-mono text-[var(--text-xs)] font-semibold text-[var(--accent)] ${
            open ? "inline-block" : "hidden"
          }`}
          style={{ background: "var(--accent-soft)" }}
        >
          {value}
        </span>
        {names[value]}
        <span className="text-[10px] text-[var(--text-muted)]">▾</span>
      </button>
      {open ? (
        <>
          <span onClick={() => setOpen(false)} className="fixed inset-0 z-[29]" />
          <div
            className="absolute top-[42px] right-0 z-[30] flex w-[200px] flex-col rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-1)] p-1.5 shadow-[var(--shadow-raised)]"
          >
            {RANGE_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => {
                  onChange(k);
                  setOpen(false);
                }}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
                className={`flex h-10 items-center gap-2.5 rounded-[var(--radius-sm)] border-none px-2.5 text-left text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  hover === k ? "bg-[var(--surface-2)]" : "bg-transparent"
                } ${k === value ? "font-semibold text-[var(--text-primary)]" : "font-normal text-[var(--text-secondary)]"}`}
              >
                <span
                  className={`w-10 shrink-0 rounded-[var(--radius-pill)] py-0.5 text-center font-mono text-[var(--text-xs)] font-semibold ${
                    k === value
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                  style={{
                    background: k === value ? "var(--accent-soft)" : "var(--surface-2)",
                  }}
                >
                  {k}
                </span>
                {names[k]}
                {k === value ? <span className="ml-auto text-[var(--accent)]">✓</span> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </span>
  );
}
