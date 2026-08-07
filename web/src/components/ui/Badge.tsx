import type { HTMLAttributes } from "react";

type Tone = "neutral" | "accent" | "positive" | "negative" | "warning" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-default)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-soft-border)]",
  positive: "bg-[var(--positive-soft)] text-[var(--positive)] border-transparent",
  negative: "bg-[var(--negative-soft)] text-[var(--negative)] border-transparent",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)] border-transparent",
  info: "bg-[var(--info-soft)] text-[var(--info)] border-transparent",
};

export function Badge({
  tone = "neutral",
  mono = false,
  size = "md",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; mono?: boolean; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border font-semibold whitespace-nowrap ${
        size === "sm" ? "px-2 py-0.5 text-[var(--text-xs)]" : "px-3 py-1 text-[var(--text-sm)]"
      } ${mono ? "font-mono" : ""} ${TONE_CLASS[tone]} ${className}`}
      {...props}
    />
  );
}
