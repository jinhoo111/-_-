import React from "react";

export function TickerRow({ symbol, name, sub, value, change, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const initials = (symbol || name || "?").slice(0, 2).toUpperCase();
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        minHeight: 56, padding: "8px 12px", margin: "0 -12px",
        borderRadius: "var(--radius-md)",
        background: hover && onClick ? "var(--surface-2)" : "transparent",
        cursor: onClick ? "pointer" : "default",
        transition: "background var(--duration-fast) var(--ease-out)",
        fontFamily: "var(--font-body)", ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span style={{
          width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface-2)", color: "var(--accent)",
          fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-sm)",
        }}>{initials}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          {sub ? <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>{sub}</div> : null}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{value}</div>
        {change ? <div style={{ marginTop: 2 }}>{change}</div> : null}
      </div>
    </div>
  );
}
