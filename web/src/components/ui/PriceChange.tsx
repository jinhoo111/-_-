import type { HTMLAttributes } from "react";

/** Convention-aware price movement figure. Colors come from --price-up/--price-down,
    which flip under the user's chosen convention (displayPrefs). */
export function PriceChange({
  value = 0,
  suffix = "%",
  size = "md",
  arrow = true,
  badge = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  value?: number;
  suffix?: string;
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  badge?: boolean;
}) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const color =
    dir === "up" ? "var(--price-up)" : dir === "down" ? "var(--price-down)" : "var(--price-flat)";
  const bg =
    dir === "up" ? "var(--price-up-soft)" : dir === "down" ? "var(--price-down-soft)" : "var(--surface-2)";
  const glyph = dir === "up" ? "↗" : dir === "down" ? "↘" : "→";
  const text =
    (value > 0 ? "+" : value < 0 ? "−" : "") +
    Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 2 }) +
    suffix;
  const fontSize =
    size === "lg" ? "text-[var(--text-md)]" : size === "sm" ? "text-[var(--text-xs)]" : "text-[var(--text-sm)]";

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold ${
        badge ? `rounded-[var(--radius-pill)] px-2.5 py-[3px]` : ""
      } ${fontSize} ${className}`}
      style={{ color, background: badge ? bg : "transparent" }}
      {...props}
    >
      {text}
      {arrow ? (
        <span aria-hidden="true" className="not-italic">
          {glyph}
        </span>
      ) : null}
    </span>
  );
}
