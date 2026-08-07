import { useId } from "react";

export function Sparkline({
  data = [],
  width = 400,
  height = 64,
  stroke = "var(--chart-line)",
  fill = true,
  style,
}: {
  data?: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}) {
  const gradId = useId().replace(/:/g, "");
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - 6 - ((v - min) / span) * (height - 12),
  ]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = line + " L" + width + "," + height + " L0," + height + " Z";
  return (
    <svg
      viewBox={"0 0 " + width + " " + height}
      style={{ width: "100%", height, display: "block", ...style }}
      preserveAspectRatio="none"
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--chart-fill-top)" />
              <stop offset="1" stopColor="var(--chart-fill-bottom)" />
            </linearGradient>
          </defs>
          <path d={area} fill={"url(#" + gradId + ")"} />
        </>
      ) : null}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
