"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useIsAdmin } from "@/lib/admin/useIsAdmin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useAddMarketEvent,
  useAdminMarketEvents,
  useDeleteMarketEvent,
} from "@/lib/queries/useMarketEvents";

const EVENT_TYPES = ["fomc", "macro", "earnings", "opex", "ipo", "event"] as const;
type EventType = (typeof EVENT_TYPES)[number];

const EVENT_TYPE_ICON: Record<EventType, string> = {
  fomc: "🏦",
  macro: "📈",
  earnings: "📊",
  opex: "⚡",
  ipo: "🏛️",
  event: "🏔️",
};

export function MarketEventsSection() {
  const t = useT();
  const isAdmin = useIsAdmin();
  const { data: rows, isLoading, error } = useAdminMarketEvents();
  const addEvent = useAddMarketEvent();
  const deleteEvent = useDeleteMarketEvent();

  const [date, setDate] = useState("");
  const [type, setType] = useState<EventType>("event");
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredSorted = useMemo(() => {
    const all = rows ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.type.toLowerCase().includes(q) ||
            e.date.toLowerCase().includes(q),
        )
      : all;
    return [...filtered].sort((a, b) => (sortAsc ? a.id - b.id : b.id - a.id));
  }, [rows, search, sortAsc]);

  if (!isAdmin) return <EmptyState title={t("security.marketEvents.adminOnly")} />;
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <EmptyState title={t("security.marketEvents.error")} />;

  function handleAdd() {
    setFormError("");
    if (!date || !title.trim()) {
      setFormError(t("security.marketEvents.formError"));
      return;
    }
    addEvent.mutate(
      { date, type, title: title.trim() },
      {
        onSuccess: () => setTitle(""),
        onError: () => setFormError(t("security.marketEvents.addError")),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        {t("security.marketEvents.description")}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto shrink-0" />
        <Select value={type} onChange={(e) => setType(e.target.value as EventType)} className="shrink-0">
          {EVENT_TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {EVENT_TYPE_ICON[tp]} {t(`security.marketEvents.type.${tp}`)}
            </option>
          ))}
        </Select>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("security.marketEvents.titlePlaceholder")}
          className="min-w-[160px] flex-1"
        />
        <Button variant="primary" onClick={handleAdd} disabled={addEvent.isPending} className="shrink-0">
          {t("security.marketEvents.add")}
        </Button>
      </div>
      {formError && <div className="text-[var(--text-sm)] text-[var(--color-error-text)]">{formError}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("security.marketEvents.searchPlaceholder")}
          className="max-w-xs flex-1"
        />
        <Button size="sm" onClick={() => setSortAsc((s) => !s)} className="shrink-0 whitespace-nowrap">
          {sortAsc ? t("security.marketEvents.sortAsc") : t("security.marketEvents.sortDesc")}
        </Button>
      </div>

      {!filteredSorted.length ? (
        <EmptyState
          title={(rows ?? []).length ? t("security.marketEvents.noResults") : t("security.marketEvents.empty")}
        />
      ) : (
        <div className="flex flex-col gap-1">
          <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
            {t("security.marketEvents.count", { count: filteredSorted.length })}
          </div>
          {filteredSorted.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2 border-b border-[var(--color-border-faint)] py-1.5 text-[var(--text-sm)]"
            >
              <span className="font-mono text-[var(--color-text-tertiary)]">{e.date}</span>
              <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5">
                {EVENT_TYPE_ICON[e.type as EventType] ?? "🏔️"} {e.type}
              </span>
              <span className="flex-1">{e.title}</span>
              <button
                onClick={() => deleteEvent.mutate(e.id)}
                disabled={deleteEvent.isPending}
                className="text-[var(--color-error)] hover:underline"
              >
                {t("security.delete")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
