import React from "react";

/** Convention-aware price movement figure. Colors come from --price-up/--price-down,
    which flip under [data-price-convention="kr"]. */
export function PriceChange({ value = 0, suffix = "%", size = "md", arrow = true, badge = false, style }) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const color = dir === "up" ? "var(--price-up)" : dir === "down" ? "var(--price-down)" : "var(--price-flat)";
  const bg = dir === "up" ? "var(--price-up-soft)" : dir === "down" ? "var(--price-down-soft)" : "var(--surface-2)";
  const glyph = dir === "up" ? "↗" : dir === "down" ? "↘" : "→";
  const text = (value > 0 ? "+" : value < 0 ? "−" : "") + Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 2 }) + suffix;
  const fontSize = size === "lg" ? "var(--text-md)" : size === "sm" ? "var(--text-xs)" : "var(--text-sm)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      color, fontFamily: "var(--font-mono)", fontSize, fontWeight: "var(--weight-semibold)",
      background: badge ? bg : "transparent",
      padding: badge ? "3px 10px" : 0,
      borderRadius: badge ? "var(--radius-pill)" : 0,
      ...style,
    }}>
      {text}{arrow ? <span aria-hidden="true">{glyph}</span> : null}
    </span>
  );
}
