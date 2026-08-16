import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";
import { t, type Lang } from "@/lib/i18n/messages";
import type { Quadrant } from "@/lib/richbuild/types";

// Two independent axes → a quadrant, never a bare number (spec §6). Sort priority is
// Q4 > Q3 > Q2 > Q1 — trend breakdown is weighted over raw loss size, so a small loss
// with a broken trend (Q3) outranks a large loss with a holding trend (Q2). Do not
// "simplify" this to sort by loss % — the ordering is itself a product decision.
export const QUADRANT_SORT_ORDER: Record<Quadrant, number> = { Q4: 0, Q3: 1, Q2: 2, Q1: 3 };

// Boundary is exactly 50 on BOTH axes (service plan §6.2) — not a separate
// high/mid split per axis.
export function classifyQuadrant(lossSeverity: number, downtrendSignal: number): Quadrant {
  const b = RICHBUILD_THRESHOLDS.quadrantBoundary;
  const severeLoss = lossSeverity >= b;
  const brokenTrend = downtrendSignal >= b;
  if (severeLoss && brokenTrend) return "Q4";
  if (!severeLoss && brokenTrend) return "Q3";
  if (severeLoss && !brokenTrend) return "Q2";
  return "Q1";
}

// Plain-language, descriptive-not-prescriptive per spec §7 non-negotiable #1 — never
// "sell this" / "stop-loss this stock", only a factual read of the two axes. v1 is
// Korean-primary (service plan mockups); English exists for the debug toggle.
const QUADRANT_KEY: Record<Quadrant, string> = {
  Q1: "richbuild.quadrant.q1",
  Q2: "richbuild.quadrant.q2",
  Q3: "richbuild.quadrant.q3",
  Q4: "richbuild.quadrant.q4",
};

export function quadrantSentence(q: Quadrant, lang: Lang): string {
  return t(lang, QUADRANT_KEY[q]);
}
