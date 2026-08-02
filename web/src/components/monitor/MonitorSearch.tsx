"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useMonitorResolve, useMonitorSearchSuggestions } from "@/lib/queries/useMonitor";
import type { ResolvedCompany } from "@/lib/monitor/server";
import type { MonitorSearchSuggestion } from "@/app/api/monitor/search/route";

// Live autocomplete dropdown mirroring legacy's monitorSearchInput/_monitorNaverSearch:
// 300ms debounce, Naver-backed KR suggestions with market badges, 6-digit code passthrough,
// and Up/Down/Enter/Escape keyboard navigation. Non-KR text (letters) is treated as a US
// ticker candidate and resolved directly via /api/monitor/resolve without a dropdown.
export function MonitorSearch({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (resolved: ResolvedCompany) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [committed, setCommitted] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim();
      setDebounced(!q || /^\d{6}$/.test(q) ? "" : q);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: suggestions, isFetching: isSuggesting } = useMonitorSearchSuggestions(open ? debounced : null);
  const { data, isFetching, isError } = useMonitorResolve(committed);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = suggestions ?? [];

  function pick(r: MonitorSearchSuggestion) {
    setSelectedCode(r.code);
    setQuery(r.name);
    setOpen(false);
  }

  function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    setCommitted(selectedCode || q);
  }

  function handleAdd() {
    if (!data) return;
    onAdd(data);
    setQuery("");
    setSelectedCode(null);
    setCommitted(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    if (e.key === "Enter") {
      if (open && activeIdx >= 0 && results[activeIdx]) {
        e.preventDefault();
        pick(results[activeIdx]);
        return;
      }
      handleSearch();
      return;
    }
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
  }

  const showDropdown = open && query.trim().length >= 1 && !/^\d{6}$/.test(query.trim()) && !/^[A-Za-z.-]{1,10}$/.test(query.trim());

  return (
    <div className="flex flex-col gap-2">
      <div ref={rootRef} className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedCode(null);
              setOpen(true);
              setActiveIdx(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("monitor.search.placeholder")}
            disabled={disabled}
            autoComplete="off"
          />
          {showDropdown && (isSuggesting || results.length > 0) && (
            <ul className="absolute left-0 top-full z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] py-1 shadow-lg">
              {results.map((r, i) => (
                <li key={r.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[var(--text-md)] border-b border-[var(--color-border-faint)] last:border-b-0 ${
                      i === activeIdx ? "bg-[var(--color-bg-overlay)]" : ""
                    }`}
                  >
                    <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[var(--text-2xs)] font-bold bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]">
                      {r.mkt}
                    </span>
                    <span className="flex-shrink-0 font-mono text-[var(--text-xs)] font-semibold text-[var(--color-text-tertiary)]">{r.code}</span>
                    <span className="truncate font-semibold text-[var(--color-text-strong)]">{r.name}</span>
                  </button>
                </li>
              ))}
              {!isSuggesting && !results.length && (
                <li className="px-3 py-2 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.search.noResults")}</li>
              )}
            </ul>
          )}
        </div>
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
