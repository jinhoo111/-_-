import React from "react";

let uid = 0;

export function Sparkline({ data = [], width = 400, height = 64, stroke = "var(--chart-line)", fill = true, style }) {
  const idRef = React.useRef(null);
  if (idRef.current === null) idRef.current = "mspark" + (++uid);
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - 6 - ((v - min) / span) * (height - 12),
  ]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = line + " L" + width + "," + height + " L0," + height + " Z";
  return (
    <svg viewBox={"0 0 " + width + " " + height} style={{ width: "100%", height, display: "block", ...style }} preserveAspectRatio="none">
      {fill ? (
        <React.Fragment>
          <defs>
            <linearGradient id={idRef.current} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--chart-fill-top)" />
              <stop offset="1" stopColor="var(--chart-fill-bottom)" />
            </linearGradient>
          </defs>
          <path d={area} fill={"url(#" + idRef.current + ")"} />
        </React.Fragment>
      ) : null}
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
