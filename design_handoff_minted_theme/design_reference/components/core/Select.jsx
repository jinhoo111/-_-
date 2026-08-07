import React from "react";

export function Select({ label, options = [], value, onChange, style }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--font-body)", ...style }}>
      {label ? <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)" }}>{label}</span> : null}
      <span style={{ position: "relative", display: "block" }}>
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%", height: "var(--control-height)", padding: "0 40px 0 16px",
            background: "var(--surface-2)", color: "var(--text-primary)",
            border: "1px solid " + (focus ? "var(--border-focus)" : "var(--border-default)"),
            borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", fontFamily: "var(--font-body)",
            appearance: "none", WebkitAppearance: "none", outline: "none", cursor: "pointer",
            boxShadow: focus ? "var(--shadow-glow-accent)" : "none",
          }}
        >
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)", fontSize: 12 }}>▾</span>
      </span>
    </label>
  );
}
