"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HoldingCard } from "@/components/richbuild/HoldingCard";
import { useHoldings } from "@/lib/queries/useHoldings";

export function HoldingsSection() {
  const { holdings, loading } = useHoldings();

  return (
    <Card id="holdings">
      <CardHeader
        title="My Holdings"
        action={
          <Link href="/richbuild/add">
            <Button size="sm">+ Add</Button>
          </Link>
        }
      />
      {loading ? null : holdings.length === 0 ? (
        <EmptyState
          glyph="+"
          title="No holdings registered yet"
          description="Add a ticker, buy price, and quantity — no signup needed."
          action={
            <Link href="/richbuild/add">
              <Button variant="primary" size="sm">
                Add a holding
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {holdings.map((h) => (
            <HoldingCard key={h.id} holding={h} />
          ))}
        </div>
      )}
      <p className="mt-4 text-[var(--text-xs)] text-[var(--text-muted)]">This indicator is a calculated result, not investment advice.</p>
    </Card>
  );
}
