"use client";

import { useId } from "react";
import { PriceChange } from "@/components/ui/PriceChange";

const LEFT_MARGIN = 64;
const VIEW_WIDTH = 400;

export function TrendChart({
  data,
  height = 180,
  formatPrice,
}: {
  data: number[];
  height?: number;
  formatPrice: (value: number) => string;
}) {
  const gradId = useId().replace(/:/g, "");
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const first = data[0];
  const last = data[data.length - 1];
  const changePct = ((last - first) / first) * 100;
  const up = last >= first;
  const color = up ? "var(--price-up)" : "var(--price-down)";

  const padY = 8;
  const plotHeight = height - padY * 2;
  const yFor = (v: number) => padY + plotHeight - ((v - min) / span) * plotHeight;

  const pts = data.map((v, i) => [LEFT_MARGIN + (i / (data.length - 1)) * (VIEW_WIDTH - LEFT_MARGIN), yFor(v)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = line + ` L${VIEW_WIDTH},${height} L${LEFT_MARGIN},${height} Z`;
  const baselineY = yFor(first);

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{formatPrice(last)}</span>
        <PriceChange value={changePct} size="sm" />
      </div>
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.16" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Baseline: starting price for this range, so the trend reads against a fixed reference */}
        <line x1={LEFT_MARGIN} y1={baselineY} x2={VIEW_WIDTH} y2={baselineY} stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3 3" />

        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Left-axis price labels: high / baseline (start price) / low */}
        <text x={4} y={yFor(max) + 4} fontSize="10" fill="var(--text-muted)">
          {formatPrice(max)}
        </text>
        <text x={4} y={baselineY + 4} fontSize="10" fill="var(--text-muted)">
          {formatPrice(first)}
        </text>
        <text x={4} y={yFor(min) + 4} fontSize="10" fill="var(--text-muted)">
          {formatPrice(min)}
        </text>
      </svg>
    </div>
  );
}
