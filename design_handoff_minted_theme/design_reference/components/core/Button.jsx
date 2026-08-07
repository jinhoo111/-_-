import React from "react";

const SIZES = {
  md: { height: "var(--control-height)", padding: "0 20px", fontSize: "var(--text-base)" },
  sm: { height: "var(--control-height-sm)", padding: "0 14px", fontSize: "var(--text-sm)" },
};

export function Button({ variant = "primary", size = "md", disabled = false, full = false, onClick, children, style }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const v = {
    primary: {
      background: press ? "var(--accent-pressed)" : hover ? "var(--accent-hover)" : "var(--accent)",
      color: "var(--text-on-accent)", border: "1px solid transparent",
    },
    secondary: {
      background: hover ? "var(--surface-3)" : "var(--surface-2)",
      color: "var(--text-primary)", border: "1px solid var(--border-default)",
    },
    ghost: {
      background: hover ? "var(--surface-2)" : "transparent",
      color: "var(--text-secondary)", border: "1px solid transparent",
    },
    danger: {
      background: hover ? "var(--negative)" : "var(--negative-soft)",
      color: hover ? "#081410" : "var(--negative)", border: "1px solid transparent",
    },
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        ...SIZES[size], ...v,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        whiteSpace: "nowrap",
        width: full ? "100%" : undefined,
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-body)", fontWeight: "var(--weight-semibold)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transform: press && !disabled ? "scale(0.98)" : "none",
        transition: "background var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
