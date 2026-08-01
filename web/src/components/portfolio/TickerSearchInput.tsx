"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useTickerSearch } from "@/lib/queries/useTickerSearch";
import type { TickerSearchResult } from "@/lib/portfolio/constants";
import { useT } from "@/lib/i18n/LanguageProvider";

export function TickerSearchInput({
  value,
  onChange,
  onPick,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (result: TickerSearchResult) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const results = useTickerSearch(open ? value : "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [prevResults, setPrevResults] = useState(results);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (results !== prevResults) {
    setPrevResults(results);
    setActiveIdx(-1);
  }

  function pick(r: TickerSearchResult) {
    onPick(r);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0) {
        e.preventDefault();
        pick(results[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className || ""}`}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && value.trim() && results.length > 0 && (
        <ul className="absolute left-0 top-full z-10 mt-1 w-64 max-h-64 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] py-1 shadow-lg">
          {results.map((r, i) => (
            <li key={r.market + r.symbol}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[var(--text-md)] ${
                  i === activeIdx ? "bg-[var(--color-bg-overlay)]" : ""
                }`}
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-[var(--text-2xs)] font-bold ${
                    r.market === "kr"
                      ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
                      : "bg-[var(--color-info-bg)] text-[var(--color-info)]"
                  }`}
                >
                  {r.market === "kr" ? t("portfolio.market.kr") : t("portfolio.market.us")}
                </span>
                <span className="truncate text-[var(--color-text-primary)]">{r.name}</span>
                <span className="ml-auto font-mono text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{r.symbol}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
