"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useMarketEvents } from "@/lib/queries/useMarketEvents";
import { dateKey, fmtWon, glucoseStats, gluSlotLabelKey, healthStats, ledgerMonthTotals, noonLocalIso, roundKg, ymKey } from "@/lib/journal/constants";
import type {
  GlucoseEntry,
  GlucoseSlot,
  ImpulseTradeEntry,
  LedgerEntry,
  LedgerType,
  MemoArchiveEntry,
  MemoTag,
  PhilosophyEntry,
  PhilosophyType,
  ScheduleEntry,
  WeightEntry,
} from "@/lib/types/userData";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { JournalTabs, type JournalView } from "@/components/journal/JournalTabs";
import { CalendarGrid } from "@/components/journal/CalendarGrid";
import { CalendarDayPanel } from "@/components/journal/CalendarDayPanel";
import { ArchiveView } from "@/components/journal/ArchiveView";
import { PhilosophyView } from "@/components/journal/PhilosophyView";
import { ReportView } from "@/components/journal/ReportView";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function JournalPage() {
  const t = useT();
  const { data: userData, isLoading } = useUserData();
  const updateUserData = useUpdateUserData();
  const events = useMarketEvents();

  const now = new Date();
  const [view, setView] = useState<JournalView>("calendar");
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth());

  const memoArchive = userData?.memo_archive ?? [];
  const schedules = userData?.schedules ?? [];
  const ledger = userData?.ledger ?? [];
  const health = userData?.health;
  const weightEntries = health?.entries ?? [];
  const glucoseEntries = health?.glucose ?? [];
  const workouts = health?.workouts ?? {};
  const impulseTrades = userData?.impulse_trades ?? [];
  const budget = userData?.budget ?? {};
  const investPhilosophy = userData?.invest_philosophy ?? [];
  const notifyEnabled = userData?.notify_enabled ?? true;
  const [impulseSortDir, setImpulseSortDir] = useState<"asc" | "desc">("desc");
  const ym = ymKey(calYear, calMonth);
  const weightGoal = health?.monthlyGoals[ym] ?? null;
  const glucoseGoal = health?.glucoseGoals[ym] ?? null;
  const [goalInput, setGoalInput] = useState(weightGoal != null ? String(weightGoal) : "");
  const [glucoseGoalInput, setGlucoseGoalInput] = useState(glucoseGoal != null ? String(glucoseGoal) : "");
  const [goalInputYm, setGoalInputYm] = useState(ym);
  if (ym !== goalInputYm) {
    setGoalInputYm(ym);
    setGoalInput(weightGoal != null ? String(weightGoal) : "");
    setGlucoseGoalInput(glucoseGoal != null ? String(glucoseGoal) : "");
  }

  // One-time migration of legacy `memos` entries into `memo_archive`.
  useEffect(() => {
    const legacy = userData?.memos;
    if (!legacy || legacy.length === 0) return;
    const migrated: MemoArchiveEntry[] = (legacy as Record<string, unknown>[]).map((m) => ({
      id: (m.id as string) ?? crypto.randomUUID(),
      text: (m.text as string) ?? "",
      tag: (m.tag as MemoTag) ?? "general",
      time: (m.time as string) ?? new Date().toISOString(),
      completedAt: (m.completedAt as string) ?? (m.time as string) ?? new Date().toISOString(),
      important: !!m.important,
    }));
    updateUserData({ memo_archive: [...migrated, ...memoArchive], memos: [] }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.memos]);

  const eventsInMonth = useMemo(
    () => events.filter((e) => e.date.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, "0")}`)),
    [events, calYear, calMonth],
  );

  const dayEntries = selectedDay ? memoArchive.filter((e) => dateKey(new Date(e.completedAt || e.time)) === selectedDay) : [];
  const dayEvents = selectedDay ? events.filter((e) => e.date === selectedDay) : [];
  const daySchedules = selectedDay ? schedules.filter((s) => s.date === selectedDay) : [];
  const dayLedger = selectedDay ? ledger.filter((l) => l.date === selectedDay) : [];
  const dayImpulse = selectedDay ? impulseTrades.find((e) => e.date === selectedDay) : undefined;
  const monthTotals = ledgerMonthTotals(ledger, calYear, calMonth);
  const weightSummary = healthStats(weightEntries, calYear, calMonth, weightGoal);
  const glucoseSummary = glucoseStats(glucoseEntries, calYear, calMonth);

  function handleNavigateMonth(direction: -1 | 1) {
    let nextMonth = calMonth + direction;
    let nextYear = calYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setCalMonth(nextMonth);
    setCalYear(nextYear);
    setSelectedDay(null);
  }

  function handleSelectDay(key: string) {
    setSelectedDay((prev) => (prev === key ? null : key));
  }

  function handleSaveMemo(data: { text: string; tag: MemoTag; important: boolean }, editId?: string) {
    if (!selectedDay) return;
    const [y, m, d] = selectedDay.split("-").map(Number);
    if (editId) {
      const next = memoArchive.map((e) => (e.id === editId ? { ...e, ...data } : e));
      updateUserData({ memo_archive: next });
    } else {
      const iso = noonLocalIso(y, m - 1, d);
      const entry: MemoArchiveEntry = { id: crypto.randomUUID(), text: data.text, tag: data.tag, important: data.important, time: iso, completedAt: iso };
      updateUserData({ memo_archive: [entry, ...memoArchive] });
    }
  }

  function handleDeleteMemo(id: string) {
    updateUserData({ memo_archive: memoArchive.filter((e) => e.id !== id) });
  }

  function handleToggleMemoNotify(id: string) {
    updateUserData({ memo_archive: memoArchive.map((e) => (e.id === id ? { ...e, notify: !e.notify } : e)) }, true);
  }

  function handleSaveSchedule(data: { time: string; title: string; memo: string }, editId?: string) {
    if (!selectedDay) return;
    if (editId) {
      const next = schedules.map((s) => (s.id === editId ? { ...s, ...data } : s));
      updateUserData({ schedules: next });
    } else {
      const entry: ScheduleEntry = { id: crypto.randomUUID(), date: selectedDay, ...data };
      updateUserData({ schedules: [...schedules, entry] });
    }
  }

  function handleDeleteSchedule(id: string) {
    updateUserData({ schedules: schedules.filter((s) => s.id !== id) });
  }

  function handleSaveLedger(data: { type: LedgerType; amount: number; cat: string; memo: string }) {
    if (!selectedDay) return;
    const entry: LedgerEntry = { id: crypto.randomUUID(), date: selectedDay, ...data };
    updateUserData({ ledger: [...ledger, entry] });
  }

  function handleDeleteLedger(id: string) {
    updateUserData({ ledger: ledger.filter((l) => l.id !== id) });
  }

  function handleSaveWeight(kg: number) {
    if (!selectedDay || !health) return;
    const next: WeightEntry[] = [...health.entries.filter((e) => e.date !== selectedDay), { date: selectedDay, kg }];
    updateUserData({ health: { ...health, entries: next } });
  }

  function handleDeleteWeight() {
    if (!selectedDay || !health) return;
    updateUserData({ health: { ...health, entries: health.entries.filter((e) => e.date !== selectedDay) } });
  }

  function handleSaveGoal() {
    if (!health) return;
    const v = parseFloat(goalInput);
    const nextGoals = { ...health.monthlyGoals };
    if (v > 0) nextGoals[ym] = roundKg(v);
    else delete nextGoals[ym];
    updateUserData({ health: { ...health, monthlyGoals: nextGoals } });
  }

  function handleSaveGlucose(slot: GlucoseSlot, mgdl: number) {
    if (!selectedDay || !health) return;
    const next: GlucoseEntry[] = [...health.glucose.filter((e) => !(e.date === selectedDay && e.slot === slot)), { date: selectedDay, slot, mgdl }];
    updateUserData({ health: { ...health, glucose: next } });
  }

  function handleDeleteGlucose(slot: GlucoseSlot) {
    if (!selectedDay || !health) return;
    updateUserData({ health: { ...health, glucose: health.glucose.filter((e) => !(e.date === selectedDay && e.slot === slot)) } });
  }

  function handleSaveGlucoseGoal() {
    if (!health) return;
    const v = parseInt(glucoseGoalInput, 10);
    const nextGoals = { ...health.glucoseGoals };
    if (v > 0) nextGoals[ym] = v;
    else delete nextGoals[ym];
    updateUserData({ health: { ...health, glucoseGoals: nextGoals } });
  }

  function handleSetWorkout(val: "done" | "off") {
    if (!selectedDay || !health) return;
    const next = { ...health.workouts };
    if (next[selectedDay] === val) delete next[selectedDay];
    else next[selectedDay] = val;
    updateUserData({ health: { ...health, workouts: next } });
  }

  function handleSaveImpulse(reason: string) {
    if (!selectedDay) return;
    const existing = impulseTrades.find((e) => e.date === selectedDay);
    const next: ImpulseTradeEntry[] = existing
      ? impulseTrades.map((e) => (e.date === selectedDay ? { ...e, reason } : e))
      : [{ id: crypto.randomUUID(), date: selectedDay, reason, createdAt: new Date().toISOString() }, ...impulseTrades];
    updateUserData({ impulse_trades: next });
  }

  function handleDeleteImpulse() {
    if (!selectedDay) return;
    updateUserData({ impulse_trades: impulseTrades.filter((e) => e.date !== selectedDay) });
  }

  function handleDeleteImpulseById(id: string) {
    updateUserData({ impulse_trades: impulseTrades.filter((e) => e.id !== id) });
  }

  function handleTogglePhilosophy(sourceId: string, type: PhilosophyType) {
    const existing = investPhilosophy.find((p) => p.sourceId === sourceId);
    let next: PhilosophyEntry[];
    if (existing && existing.type === type) {
      next = investPhilosophy.filter((p) => p.id !== existing.id);
    } else if (existing) {
      next = investPhilosophy.map((p) => (p.id === existing.id ? { ...p, type } : p));
    } else {
      const src = memoArchive.find((m) => m.id === sourceId);
      if (!src) return;
      next = [...investPhilosophy, { id: crypto.randomUUID(), text: src.text, type, sourceId, createdAt: new Date().toISOString() }];
    }
    updateUserData({ invest_philosophy: next });
  }

  function handleToggleNotifyMaster() {
    updateUserData({ notify_enabled: !notifyEnabled }, true);
  }

  function handleDeletePhilosophy(id: string) {
    updateUserData({ invest_philosophy: investPhilosophy.filter((p) => p.id !== id) });
  }

  function handleMovePhilosophy(id: string, dir: -1 | 1) {
    const target = investPhilosophy.find((p) => p.id === id);
    if (!target) return;
    const sameTypeIds = investPhilosophy.filter((p) => p.type === target.type).map((p) => p.id);
    const pos = sameTypeIds.indexOf(id);
    const swapPos = pos + dir;
    if (swapPos < 0 || swapPos >= sameTypeIds.length) return;
    const swapId = sameTypeIds[swapPos];
    const a = investPhilosophy.findIndex((p) => p.id === id);
    const b = investPhilosophy.findIndex((p) => p.id === swapId);
    const next = [...investPhilosophy];
    [next[a], next[b]] = [next[b], next[a]];
    updateUserData({ invest_philosophy: next });
  }

  function handleNavigateReportMonth(direction: -1 | 1) {
    let nextMonth = reportMonth + direction;
    let nextYear = reportYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setReportMonth(nextMonth);
    setReportYear(nextYear);
  }

  const reportYm = ymKey(reportYear, reportMonth);

  function handleSaveBudget(income: number | null, expense: number | null) {
    updateUserData({ budget: { ...budget, [reportYm]: { ...(budget[reportYm] ?? { income: null, expense: null }), income, expense } } });
  }

  function handleSaveWeekAllocation(kind: "income" | "expense", weeksArr: (number | null)[] | null) {
    const key = kind === "income" ? "incomeWeeks" : "expenseWeeks";
    const current = budget[reportYm] ?? { income: null, expense: null };
    const next = { ...current, [key]: weeksArr ?? undefined };
    if (weeksArr == null) delete (next as Record<string, unknown>)[key];
    updateUserData({ budget: { ...budget, [reportYm]: next } });
  }

  function handleResetWeekAllocation(kind: "income" | "expense") {
    handleSaveWeekAllocation(kind, null);
  }

  function handleSaveWeightGoal(goal: number | null) {
    if (!health) return;
    const nextGoals = { ...health.monthlyGoals };
    if (goal != null) nextGoals[reportYm] = goal;
    else delete nextGoals[reportYm];
    updateUserData({ health: { ...health, monthlyGoals: nextGoals } });
  }

  function handleSaveWeeklyWeight(weeksArr: (number | null)[] | null) {
    if (!health) return;
    const next = { ...health.weeklyActual };
    if (weeksArr == null) delete next[reportYm];
    else next[reportYm] = weeksArr;
    updateUserData({ health: { ...health, weeklyActual: next } });
  }

  function handleResetWeeklyWeight() {
    handleSaveWeeklyWeight(null);
  }

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const selectedDayLabel = selectedDay
    ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)]">{t("nav.journal")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleNotifyMaster}
            className={`rounded-[var(--radius-control)] border px-3 py-1 text-[var(--text-sm)] ${
              notifyEnabled
                ? "border-[var(--color-success)] bg-[var(--color-success-bg-light)] text-[var(--color-success)]"
                : "border-[var(--color-border-input)] bg-[var(--color-bg-surface)] text-[var(--color-text-tertiary)]"
            }`}
          >
            {notifyEnabled ? t("journal.notify.on") : t("journal.notify.off")}
          </button>
          <JournalTabs view={view} onChange={setView} />
        </div>
      </div>

      {view === "calendar" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            <p>{t("journal.ledger.monthSummary", { inc: fmtWon(monthTotals.inc), exp: fmtWon(monthTotals.exp), net: fmtWon(monthTotals.net) })}</p>
            <div className="flex flex-wrap items-center gap-2">
              {weightSummary && (
                <span>
                  {t("journal.weight.summary", {
                    start: weightSummary.start,
                    latest: weightSummary.latest,
                    diffSign: weightSummary.diff >= 0 ? "+" : "",
                    diff: weightSummary.diff.toFixed(1),
                    pctSign: weightSummary.pct >= 0 ? "+" : "",
                    pct: weightSummary.pct.toFixed(1),
                  })}
                  {weightSummary.goal != null && weightSummary.goalRemain != null && weightSummary.goalPct != null && (
                    <>
                      {" · "}
                      {t("journal.weight.summaryGoal", {
                        goal: weightSummary.goal,
                        remain: weightSummary.goalRemain.toFixed(1),
                        pct: weightSummary.goalPct.toFixed(0),
                      })}
                    </>
                  )}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                {t("journal.weight.goalLabel")}
                <Input type="number" step={0.1} min={0} value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="w-20" />
                <Button size="sm" onClick={handleSaveGoal}>
                  {t("journal.weight.goalSet")}
                </Button>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {glucoseSummary
                  ? [
                      glucoseSummary.fastAvg != null ? t("journal.glucose.summary.fastAvg", { v: glucoseSummary.fastAvg }) : null,
                      glucoseSummary.postAvg != null ? t("journal.glucose.summary.postAvg", { v: glucoseSummary.postAvg }) : null,
                      t("journal.glucose.summary.max", {
                        mgdl: glucoseSummary.max.mgdl,
                        date: glucoseSummary.max.date.slice(5).replace("-", "/"),
                        slot: t(gluSlotLabelKey(glucoseSummary.max.slot)),
                      }),
                      t("journal.glucose.summary.days", { days: glucoseSummary.days }),
                    ]
                      .filter(Boolean)
                      .join(" · ")
                      .replace(/^/, "🩸 ")
                  : t("journal.glucose.summaryNoData")}
              </span>
              <span className="flex items-center gap-1.5">
                {t("journal.glucose.goalLabel")}
                <Input type="number" step={1} min={0} value={glucoseGoalInput} onChange={(e) => setGlucoseGoalInput(e.target.value)} className="w-20" />
                <span className="text-[var(--text-xs)]">mg/dL</span>
                <Button size="sm" onClick={handleSaveGlucoseGoal}>
                  {t("journal.glucose.goalSet")}
                </Button>
              </span>
            </div>
          </div>
          <div className="rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[18px_20px] shadow-[var(--shadow-card)]">
            <CalendarGrid
              year={calYear}
              month={calMonth}
              entries={memoArchive}
              events={eventsInMonth}
              schedules={schedules}
              ledger={ledger}
              weightEntries={weightEntries}
              glucoseEntries={glucoseEntries}
              workouts={workouts}
              impulseTrades={impulseTrades}
              selectedDay={selectedDay}
              onSelectDay={handleSelectDay}
              onNavigate={handleNavigateMonth}
            />
          </div>
          {selectedDay && (
            <CalendarDayPanel
              dayLabel={selectedDayLabel}
              selectedDate={selectedDay}
              entries={dayEntries}
              events={dayEvents}
              schedules={daySchedules}
              ledger={dayLedger}
              weightEntries={weightEntries}
              weightGoal={weightGoal}
              glucoseEntries={glucoseEntries}
              workout={workouts[selectedDay]}
              impulse={dayImpulse}
              onSave={handleSaveMemo}
              onDelete={handleDeleteMemo}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onSaveImpulse={handleSaveImpulse}
              onDeleteImpulse={handleDeleteImpulse}
              onSaveLedger={handleSaveLedger}
              onDeleteLedger={handleDeleteLedger}
              onSaveWeight={handleSaveWeight}
              onDeleteWeight={handleDeleteWeight}
              onSaveGlucose={handleSaveGlucose}
              onDeleteGlucose={handleDeleteGlucose}
              onSetWorkout={handleSetWorkout}
            />
          )}
        </div>
      ) : view === "report" ? (
        health && (
          <ReportView
            year={reportYear}
            month={reportMonth}
            budget={budget}
            ledger={ledger}
            health={health}
            impulseTrades={impulseTrades}
            onNavigate={handleNavigateReportMonth}
            onSaveBudget={handleSaveBudget}
            onSaveWeekAllocation={handleSaveWeekAllocation}
            onResetWeekAllocation={handleResetWeekAllocation}
            onSaveWeightGoal={handleSaveWeightGoal}
            onSaveWeeklyWeight={handleSaveWeeklyWeight}
            onResetWeeklyWeight={handleResetWeeklyWeight}
          />
        )
      ) : view === "archive" ? (
        <ArchiveView
          entries={memoArchive}
          philosophy={investPhilosophy}
          onTogglePhilosophy={handleTogglePhilosophy}
          onToggleNotify={handleToggleMemoNotify}
        />
      ) : (
        <PhilosophyView
          philosophy={investPhilosophy}
          impulseTrades={impulseTrades}
          impulseSortDir={impulseSortDir}
          onToggleImpulseSort={() => setImpulseSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          onMove={handleMovePhilosophy}
          onDelete={handleDeletePhilosophy}
          onDeleteImpulseById={handleDeleteImpulseById}
        />
      )}
    </div>
  );
}
