import React from "react";

export function Switch({ checked = false, onChange, label, disabled = false, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, fontFamily: "var(--font-body)", ...style }}>
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => !disabled && onChange && onChange(!checked)}
        onKeyDown={(e) => { if (!disabled && (e.key === " " || e.key === "Enter")) { e.preventDefault(); onChange && onChange(!checked); } }}
        style={{
          width: 48, height: 28, borderRadius: "var(--radius-pill)", position: "relative", flexShrink: 0,
          background: checked ? "var(--accent)" : "var(--surface-3)",
          border: "1px solid " + (checked ? "transparent" : "var(--border-strong)"),
          transition: "background var(--duration-base) var(--ease-out)",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 23 : 3, width: 21, height: 21, borderRadius: "50%",
          background: checked ? "var(--text-on-accent)" : "var(--text-secondary)",
          transition: "left var(--duration-base) var(--ease-out), background var(--duration-base) var(--ease-out)",
        }}></span>
      </span>
      {label ? <span style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{label}</span> : null}
    </label>
  );
}
