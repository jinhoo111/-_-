"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MemoComposeForm } from "@/components/journal/MemoComposeForm";
import { TagChip } from "@/components/journal/TagChip";
import { ScheduleSection } from "@/components/journal/ScheduleSection";
import { ImpulseSection } from "@/components/journal/ImpulseSection";
import { LedgerSection } from "@/components/journal/LedgerSection";
import { WeightSection } from "@/components/journal/WeightSection";
import { GlucoseSection } from "@/components/journal/GlucoseSection";
import { WorkoutSection } from "@/components/journal/WorkoutSection";
import type { GlucoseEntry, GlucoseSlot, ImpulseTradeEntry, LedgerEntry, LedgerType, MarketEvent, MemoArchiveEntry, MemoTag, ScheduleEntry, WeightEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function CalendarDayPanel({
  dayLabel,
  selectedDate,
  entries,
  events,
  schedules,
  ledger,
  weightEntries,
  weightGoal,
  glucoseEntries,
  workout,
  impulse,
  onSave,
  onDelete,
  onSaveSchedule,
  onDeleteSchedule,
  onSaveImpulse,
  onDeleteImpulse,
  onSaveLedger,
  onDeleteLedger,
  onSaveWeight,
  onDeleteWeight,
  onSaveGlucose,
  onDeleteGlucose,
  onSetWorkout,
}: {
  dayLabel: string;
  selectedDate: string;
  entries: MemoArchiveEntry[];
  events: MarketEvent[];
  schedules: ScheduleEntry[];
  ledger: LedgerEntry[];
  weightEntries: WeightEntry[];
  weightGoal: number | null;
  glucoseEntries: GlucoseEntry[];
  workout: "done" | "off" | undefined;
  impulse: ImpulseTradeEntry | undefined;
  onSave: (data: { text: string; tag: MemoTag; important: boolean }, editId?: string) => void;
  onDelete: (id: string) => void;
  onSaveSchedule: (data: { time: string; title: string; memo: string }, editId?: string) => void;
  onDeleteSchedule: (id: string) => void;
  onSaveImpulse: (reason: string) => void;
  onDeleteImpulse: () => void;
  onSaveLedger: (data: { type: LedgerType; amount: number; cat: string; memo: string }) => void;
  onDeleteLedger: (id: string) => void;
  onSaveWeight: (kg: number) => void;
  onDeleteWeight: () => void;
  onSaveGlucose: (slot: GlucoseSlot, mgdl: number) => void;
  onDeleteGlucose: (slot: GlucoseSlot) => void;
  onSetWorkout: (val: "done" | "off") => void;
}) {
  const t = useT();
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingEntry = entries.find((e) => e.id === editingId);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[18px_20px] shadow-[var(--shadow-card)]">
      <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{dayLabel}</div>

      <ScheduleSection entries={schedules} onSave={onSaveSchedule} onDelete={onDeleteSchedule} />

      <ImpulseSection entry={impulse} onSave={onSaveImpulse} onDelete={onDeleteImpulse} />

      <LedgerSection entries={ledger} onSave={onSaveLedger} onDelete={onDeleteLedger} />

      <WeightSection date={selectedDate} entries={weightEntries} goal={weightGoal} onSave={onSaveWeight} onDelete={onDeleteWeight} />

      <GlucoseSection date={selectedDate} entries={glucoseEntries} onSave={onSaveGlucose} onDelete={onDeleteGlucose} />

      <WorkoutSection value={workout} onSet={onSetWorkout} />

      {events.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {events.map((e) => (
            <span key={e.id} className="rounded-[var(--radius-pill)] bg-[var(--color-bg-badge)] px-2.5 py-1 text-[var(--text-xs)] text-[var(--color-text-secondary)]">
              {t(`journal.event.${e.type}`) === `journal.event.${e.type}` ? e.title : t(`journal.event.${e.type}`)}
            </span>
          ))}
        </div>
      )}

      {entries.length === 0 && !composing && <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("journal.calendar.noEntries")}</p>}

      <div className="flex flex-col gap-2">
        {entries.map((entry) =>
          editingId === entry.id ? (
            <MemoComposeForm
              key={entry.id}
              initial={entry}
              onSave={(data) => {
                onSave(data, entry.id);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={entry.id} className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2">
              <TagChip tag={entry.tag} />
              <p className="flex-1 text-[var(--text-md)] text-[var(--color-text-primary)] whitespace-pre-wrap">
                {entry.important ? "★ " : ""}
                {entry.text}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setEditingId(entry.id)} className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] hover:underline">
                  {t("journal.entry.edit")}
                </button>
                <button onClick={() => onDelete(entry.id)} className="text-[var(--text-xs)] text-[var(--color-error)] hover:underline">
                  {t("journal.entry.delete")}
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {composing ? (
        <MemoComposeForm
          onSave={(data) => {
            onSave(data);
            setComposing(false);
          }}
          onCancel={() => setComposing(false)}
        />
      ) : (
        !editingEntry && (
          <Button size="sm" onClick={() => setComposing(true)} className="self-start">
            + {t("journal.compose.add")}
          </Button>
        )
      )}
    </div>
  );
}
