import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";
import type { Quadrant } from "@/lib/richbuild/types";

// Two independent axes → a quadrant, never a bare number (spec §6). Sort priority is
// Q4 > Q3 > Q2 > Q1 — trend breakdown is weighted over raw loss size, so a small loss
// with a broken trend (Q3) outranks a large loss with a holding trend (Q2). Do not
// "simplify" this to sort by loss % — the ordering is itself a product decision.
export const QUADRANT_SORT_ORDER: Record<Quadrant, number> = { Q4: 0, Q3: 1, Q2: 2, Q1: 3 };

export function classifyQuadrant(lossSeverity: number, downtrendSignal: number): Quadrant {
  const severeLoss = lossSeverity >= RICHBUILD_THRESHOLDS.lossSeverity.high;
  const brokenTrend = downtrendSignal >= RICHBUILD_THRESHOLDS.downtrendSignal.broken;
  if (severeLoss && brokenTrend) return "Q4";
  if (!severeLoss && brokenTrend) return "Q3";
  if (severeLoss && !brokenTrend) return "Q2";
  return "Q1";
}

// Plain-language, descriptive-not-prescriptive per spec §7 non-negotiable #1 — never
// "sell this" / "stop-loss this stock", only a factual read of the two axes.
const QUADRANT_SENTENCE: Record<Quadrant, string> = {
  Q1: "Loss is small, and the trend is holding",
  Q2: "Loss is large, but the trend is holding",
  Q3: "Loss is small, but the trend has broken",
  Q4: "Loss is large, and the trend has broken",
};

export function quadrantSentence(q: Quadrant): string {
  return QUADRANT_SENTENCE[q];
}
