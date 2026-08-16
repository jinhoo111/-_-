"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

const ITEMS = [
  {
    title: "Indicator Definitions",
    subtitle: "What the Stop-Loss & Herding indicators measure",
    body: "The Stop-Loss Indicator has two independent axes: Loss Severity (how bad the position itself is — requires your buy price) and Downtrend Signal (how broken the trend is — works without a buy price). The Herding Indicator (Attention Heat Index) measures how much attention a stock is getting — volume spikes, extreme returns, news volume — regardless of direction, because panic-buying and panic-selling are the same underlying behavior.",
  },
  {
    title: "Explanation",
    subtitle: "Formulas and score-band labels explained",
    body: "Both indicators are 0–100 scores built from daily closing-price data (not real-time). Downtrend Signal combines how far price has fallen relative to recent volatility, whether key moving averages have broken, and whether losses are accelerating. Loss Severity combines how much gain is needed to break even and how long the price has stayed below its 60-day average. Attention Heat Index combines trading-volume spikes and return volatility versus their recent normal range.",
  },
  {
    title: "How to Read",
    subtitle: "How to read the quadrant sentences",
    body: "Every Stop-Loss read is a plain sentence, never a bare number or an instruction — e.g. \"Loss is large, but the trend is holding.\" A large loss with a stable trend and a small loss with a broken trend are different situations, so the two axes are shown separately rather than blended into one score.",
  },
  {
    title: "Disclosures & Terms",
    subtitle: "Not-investment-advice notice",
    body: "RichBuild's indicators are calculated results based on public market data, not investment advice, and not a recommendation to buy, hold, or sell any security. Every score shows the closing date the data is as of. Nothing in this app tells you what to do with a position — decisions are always yours.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <h1 className="font-display text-[var(--text-xl)] font-bold text-[var(--text-primary)]">Help</h1>
      {ITEMS.map((item, i) => {
        const open = openIndex === i;
        return (
          <Card key={item.title} className="cursor-pointer" onClick={() => setOpenIndex(open ? null : i)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{item.title}</div>
                <div className="text-[var(--text-sm)] text-[var(--text-secondary)]">{item.subtitle}</div>
              </div>
              <span className="text-[var(--text-muted)]">{open ? "︿" : "﹀"}</span>
            </div>
            {open && <p className="mt-3 text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">{item.body}</p>}
          </Card>
        );
      })}
      <p className="mt-2 text-center text-[var(--text-xs)] text-[var(--text-muted)]">RichBuild v1.0</p>
    </div>
  );
}
