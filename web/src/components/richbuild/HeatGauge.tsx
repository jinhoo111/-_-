"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";

const SIZE = 96;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function bandFor(score: number): { labelKey: string; takeawayKey: string; color: string } {
  if (score >= RICHBUILD_THRESHOLDS.heatIndex.hot) {
    return { labelKey: "richbuild.detail.heatBandOverheated", takeawayKey: "richbuild.detail.heatTakeawayOverheated", color: "var(--price-up)" };
  }
  if (score >= RICHBUILD_THRESHOLDS.heatIndex.warm) {
    return { labelKey: "richbuild.detail.heatBandRising", takeawayKey: "richbuild.detail.heatTakeawayRising", color: "var(--warning)" };
  }
  return { labelKey: "richbuild.detail.heatBandNormal", takeawayKey: "richbuild.detail.heatTakeawayNormal", color: "var(--accent)" };
}

// Presents the Heat Index as a single computed read — an animated ring fill + count-up
// number, paired with a plain-language takeaway — rather than exposing the raw A1-A5/K1
// sub-scores (service plan §6.1's inputs are real, but surfacing volume-ratio/Z-score
// jargon to an anxious first-time user undercuts the "fact, not homework" tone the rest
// of the product goes for; the sub-scores are one tap away via "Show breakdown").
export function HeatGauge({ score }: { score: number }) {
  const t = useT();
  const [display, setDisplay] = useState(0);
  const band = bandFor(score);

  useEffect(() => {
    // No synchronous setState here — the first animation frame (progress≈0) already
    // renders display≈0, so resetting state before scheduling the RAF loop is redundant.
    let raf: number;
    const start = performance.timeOrigin ? Date.now() : 0;
    const duration = 900;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = CIRCUMFERENCE * (1 - display / 100);

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={band.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 120ms linear",
              filter: `drop-shadow(0 0 6px ${band.color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[var(--text-2xl)] font-bold text-[var(--text-primary)]">{display}</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-[var(--text-sm)] font-semibold" style={{ color: band.color }}>
          {t(band.labelKey)}
        </span>
        <p className="text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">{t(band.takeawayKey)}</p>
      </div>
    </div>
  );
}
