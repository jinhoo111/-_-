import React from "react";

export function EmptyState({ glyph = "◎", title, description, action, style }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, padding: "var(--space-10) var(--space-6)", textAlign: "center",
      fontFamily: "var(--font-body)", ...style,
    }}>
      <span style={{
        width: 56, height: 56, borderRadius: "var(--radius-lg)", marginBottom: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--surface-2)", color: "var(--text-muted)", fontSize: 24,
      }}>{glyph}</span>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</div>
      {description ? <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", maxWidth: 320, lineHeight: "var(--leading-normal)" }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  );
}
