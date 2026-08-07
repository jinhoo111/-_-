import React from "react";

export function Input({ label, hint, error, prefix, suffix, mono = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? "var(--negative)" : focus ? "var(--border-focus)" : "var(--border-default)";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--font-body)", ...style }}>
      {label ? <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)" }}>{label}</span> : null}
      <span style={{
        display: "flex", alignItems: "center", gap: 10, height: "var(--control-height)", padding: "0 16px",
        background: "var(--surface-2)", border: "1px solid " + borderColor, borderRadius: "var(--radius-md)",
        boxShadow: focus ? "var(--shadow-glow-accent)" : "none",
        transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
      }}>
        {prefix ? <span style={{ color: "var(--text-muted)", fontSize: "var(--text-base)", fontFamily: mono ? "var(--font-mono)" : "var(--font-body)" }}>{prefix}</span> : null}
        <input
          {...rest}
          onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
          style={{
            flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
            color: "var(--text-primary)", fontSize: "var(--text-base)",
            fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
          }}
        />
        {suffix ? <span style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>{suffix}</span> : null}
      </span>
      {error ? <span style={{ fontSize: "var(--text-xs)", color: "var(--negative)" }}>{error}</span>
        : hint ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{hint}</span> : null}
    </label>
  );
}
