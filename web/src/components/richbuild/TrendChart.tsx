"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PriceChange } from "@/components/ui/PriceChange";

const LEFT_MARGIN = 64;
const MIN_WIDTH = 320;

export function TrendChart({
  data,
  formatPrice,
  changePctOverride,
}: {
  data: number[];
  formatPrice: (value: number) => string;
  /** When set (e.g. for the 1D range), display this change instead of first→last so
      the badge matches the standard daily change shown on the holding card. */
  changePctOverride?: number | null;
}) {
  const gradId = useId().replace(/:/g, "");
  const svgRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Measure the SVG container, which has a definite height from the fixed-height card
  // wrapper. The SVG fills it with height:100% — it never drives the container size —
  // so there is no height feedback loop and the card can't keep growing. The viewBox
  // matches the rendered size 1:1, so the price labels never stretch either.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setSize({ w: Math.max(MIN_WIDTH, w), h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const first = data[0];
  const last = data[data.length - 1];
  const changePct = changePctOverride != null ? changePctOverride : ((last - first) / first) * 100;
  const up = changePct >= 0;
  const color = up ? "var(--price-up)" : "var(--price-down)";

  const w = size?.w ?? MIN_WIDTH;
  const h = size?.h ?? 0;
  const padY = 12;
  const plotHeight = h - padY * 2;
  const yFor = (v: number) => padY + plotHeight - ((v - min) / span) * plotHeight;
  const pts = data.map((v, i) => [LEFT_MARGIN + (i / (data.length - 1)) * (w - LEFT_MARGIN), yFor(v)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = line + ` L${w},${h} L${LEFT_MARGIN},${h} Z`;
  const baselineY = yFor(first);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < LEFT_MARGIN || x > w) {
      setHoverIdx(null);
      return;
    }
    const i = Math.round(((x - LEFT_MARGIN) / (w - LEFT_MARGIN)) * (data.length - 1));
    setHoverIdx(Math.min(Math.max(i, 0), data.length - 1));
  };

  const hoverPoint = hoverIdx != null ? pts[hoverIdx] : null;
  const hoverPrice = hoverIdx != null ? data[hoverIdx] : null;
  const tooltipLeft = hoverPoint ? Math.min(Math.max(hoverPoint[0], 70), w - 70) : 0;
  const tooltipTop = hoverPoint ? Math.max(4, Math.min(hoverPoint[1] - 46, h - 54)) : 0;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{formatPrice(last)}</span>
        <PriceChange value={changePct} size="sm" />
      </div>
      <div ref={svgRef} className="relative min-h-0 flex-1">
        {size && h > 0 ? (
          <>
            <svg
              viewBox={`0 0 ${w} ${h}`}
              style={{ width: "100%", height: "100%", display: "block" }}
              preserveAspectRatio="none"
              onMouseMove={handleMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={color} stopOpacity="0.16" />
                  <stop offset="1" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Baseline: starting price for this range, so the trend reads against a fixed reference */}
              <line x1={LEFT_MARGIN} y1={baselineY} x2={w} y2={baselineY} stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3 3" />

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

              {/* Hover crosshair + point */}
              {hoverPoint && (
                <g>
                  <line x1={hoverPoint[0]} y1={padY} x2={hoverPoint[0]} y2={h - padY} stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={hoverPoint[0]} cy={hoverPoint[1]} r="4.5" fill="var(--accent)" stroke="var(--color-bg-surface)" strokeWidth="2" />
                </g>
              )}
            </svg>

            {/* Hover tooltip — the data point at the cursor */}
            {hoverPoint && hoverPrice != null && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-2.5 py-1.5 shadow-[var(--shadow-raised)]"
                style={{ left: tooltipLeft, top: tooltipTop }}
              >
                <div className="font-mono text-[var(--text-sm)] font-semibold text-[var(--text-primary)]">{formatPrice(hoverPrice)}</div>
                <div className="mt-0.5">
                  <PriceChange value={((hoverPrice - first) / first) * 100} size="sm" />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
