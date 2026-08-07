import React from "react";

export function Tabs({ items = [], value, onChange, size = "md", style }) {
  const h = size === "sm" ? 32 : 40;
  return (
    <div style={{
      display: "inline-flex", gap: 4, padding: 4,
      background: "var(--surface-2)", borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-body)", ...style,
    }}>
      {items.map((it) => {
        const item = typeof it === "string" ? { id: it, label: it } : it;
        const active = item.id === value;
        return (
          <TabItem key={item.id} active={active} h={h} size={size} onClick={() => onChange && onChange(item.id)}>
            {item.label}
          </TabItem>
        );
      })}
    </div>
  );
}

function TabItem({ active, h, size, onClick, children }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: h, padding: size === "sm" ? "0 14px" : "0 18px",
        background: active ? "var(--surface-0)" : hover ? "var(--surface-3)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        border: "none", borderRadius: "var(--radius-pill)",
        fontSize: size === "sm" ? "var(--text-sm)" : "var(--text-base)",
        fontWeight: active ? "var(--weight-semibold)" : "var(--weight-medium)",
        fontFamily: "var(--font-body)", cursor: "pointer",
        transition: "background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
      }}
    >
      {children}
    </button>
  );
}
