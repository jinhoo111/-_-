"use client";

import { dateKey, dayLedgerIcon, glucoseByDay, glucoseStatus, gluStatusColor, healthByDay, impulseByDay, scheduleSort, tagMeta, workoutByDay } from "@/lib/journal/constants";
import type { GlucoseEntry, ImpulseTradeEntry, LedgerEntry, MarketEvent, MemoArchiveEntry, ScheduleEntry, WeightEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";

const MAX_CHIPS = 3;

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
          className="rounded-[var(--radius-control)] px-2.5 py-1 text-[var(--text-lg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
        >
          ‹
        </button>
        <div className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{monthLabel}</div>
        <button
          onClick={() => onNavigate(1)}
          aria-label={t("journal.calendar.nextMonth")}
          className="rounded-[var(--radius-control)] px-2.5 py-1 text-[var(--text-lg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1 text-center text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)]">
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
              className={`flex min-h-[64px] flex-col items-start gap-0.5 rounded-[var(--radius-control)] border p-1 text-left ${
                isSelected
                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-subtle)]"
                  : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-overlay)]"
              }`}
            >
              <span className="flex w-full items-center justify-between text-[var(--text-xs)] text-[var(--color-text-secondary)]">
                {day}
                {ledgerIcon && <span>{ledgerIcon === "expense" ? "💸" : "💰"}</span>}
              </span>
              {chips.slice(0, MAX_CHIPS).map((c, i) =>
                c.kind === "event" ? (
                  <span key={i} className="w-full truncate rounded px-1 text-[var(--text-2xs)] font-medium bg-[var(--color-bg-badge)] text-[var(--color-text-tertiary)]">
                    {t(`journal.event.${c.e.type}`) === `journal.event.${c.e.type}` ? c.e.title : t(`journal.event.${c.e.type}`)}
                  </span>
                ) : c.kind === "schedule" ? (
                  <span key={i} className="w-full truncate rounded px-1 text-[var(--text-2xs)] font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent-indigo)]">
                    📅 {c.s.time ? `${c.s.time} ` : ""}
                    {c.s.title}
                  </span>
                ) : c.kind === "weight" ? (
                  <span key={i} className="w-full truncate rounded px-1 text-[var(--text-2xs)] font-medium bg-[var(--color-info-bg)] text-[var(--color-info)]">
                    ⚖️ {c.kg}
                  </span>
                ) : c.kind === "glucose" ? (
                  (() => {
                    const st = glucoseStatus(c.g.slot, c.g.mgdl);
                    const col = st.key === "high" || st.key === "low" ? gluStatusColor(st.key) : { bg: "--color-info-bg", fg: "--color-info" };
                    return (
                      <span key={i} className="w-full truncate rounded px-1 text-[var(--text-2xs)] font-medium" style={{ background: `var(${col.bg})`, color: `var(${col.fg})` }}>
                        🩸 {c.g.mgdl}
                      </span>
                    );
                  })()
                ) : c.kind === "workout" ? (
                  <span
                    key={i}
                    className="w-full truncate rounded px-1 text-[var(--text-2xs)] font-medium"
                    style={{
                      background: c.w === "done" ? "var(--color-success-bg)" : "var(--color-bg-overlay)",
                      color: c.w === "done" ? "var(--color-success-text)" : "var(--color-text-muted)",
                    }}
                  >
                    {c.w === "done" ? "💪" : "🛌"} {t(c.w === "done" ? "journal.workout.done" : "journal.workout.off")}
                  </span>
                ) : c.kind === "impulse" ? (
                  <span
                    key={i}
                    className="w-full truncate rounded px-1 text-[var(--text-2xs)] font-bold"
                    style={{ background: "var(--color-error-bg)", color: "var(--color-error-text)" }}
                  >
                    🧨 {t("journal.impulse.chip")}
                  </span>
                ) : (
                  <span
                    key={i}
                    className="w-full truncate rounded px-1 text-[var(--text-2xs)] font-medium"
                    style={{ background: `var(${tagMeta(c.e.tag).bg})`, color: `var(${tagMeta(c.e.tag).fg})` }}
                  >
                    {c.e.text}
                  </span>
                ),
              )}
              {chips.length > MAX_CHIPS && (
                <span className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">{t("journal.calendar.more", { count: chips.length - MAX_CHIPS })}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
