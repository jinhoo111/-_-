import React from "react";

const TONES = {
  neutral: { bg: "var(--surface-2)", fg: "var(--text-secondary)", bd: "var(--border-default)" },
  accent: { bg: "var(--accent-soft)", fg: "var(--accent)", bd: "var(--accent-soft-border)" },
  positive: { bg: "var(--positive-soft)", fg: "var(--positive)", bd: "transparent" },
  negative: { bg: "var(--negative-soft)", fg: "var(--negative)", bd: "transparent" },
  warning: { bg: "var(--warning-soft)", fg: "var(--warning)", bd: "transparent" },
  info: { bg: "var(--info-soft)", fg: "var(--info)", bd: "transparent" },
};

export function Badge({ tone = "neutral", mono = false, size = "md", children, style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: size === "sm" ? "2px 8px" : "4px 12px",
      background: t.bg, color: t.fg, border: "1px solid " + t.bd,
      borderRadius: "var(--radius-pill)",
      fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-sm)",
      fontWeight: "var(--weight-semibold)",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
      ...style,
    }}>
      {children}
    </span>
  );
}
