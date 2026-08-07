"use client";

import { dateKey, dayLedgerIcon, glucoseByDay, healthByDay, impulseByDay, scheduleSort, workoutByDay } from "@/lib/journal/constants";
import type { GlucoseEntry, ImpulseTradeEntry, LedgerEntry, MarketEvent, MemoArchiveEntry, ScheduleEntry, WeightEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";

const MAX_CHIPS = 5;

// Compact colored-dot legend for day cells (mockup: mint dot = trade, sky dot = note).
function chipDotColor(kind: string): string {
  switch (kind) {
    case "event":
      return "var(--warning)";
    case "schedule":
      return "var(--accent)";
    case "weight":
      return "var(--info)";
    case "glucose":
      return "var(--negative)";
    case "workout":
      return "var(--positive)";
    case "impulse":
      return "var(--negative)";
    default:
      return "var(--chart-alt-1)";
  }
}

export function CalendarGrid({
  year,
  month,
  entries,
  events,
  schedules,
  ledger,
  weightEntries,
  glucoseEntries,
  workouts,
  impulseTrades,
  selectedDay,
  onSelectDay,
  onNavigate,
}: {
  year: number;
  month: number;
  entries: MemoArchiveEntry[];
  events: MarketEvent[];
  schedules: ScheduleEntry[];
  ledger: LedgerEntry[];
  weightEntries: WeightEntry[];
  glucoseEntries: GlucoseEntry[];
  workouts: Record<string, "done" | "off">;
  impulseTrades: ImpulseTradeEntry[];
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  onNavigate: (direction: -1 | 1) => void;
}) {
  const t = useT();
  const { lang } = useLang();

  const entriesByDay = new Map<string, MemoArchiveEntry[]>();
  for (const entry of entries) {
    const key = dateKey(new Date(entry.completedAt || entry.time));
    entriesByDay.set(key, [...(entriesByDay.get(key) ?? []), entry]);
  }
  const eventsByDay = new Map<string, MarketEvent[]>();
  for (const event of events) {
    eventsByDay.set(event.date, [...(eventsByDay.get(event.date) ?? []), event]);
  }
  const schedulesByDay = new Map<string, ScheduleEntry[]>();
  for (const s of schedules) {
    schedulesByDay.set(s.date, [...(schedulesByDay.get(s.date) ?? []), s].sort(scheduleSort));
  }
  const ledgerByDay = new Map<string, LedgerEntry[]>();
  for (const l of ledger) {
    ledgerByDay.set(l.date, [...(ledgerByDay.get(l.date) ?? []), l]);
  }
  const weightByDay = healthByDay(weightEntries, year, month);
  const glucoseDayMap = glucoseByDay(glucoseEntries, year, month);
  const workoutDayMap = workoutByDay(workouts, year, month);
  const impulseDayMap = impulseByDay(impulseTrades, year, month);

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = firstOfMonth.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long" });

  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i + 7).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { weekday: "short" }),
  );

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate(-1)}
          aria-label={t("journal.calendar.prevMonth")}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-lg)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)]"
        >
          ‹
        </button>
        <div className="font-display text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{monthLabel}</div>
        <button
          onClick={() => onNavigate(1)}
          aria-label={t("journal.calendar.nextMonth")}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-lg)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)]"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1 text-center text-[var(--text-xs)] font-medium text-[var(--text-muted)]">
            {w}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day == null) return <div key={idx} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEntries = entriesByDay.get(key) ?? [];
          const dayEvents = eventsByDay.get(key) ?? [];
          const daySchedules = schedulesByDay.get(key) ?? [];
          const dayLedger = ledgerByDay.get(key) ?? [];
          const ledgerIcon = dayLedgerIcon(dayLedger);
          const dayWeight = weightByDay.get(key);
          const dayGlucose = glucoseDayMap.get(key);
          const dayWorkout = workoutDayMap.get(key);
          const dayImpulse = impulseDayMap.get(key);
          const chips = [
            ...dayEvents.map((e) => ({ kind: "event" as const, e })),
            ...daySchedules.map((s) => ({ kind: "schedule" as const, s })),
            ...(dayWeight != null ? [{ kind: "weight" as const, kg: dayWeight }] : []),
            ...(dayGlucose != null ? [{ kind: "glucose" as const, g: dayGlucose }] : []),
            ...(dayWorkout != null ? [{ kind: "workout" as const, w: dayWorkout }] : []),
            ...dayEntries.map((e) => ({ kind: "entry" as const, e })),
            ...(dayImpulse != null ? [{ kind: "impulse" as const }] : []),
          ];
          const isSelected = selectedDay === key;

          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={`flex min-h-[64px] flex-col items-start gap-0.5 rounded-[var(--radius-md)] border p-1 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                isSelected
                  ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)]"
                  : "border-[var(--border-default)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <span className="flex w-full items-center justify-between font-mono text-[var(--text-xs)] text-[var(--text-secondary)]">
                {day}
                {ledgerIcon && <span className="text-[10px]">{ledgerIcon === "expense" ? "💸" : "💰"}</span>}
              </span>
              <span className="flex min-h-[6px] w-full flex-wrap items-center gap-[3px]">
                {chips.slice(0, MAX_CHIPS).map((c, i) => (
                  <span
                    key={i}
                    className="h-[6px] w-[6px] rounded-full"
                    style={{ background: chipDotColor(c.kind) }}
                  />
                ))}
              </span>
              {chips.length > MAX_CHIPS && (
                <span className="text-[var(--text-xs)] text-[var(--text-muted)]">
                  {t("journal.calendar.more", { count: chips.length - MAX_CHIPS })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
