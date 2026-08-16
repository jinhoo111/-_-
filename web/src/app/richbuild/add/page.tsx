"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTickerSearch } from "@/lib/queries/useTickerSearch";
import { useHoldings } from "@/lib/queries/useHoldings";
import { resolveTickerFromName } from "@/lib/portfolio/constants";

export default function AddHoldingPage() {
  const router = useRouter();
  const { addHolding } = useHoldings();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ symbol: string; name: string; market: "kr" | "us" } | null>(null);
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const results = useTickerSearch(query);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let ticker = selected;
    if (!ticker) {
      const resolved = resolveTickerFromName(query);
      if (resolved) ticker = { symbol: resolved, name: query.trim(), market: /\.(KS|KQ)$/i.test(resolved) ? "kr" : "us" };
    }
    if (!ticker) {
      setError("Pick a ticker from the search results.");
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    const price = buyPrice.trim() ? Number(buyPrice) : null;
    if (buyPrice.trim() && (!price || price <= 0)) {
      setError("Buy price must be a positive number.");
      return;
    }

    setPending(true);
    const result = await addHolding({ ticker: ticker.symbol, name: ticker.name, market: ticker.market, buyPrice: price, quantity: qty });
    setPending(false);

    if (result.gated) {
      router.push(`/richbuild/login?redirectTo=${encodeURIComponent("/richbuild/add")}`);
      return;
    }
    router.push(`/richbuild/holding/${encodeURIComponent(ticker.symbol)}`);
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader title="Add Holding" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <label className="mb-2 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">Ticker</label>
          <Input
            placeholder="Search (e.g. Samsung Elec.)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
          />
          {query && !selected && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] shadow-[var(--shadow-raised)]">
              {results.map((r) => (
                <button
                  type="button"
                  key={r.symbol}
                  onClick={() => {
                    setSelected(r);
                    setQuery(r.name);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[var(--text-sm)] hover:bg-[var(--surface-2)]"
                >
                  <span>{r.name}</span>
                  <span className="text-[var(--text-muted)]">{r.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="mb-2 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">Buy Price</label>
          <Input placeholder="Numbers only" inputMode="decimal" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">Quantity</label>
          <Input placeholder="Numbers only" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        {error && <p className="text-[var(--text-sm)] text-[var(--negative)]">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
          {pending ? "Checking…" : "Check My Holding's Status"}
        </Button>
        <p className="text-center text-[var(--text-xs)] text-[var(--text-muted)]">
          See results instantly, no signup needed (local storage)
        </p>
      </form>
    </Card>
  );
}
