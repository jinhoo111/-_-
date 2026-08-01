// Ports legacy _barChartSVG as a React component: single-series count bar chart.
export function BarChart({
  w = 520,
  h = 200,
  xLabels,
  values,
  color = "var(--color-error-text)",
}: {
  w?: number;
  h?: number;
  xLabels: string[];
  values: number[];
  color?: string;
}) {
  const padL = 40;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const n = xLabels.length;
  const iw = w - padL - padR;
  const ih = h - padT - padB;
  const ymax = Math.max(1, ...values);
  const step = iw / Math.max(1, n);
  const bw = Math.min(30, step * 0.62);
  const Y = (v: number) => padT + ih - (ih * v) / ymax;
  const gLines = Math.min(4, ymax);

  const grid = Array.from({ length: gLines + 1 }, (_, g) => {
    const v = Math.round((ymax * g) / gLines);
    return { v, yy: Y(v) };
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w, height: "auto" }}>
        {grid.map(({ v, yy }, i) => (
          <g key={i}>
            <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--color-border-default)" strokeWidth={0.5} />
            <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize={9} fill="var(--color-text-tertiary)">
              {v}
            </text>
          </g>
        ))}
        {values.map((v, i) => {
          const cx = padL + step * i + step / 2;
          const by = Y(v);
          const bh = Math.max(0, (ih * v) / ymax);
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={by} width={bw} height={bh} rx={3} fill={color} opacity={v === 0 ? 0.12 : undefined} />
              {v > 0 && (
                <text x={cx} y={by - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={color}>
                  {v}
                </text>
              )}
            </g>
          );
        })}
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
  );
}
