"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HoldingCard } from "@/components/richbuild/HoldingCard";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useT } from "@/lib/i18n/LanguageProvider";

export function HoldingsSection() {
  const t = useT();
  const { holdings, loading } = useHoldings();

  return (
    <Card id="holdings">
      <CardHeader
        title={t("richbuild.holdings.title")}
        action={
          <Link href="/richbuild/add">
            <Button size="sm">{t("richbuild.holdings.add")}</Button>
          </Link>
        }
      />
      {loading ? null : holdings.length === 0 ? (
        <EmptyState
          glyph="+"
          title={t("richbuild.holdings.emptyTitle")}
          description={t("richbuild.holdings.emptyDescription")}
          action={
            <Link href="/richbuild/add">
              <Button variant="primary" size="sm">
                {t("richbuild.holdings.addCta")}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="scroll-thin flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-3">
          {holdings.map((h) => (
            <HoldingCard key={h.id} holding={h} />
          ))}
        </div>
      )}
      <p className="mt-4 text-[var(--text-xs)] text-[var(--text-muted)]">{t("richbuild.holdings.disclaimer")}</p>
    </Card>
  );
}
