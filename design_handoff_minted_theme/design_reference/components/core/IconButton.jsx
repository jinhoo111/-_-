import React from "react";

export function IconButton({ label, size = 44, active = false, onClick, children, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: active ? "var(--accent-soft)" : hover ? "var(--surface-2)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        border: "1px solid " + (active ? "var(--accent-soft-border)" : "transparent"),
        borderRadius: "var(--radius-md)", cursor: "pointer",
        transition: "background var(--duration-fast) var(--ease-out)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
