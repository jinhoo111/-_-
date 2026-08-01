"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ScheduleForm } from "@/components/journal/ScheduleForm";
import type { ScheduleEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function ScheduleSection({
  entries,
  onSave,
  onDelete,
}: {
  entries: ScheduleEntry[];
  onSave: (data: { time: string; title: string; memo: string }, editId?: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
          📅 {t("journal.schedule.section")}
          {entries.length > 0 && (
            <span className="ml-1 font-normal text-[var(--color-text-tertiary)]">{t("journal.schedule.count", { count: entries.length })}</span>
          )}
        </span>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setComposing((c) => !c);
          }}
          className="border-[var(--color-accent-border-soft)] text-[var(--color-accent-indigo)]"
        >
          {t("journal.schedule.add")}
        </Button>
      </div>

      {composing && (
        <ScheduleForm
          onSave={(data) => {
            onSave(data);
            setComposing(false);
          }}
          onCancel={() => setComposing(false)}
        />
      )}

      {entries.length === 0 && !composing ? (
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("journal.schedule.empty")}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((s) =>
            editingId === s.id ? (
              <ScheduleForm
                key={s.id}
                initial={s}
                onSave={(data) => {
                  onSave(data, s.id);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={s.id} className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2">
                <span className="whitespace-nowrap font-mono text-[var(--text-sm)] font-bold text-[var(--color-accent-indigo)]">
                  {s.time || t("journal.schedule.allDay")}
                </span>
                <span className="min-w-0 flex-1 text-[var(--text-md)] text-[var(--color-text-primary)]">
                  <b>{s.title}</b>
                  {s.memo && <span className="text-[var(--color-text-tertiary)]"> · {s.memo}</span>}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setComposing(false);
                      setEditingId(s.id);
                    }}
                    className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] hover:underline"
                  >
                    {t("journal.entry.edit")}
                  </button>
                  <button onClick={() => onDelete(s.id)} className="text-[var(--text-xs)] text-[var(--color-error)] hover:underline">
                    {t("journal.entry.delete")}
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
