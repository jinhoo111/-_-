"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { TagChip } from "@/components/journal/TagChip";
import { PhilosophyButtons } from "@/components/journal/PhilosophyButtons";
import { TAG_KEYS } from "@/lib/journal/constants";
import type { MemoArchiveEntry, MemoTag, PhilosophyEntry, PhilosophyType } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";

type ViewMode = "list" | "card";

export function ArchiveView({
  entries,
  philosophy,
  onTogglePhilosophy,
}: {
  entries: MemoArchiveEntry[];
  philosophy: PhilosophyEntry[];
  onTogglePhilosophy: (sourceId: string, type: PhilosophyType) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const [view, setView] = useState<ViewMode>("list");
  const [tagFilter, setTagFilter] = useState<MemoTag | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 180);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (tagFilter !== "all" && e.tag !== tagFilter) return false;
      if (debouncedSearch && !e.text.toLowerCase().includes(debouncedSearch)) return false;
      return true;
    });
  }, [entries, tagFilter, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, MemoArchiveEntry[]>();
    for (const e of filtered) {
      const key = new Date(e.completedAt || e.time).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()];
  }, [filtered, lang]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("journal.archive.searchPlaceholder")}
          className="max-w-64"
        />
        <div className="ml-auto flex gap-1">
          {(["list", "card"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-[var(--radius-control)] px-2.5 py-1 text-[var(--text-sm)] ${
                view === v ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
              }`}
            >
              {t(`journal.archive.view.${v}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setTagFilter("all")}
          className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-xs)] font-medium ${
            tagFilter === "all" ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
          }`}
        >
          {t("journal.archive.tag.all")}
        </button>
        {TAG_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setTagFilter(k)}
            className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-xs)] font-medium ${
              tagFilter === k ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
            }`}
          >
            {t(`journal.tag.${k}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("journal.archive.empty")} />
      ) : view === "list" ? (
        <div className="flex flex-col gap-1.5">
          {filtered.map((e) => (
            <div key={e.id} className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2">
              <TagChip tag={e.tag} />
              <p className="flex-1 text-[var(--text-md)] text-[var(--color-text-primary)] whitespace-pre-wrap">
                {e.important ? "★ " : ""}
                {e.text}
              </p>
              <PhilosophyButtons sourceId={e.id} philosophy={philosophy} onToggle={onTogglePhilosophy} />
              <span className="whitespace-nowrap text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                {new Date(e.completedAt || e.time).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map(([dateLabel, group]) => (
            <div key={dateLabel} className="flex flex-col gap-1.5">
              <div className="text-[var(--text-sm)] font-semibold text-[var(--color-text-tertiary)]">{dateLabel}</div>
              <div className="flex flex-col gap-1.5">
                {group.map((e) => (
                  <div key={e.id} className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2">
                    <TagChip tag={e.tag} />
                    <p className="flex-1 text-[var(--text-md)] text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {e.important ? "★ " : ""}
                      {e.text}
                    </p>
                    <PhilosophyButtons sourceId={e.id} philosophy={philosophy} onToggle={onTogglePhilosophy} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
