import React from "react";

export function Card({ title, subtitle, action, padding = "var(--space-6)", children, style }) {
  return (
    <div style={{
      background: "var(--surface-1)", border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)",
      padding, fontFamily: "var(--font-body)", ...style,
    }}>
      {(title || action) ? (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <div>
            {title ? <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", letterSpacing: "var(--tracking-heading)" }}>{title}</div> : null}
            {subtitle ? <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 4 }}>{subtitle}</div> : null}
          </div>
          {action || null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
