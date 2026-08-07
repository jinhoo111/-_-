import React from "react";

const ICONS = { success: "✓", error: "!", info: "i" };
const TONE = {
  success: { fg: "var(--positive)", bg: "var(--positive-soft)" },
  error: { fg: "var(--negative)", bg: "var(--negative-soft)" },
  info: { fg: "var(--info)", bg: "var(--info-soft)" },
};

export function Toast({ tone = "info", title, description, onDismiss, style }) {
  const t = TONE[tone] || TONE.info;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12, width: 360, padding: 16,
      background: "var(--surface-2)", border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-raised)",
      fontFamily: "var(--font-body)", ...style,
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: t.bg, color: t.fg, fontSize: 14, fontWeight: "var(--weight-bold)",
      }}>{ICONS[tone]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</div>
        {description ? <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2, lineHeight: "var(--leading-snug)" }}>{description}</div> : null}
      </div>
      {onDismiss ? (
        <button onClick={onDismiss} aria-label="Dismiss" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1 }}>×</button>
      ) : null}
    </div>
  );
}
