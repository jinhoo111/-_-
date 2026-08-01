export interface LineSeries {
  label: string;
  color: string;
  points: (number | null)[];
  dashed?: boolean;
}

export interface HLine {
  y: number;
  color: string;
  label: string;
}

// Ports legacy _lineChartSVG as a React component (same layout/scale math, JSX instead of a template string).
export function LineChart({
  w = 520,
  h = 220,
  xLabels,
  series,
  hlines = [],
  zeroBased,
  fmtY,
  noDataLabel,
}: {
  w?: number;
  h?: number;
  xLabels: string[];
  series: LineSeries[];
  hlines?: HLine[];
  zeroBased?: boolean;
  fmtY?: (v: number) => string;
  noDataLabel: string;
}) {
  const padL = 48;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const n = xLabels.length;
  const iw = w - padL - padR;
  const ih = h - padT - padB;

  const ys: number[] = [];
  series.forEach((s) => s.points.forEach((p) => { if (p != null && isFinite(p)) ys.push(p); }));
  hlines.forEach((l) => ys.push(l.y));

  if (!ys.length) {
    return <div className="py-6 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{noDataLabel}</div>;
  }

  let ymin = Math.min(...ys);
  let ymax = Math.max(...ys);
  if (zeroBased) ymin = Math.min(0, ymin);
  if (ymin === ymax) {
    ymax = ymin + 1;
    ymin = ymin - 1;
  }
  const gap = (ymax - ymin) * 0.1;
  ymax += gap;
  if (!(zeroBased && ymin === 0)) ymin -= gap;

  const X = (i: number) => padL + (n <= 1 ? iw / 2 : (iw * i) / (n - 1));
  const Y = (v: number) => padT + ih - (ih * (v - ymin)) / (ymax - ymin);

  const gridLines = Array.from({ length: 5 }, (_, g) => {
    const v = ymin + ((ymax - ymin) * g) / 4;
    return { v, yy: Y(v) };
  });

  const legend = series.map((s) => (
    <span key={s.label} className="mr-2.5 inline-flex items-center gap-1 text-[var(--text-xs)]">
      <span className="inline-block w-3.5 border-t-2" style={{ borderColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }} />
      {s.label}
    </span>
  ));

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w, height: "auto" }}>
          {gridLines.map(({ v, yy }, i) => (
            <g key={i}>
              <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--color-border-default)" strokeWidth={0.5} />
              <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize={9} fill="var(--color-text-tertiary)">
                {fmtY ? fmtY(v) : Math.round(v)}
              </text>
            </g>
          ))}
          {hlines.map((l, i) => {
            const yy = Y(l.y);
            return (
              <g key={i}>
                <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke={l.color} strokeWidth={1.2} strokeDasharray="5 4" />
                <text x={w - padR} y={yy - 3} textAnchor="end" fontSize={9} fill={l.color}>
                  {l.label}
                </text>
              </g>
            );
          })}
          {series.map((s) => {
            const pts = s.points.map((p, i) => (p != null && isFinite(p) ? `${X(i)},${Y(p)}` : null)).filter(Boolean).join(" ");
            return (
              <g key={s.label}>
                {pts && (
                  <polyline
                    points={pts}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.dashed ? "4 3" : undefined}
                    strokeLinejoin="round"
                  />
                )}
                {s.points.map((p, i) => (p != null && isFinite(p) ? <circle key={i} cx={X(i)} cy={Y(p)} r={2.4} fill={s.color} /> : null))}
              </g>
            );
          })}
          {xLabels.map((l, i) => (
            <text key={i} x={X(i)} y={h - 8} textAnchor="middle" fontSize={9} fill="var(--color-text-tertiary)">
              {l}
            </text>
          ))}
        </svg>
      </div>
      <div className="mt-1">{legend}</div>
    </div>
  );
}
