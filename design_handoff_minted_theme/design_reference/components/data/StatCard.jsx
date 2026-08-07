import React from "react";

export function StatCard({ label, value, change, note, spark, action, compact = false, style }) {
  return (
    <div style={{
      background: "var(--surface-1)", border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", padding: compact ? "var(--space-4) var(--space-5)" : "var(--space-6)",
      display: "flex", flexDirection: "column", gap: compact ? 6 : 10, fontFamily: "var(--font-body)", ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>{label}</div>
        {action || null}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: compact ? "var(--text-xl)" : "var(--text-2xl)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", letterSpacing: "var(--tracking-mono-big)", lineHeight: "var(--leading-tight)" }}>{value}</div>
      {(change || note) ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {change || null}
          {note ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{note}</span> : null}
        </div>
      ) : null}
      {spark ? <div style={{ marginTop: 4 }}>{spark}</div> : null}
    </div>
  );
}
