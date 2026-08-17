"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

// ── QuadrantPlot ──────────────────────────────────────────────────────────────
// Renders the Stop-Loss result as a 2×2 quadrant: horizontal axis = Downtrend
// Signal (0→100), vertical axis = Loss Severity (0→100). A dot marks the stock's
// position and the quadrant it falls into gets a tinted fill — a much more visual
// read than the two raw numbers. Boundary is exactly 50 on both axes (spec §6.2).

const Q = 260;
const INSET = 28;
const PLOT = Q - INSET * 2;
const B = PLOT / 2;

export function QuadrantPlot({ lossSeverity, downtrendSignal }: { lossSeverity: number; downtrendSignal: number }) {
  const t = useT();
  const x = INSET + (downtrendSignal / 100) * PLOT;
  const y = INSET + (1 - lossSeverity / 100) * PLOT;
  const severe = lossSeverity >= 50;
  const broken = downtrendSignal >= 50;
  const active = severe && broken ? "Q4" : !severe && broken ? "Q3" : severe && !broken ? "Q2" : "Q1";

  const cells = [
    { name: "Q1", x: INSET, y: INSET + B, active: active === "Q1" }, // loss small · trend holding
    { name: "Q2", x: INSET, y: INSET, active: active === "Q2" }, // loss large · trend holding
    { name: "Q3", x: INSET + B, y: INSET + B, active: active === "Q3" }, // loss small · trend broken
    { name: "Q4", x: INSET + B, y: INSET, active: active === "Q4" }, // loss large · trend broken
  ];

  return (
    <svg viewBox={`0 0 ${Q} ${Q}`} className="w-full" style={{ maxWidth: 200 }} role="img" aria-label={t("richbuild.detail.stopLossTitle")}>
      {cells.map((c) => (
        <rect
          key={c.name}
          x={c.x}
          y={c.y}
          width={B}
          height={B}
          rx="8"
          fill={c.active ? "var(--accent-soft)" : "var(--surface-1)"}
          stroke={c.active ? "var(--accent-soft-border)" : "var(--border-default)"}
          strokeWidth="1"
        />
      ))}
      {cells.map((c) => (
        <text key={c.name + "t"} x={c.x + 12} y={c.y + 26} fontSize="14" fontWeight="700" fill={c.active ? "var(--accent)" : "var(--text-muted)"}>
          {c.name}
        </text>
      ))}

      <text x={Q / 2} y={Q - 8} fontSize="12" textAnchor="middle" fill="var(--text-muted)">
        {t("richbuild.detail.downtrendSignalLabel")}
      </text>
      <text x={12} y={Q / 2} fontSize="12" textAnchor="middle" fill="var(--text-muted)" transform={`rotate(-90 12 ${Q / 2})`}>
        {t("richbuild.detail.lossSeverityLabel")}
      </text>

      <circle
        cx={x}
        cy={y}
        r="6"
        fill="var(--accent)"
        stroke="var(--color-bg-surface)"
        strokeWidth="2"
        style={{ filter: "drop-shadow(0 0 6px var(--accent))" }}
      />
    </svg>
  );
}

// ── AxisMeter ─────────────────────────────────────────────────────────────────
// A slim horizontal bar for one 0-100 axis, with the 50 boundary marked so the
// number reads against the "which side of the line" question at a glance.
export function AxisMeter({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="flex items-center justify-between text-[var(--text-xs)]">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-mono font-semibold text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
        <span className="absolute top-[-2px] left-1/2 h-[calc(100%+4px)] w-px bg-[var(--border-strong)]" aria-hidden="true" />
      </div>
    </div>
  );
}
