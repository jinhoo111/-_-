"use client";

import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";

interface Recommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface RatingCardProps {
  symbol: string;
  recommendation: Recommendation[];
  priceTarget: PriceTarget | null;
}

function consensusFor(rec: Recommendation) {
  const total = rec.buy + rec.hold + rec.sell + rec.strongBuy + rec.strongSell;
  const buyTotal = rec.buy + rec.strongBuy;
  const holdTotal = rec.hold;
  const sellTotal = rec.sell + rec.strongSell;
  const buyPct = total ? Math.round((buyTotal / total) * 100) : 0;
  const holdPct = total ? Math.round((holdTotal / total) * 100) : 0;
  const sellPct = total ? Math.round((sellTotal / total) * 100) : 0;
  const label: "strongBuy" | "buy" | "hold" | "sell" =
    buyPct >= 60 ? "strongBuy" : buyPct >= 40 ? "buy" : holdPct >= 50 ? "hold" : "sell";
  return { total, buyTotal, holdTotal, sellTotal, buyPct, holdPct, sellPct, label };
}

const CONSENSUS_STYLE: Record<string, { bg: string; fg: string }> = {
  strongBuy: { bg: "var(--color-success-bg)", fg: "var(--color-success-text)" },
  buy: { bg: "var(--color-success-bg-soft)", fg: "var(--color-success-deep)" },
  hold: { bg: "var(--color-warning-bg)", fg: "var(--color-warning-text)" },
  sell: { bg: "var(--color-error-bg)", fg: "var(--color-error-text)" },
};

function ConsensusBar({ buyPct, holdPct, sellPct }: { buyPct: number; holdPct: number; sellPct: number }) {
  return (
    <div className="mb-2 flex h-[5px] gap-[1px] overflow-hidden rounded-[3px]">
      <div className="h-full bg-[var(--color-success)]" style={{ width: `${buyPct}%` }} />
      <div className="h-full bg-[var(--color-warning)]" style={{ width: `${holdPct}%` }} />
      <div className="h-full bg-[var(--color-error)]" style={{ width: `${sellPct}%` }} />
    </div>
  );
}

export function RatingCard({ symbol, recommendation, priceTarget }: RatingCardProps) {
  const t = useT();

  if (!recommendation.length) {
    return (
      <Card>
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("news.rating.empty")}</p>
      </Card>
    );
  }

  const latest = recommendation[0];
  const c = consensusFor(latest);
  const style = CONSENSUS_STYLE[c.label];

  return (
    <div className="flex flex-col gap-2">
      <Card>
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)]">{symbol}</p>
            <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              {latest.period} · {t("news.rating.institutions", { count: c.total })}
            </p>
          </div>
          <span
            className="rounded-[var(--radius-pill)] px-3 py-1 text-[var(--text-base)] font-bold"
            style={{ background: style.bg, color: style.fg }}
          >
            {t(`news.rating.consensus.${c.label}`)}
          </span>
        </div>
        <ConsensusBar buyPct={c.buyPct} holdPct={c.holdPct} sellPct={c.sellPct} />
        <div className="mb-1.5 flex flex-wrap gap-3 text-[var(--text-sm)]">
          <span className="text-[var(--color-success)]">{t("news.rating.buyPct", { pct: c.buyPct, count: c.buyTotal })}</span>
          <span className="text-[var(--color-warning)]">{t("news.rating.holdPct", { pct: c.holdPct, count: c.holdTotal })}</span>
          <span className="text-[var(--color-error)]">{t("news.rating.sellPct", { pct: c.sellPct, count: c.sellTotal })}</span>
        </div>
        {priceTarget?.targetMean != null && (
          <div className="flex flex-wrap gap-4 border-t border-[var(--color-border-faint)] pt-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
            <span>
              {t("news.rating.targetMean")}{" "}
              <strong className="text-[var(--color-text-primary)]">${priceTarget.targetMean.toFixed(2)}</strong>
            </span>
            {priceTarget.targetHigh != null && (
              <span>
                {t("news.rating.targetHigh")} <strong className="text-[var(--color-success)]">${priceTarget.targetHigh.toFixed(2)}</strong>
              </span>
            )}
            {priceTarget.targetLow != null && (
              <span>
                {t("news.rating.targetLow")} <strong className="text-[var(--color-error)]">${priceTarget.targetLow.toFixed(2)}</strong>
              </span>
            )}
          </div>
        )}
      </Card>

      {recommendation.slice(1, 3).map((r) => {
        const rc = consensusFor(r);
        return (
          <Card key={r.period}>
            <div className="mb-1.5 flex items-center justify-between text-[var(--text-base)]">
              <span className="font-semibold text-[var(--color-text-primary)]">{r.period}</span>
              <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("news.rating.institutions", { count: rc.total })}</span>
            </div>
            <ConsensusBar buyPct={rc.buyPct} holdPct={rc.holdPct} sellPct={rc.sellPct} />
            <div className="flex gap-2.5 text-[var(--text-sm)]">
              <span className="text-[var(--color-success)]">{t("news.rating.consensus.buy")} {rc.buyTotal}</span>
              <span className="text-[var(--color-warning)]">{t("news.rating.consensus.hold")} {rc.holdTotal}</span>
              <span className="text-[var(--color-error)]">{t("news.rating.consensus.sell")} {rc.sellTotal}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
