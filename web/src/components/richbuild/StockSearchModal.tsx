"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useTickerSearch } from "@/lib/queries/useTickerSearch";
import { resolveTickerFromName } from "@/lib/portfolio/constants";
import { useT } from "@/lib/i18n/LanguageProvider";

// Stock lookup modal: type a ticker/name, pick a result → jumps to that stock's
// overview page (the same detail page a holding links to). Rendered conditionally by
// the caller, so it mounts fresh (empty query) each time it's opened.
export function StockSearchModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const results = useTickerSearch(query);

  function openOverview(ticker: string) {
    onClose();
    router.push(`/richbuild/holding/${encodeURIComponent(ticker)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const resolved = resolveTickerFromName(q);
    if (resolved) {
      openOverview(resolved);
      return;
    }
    if (results.length) openOverview(results[0].symbol);
  }

  return (
    <Modal open onClose={onClose} title={t("richbuild.search.title")} subtitle={t("richbuild.search.subtitle")}>
      <form onSubmit={handleSubmit}>
        <Input
          autoFocus
          placeholder={t("richbuild.search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      {query.trim() && (
        <div className="scroll-thin mt-3 flex max-h-[320px] flex-col overflow-y-auto">
          {results.length === 0 ? (
            <p className="py-4 text-center text-[var(--text-sm)] text-[var(--text-muted)]">{t("richbuild.search.noResults")}</p>
          ) : (
            results.map((r) => (
              <button
                type="button"
                key={r.symbol}
                onClick={() => openOverview(r.symbol)}
                className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-[var(--text-sm)] hover:bg-[var(--surface-2)]"
              >
                <span className="truncate text-[var(--text-primary)]">{r.name}</span>
                <span className="shrink-0 text-[var(--text-muted)]">{r.symbol}</span>
              </button>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}
