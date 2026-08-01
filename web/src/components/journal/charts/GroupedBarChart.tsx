import type { ReactNode } from "react";

export interface GroupedSeries {
  label: string;
  color: string;
  values: (number | null)[];
  outline?: boolean;
}

// Ports legacy _groupedBarSVG: paired outline (target) vs filled (actual) bars per category.
export function GroupedBarChart({
  w = 520,
  h = 240,
  xLabels,
  series,
  fmtY,
  fmtLabel,
}: {
  w?: number;
  h?: number;
  xLabels: string[];
  series: GroupedSeries[];
  fmtY?: (v: number) => string;
  fmtLabel?: (v: number) => string;
}) {
  const padL = 46;
  const padR = 14;
  const padT = 18;
  const padB = 28;
  const n = xLabels.length;
  const ns = series.length;
  const iw = w - padL - padR;
  const ih = h - padT - padB;

  const ys: number[] = [];
  series.forEach((s) => s.values.forEach((v) => { if (v != null && isFinite(v)) ys.push(v); }));
  let ymax = Math.max(1, ...ys);
  ymax += ymax * 0.14;
  const Y = (v: number) => padT + ih - (ih * v) / ymax;

  const step = iw / Math.max(1, n);
  const groupW = step * 0.66;
  const barW = groupW / ns;
  const showVals = n <= 6;

  const grid = Array.from({ length: 5 }, (_, g) => {
    const v = (ymax * g) / 4;
    return { v, yy: Y(v) };
  });

  const bars: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const gx = padL + step * i + (step - groupW) / 2;
    series.forEach((s, si) => {
      const v = s.values[i];
      if (v == null || !isFinite(v)) return;
      const bx = gx + barW * si;
      const by = Y(v);
      const bh = Math.max(0, padT + ih - by);
      const bwr = barW * 0.84;
      bars.push(
        s.outline ? (
          <rect key={`${i}-${si}`} x={bx} y={by} width={bwr} height={bh} rx={2.5} fill={s.color} fillOpacity={0.22} stroke={s.color} strokeWidth={1} />
        ) : (
          <rect key={`${i}-${si}`} x={bx} y={by} width={bwr} height={bh} rx={2.5} fill={s.color} />
        ),
      );
      if (showVals && v > 0) {
        bars.push(
          <text key={`${i}-${si}-t`} x={bx + bwr / 2} y={by - 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={s.color}>
            {fmtLabel ? fmtLabel(v) : Math.round(v)}
          </text>,
        );
      }
    });
  }

  const legend = series.map((s) => (
    <span key={s.label} className="mr-3 inline-flex items-center gap-1.5 text-[var(--text-xs)]">
      <span
        className="inline-block h-2.5 w-2.5 rounded-[3px]"
        style={{ background: s.outline ? "transparent" : s.color, border: s.outline ? `1px solid ${s.color}` : "none" }}
      />
      {s.label}
    </span>
  ));

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w, height: "auto" }}>
          {grid.map(({ v, yy }, i) => (
            <g key={i}>
              <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--color-border-default)" strokeWidth={0.5} />
              <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize={9} fill="var(--color-text-tertiary)">
                {fmtY ? fmtY(v) : Math.round(v)}
              </text>
            </g>
          ))}
          {bars}
          {xLabels.map((l, i) => {
            const cx = padL + step * i + step / 2;
            return (
              <text key={i} x={cx} y={h - 8} textAnchor="middle" fontSize={9} fill="var(--color-text-tertiary)">
                {l}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="mt-1.5">{legend}</div>
    </div>
  );
}
