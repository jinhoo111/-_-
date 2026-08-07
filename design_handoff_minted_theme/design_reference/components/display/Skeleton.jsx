import React from "react";

export function Skeleton({ width = "100%", height = 16, radius = "var(--radius-sm)", style }) {
  return (
    <span style={{
      display: "block", width, height, borderRadius: radius,
      background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
      backgroundSize: "200% 100%",
      animation: "minted-shimmer 1.4s ease-in-out infinite",
      ...style,
    }}>
      <style>{"@keyframes minted-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }"}</style>
    </span>
  );
}
