"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useMonitorResolve } from "@/lib/queries/useMonitor";
import type { ResolvedCompany } from "@/lib/monitor/server";

export function MonitorSearch({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (resolved: ResolvedCompany) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState<string | null>(null);
  const { data, isFetching, isError } = useMonitorResolve(committed);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    setCommitted(q);
  };

  const handleAdd = () => {
    if (!data) return;
    onAdd(data);
    setQuery("");
    setCommitted(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t("monitor.search.placeholder")}
          disabled={disabled}
        />
        <Button onClick={handleSearch} disabled={disabled || !query.trim()}>
          {t("monitor.search.button")}
        </Button>
      </div>
      {disabled && <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.search.capReached")}</p>}
      {committed && isFetching && <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.search.searching")}</p>}
      {committed && !isFetching && isError && <p className="text-[var(--text-sm)] text-[var(--color-error)]">{t("monitor.search.notFound")}</p>}
      {committed && !isFetching && data && (
        <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border-default)] px-3 py-2">
          <div>
            <span className="font-semibold text-[var(--color-text-primary)]">{data.corp_name}</span>
            <span className="ml-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{data.market}{data.stock_code ? ` · ${data.stock_code}` : ""}</span>
          </div>
          <Button size="sm" variant="primary" onClick={handleAdd}>
            {t("monitor.search.add")}
          </Button>
        </div>
      )}
    </div>
  );
}
