"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LineChart } from "@/components/journal/charts/LineChart";
import { BarChart } from "@/components/journal/charts/BarChart";
import { GroupedBarChart } from "@/components/journal/charts/GroupedBarChart";
import { fmtWon, ledgerMonthTotals, roundKg, rptWeeks, weeklyActuals, weeklyTargets, weeklyWeights, ymKey } from "@/lib/journal/constants";
import type { Budget, Health, ImpulseTradeEntry, LedgerEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[18px_20px] shadow-[var(--shadow-card)]">
      <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{title}</div>
      {children}
    </div>
  );
}

export function ReportView({
  year,
  month,
  budget,
  ledger,
  health,
  impulseTrades,
  onNavigate,
  onSaveBudget,
  onSaveWeekAllocation,
  onResetWeekAllocation,
  onSaveWeightGoal,
  onSaveWeeklyWeight,
  onResetWeeklyWeight,
}: {
  year: number;
  month: number;
  budget: Budget;
  ledger: LedgerEntry[];
  health: Health;
  impulseTrades: ImpulseTradeEntry[];
  onNavigate: (dir: -1 | 1) => void;
  onSaveBudget: (income: number | null, expense: number | null) => void;
  onSaveWeekAllocation: (kind: "income" | "expense", weeks: (number | null)[] | null) => void;
  onResetWeekAllocation: (kind: "income" | "expense") => void;
  onSaveWeightGoal: (goal: number | null) => void;
  onSaveWeeklyWeight: (weeks: (number | null)[] | null) => void;
  onResetWeeklyWeight: () => void;
}) {
  const t = useT();
  const ym = ymKey(year, month);
  const weeks = rptWeeks(year, month);
  const weekLabels = weeks.map((w) => t("journal.report.allocWeek", { n: w.idx }));

  const bm = budget[ym];
  const [incomeInput, setIncomeInput] = useState(bm?.income != null ? String(bm.income) : "");
  const [expenseInput, setExpenseInput] = useState(bm?.expense != null ? String(bm.expense) : "");
  const [allocOpen, setAllocOpen] = useState(false);
  const [weightWkOpen, setWeightWkOpen] = useState(false);

  const targets = weeklyTargets(budget, year, month);
  const actuals = weeklyActuals(ledger, year, month, weeks);
  const [allocIncome, setAllocIncome] = useState<string[]>(targets.inc.map((v) => (v != null ? String(Math.round(v)) : "")));
  const [allocExpense, setAllocExpense] = useState<string[]>(targets.exp.map((v) => (v != null ? String(Math.round(v)) : "")));

  const goal = health.monthlyGoals[ym] ?? null;
  const [goalInput, setGoalInput] = useState(goal != null ? String(goal) : "");
  const weights = weeklyWeights(health, year, month, weeks);
  const [weightWkInput, setWeightWkInput] = useState<string[]>(weights.map((v) => (v != null ? String(v) : "")));

  const monthTotals = ledgerMonthTotals(ledger, year, month);
  const monthImpulseCount = impulseTrades.filter((e) => e.date.startsWith(ym)).length;
  const weeklyImpulseCounts = weeks.map((w) => impulseTrades.filter((e) => e.date >= w.start.toISOString().slice(0, 10) && e.date <= w.end.toISOString().slice(0, 10)).length);

  const incTargetSum: number = targets.inc.reduce((s: number, v) => s + (v ?? 0), 0);
  const incActualSum = actuals.inc.reduce((s, v) => s + v, 0);
  const incPct = incTargetSum > 0 ? Math.round((incActualSum / incTargetSum) * 100) : 0;

  const expTargetSum: number = targets.exp.reduce((s: number, v) => s + (v ?? 0), 0);
  const expActualSum = actuals.exp.reduce((s, v) => s + v, 0);
  const expPct = expTargetSum > 0 ? Math.round((expActualSum / expTargetSum) * 100) : 0;

  const latestWeight = weights.filter((v): v is number => v != null).at(-1) ?? null;
  const weightDiff = latestWeight != null && goal != null ? latestWeight - goal : null;

  function handleSaveAlloc(kind: "income" | "expense") {
    const raw = kind === "income" ? allocIncome : allocExpense;
    const parsed = raw.map((s) => {
      const v = parseFloat(s);
      return isFinite(v) ? Math.round(v) : null;
    });
    onSaveWeekAllocation(kind, parsed.every((v) => v == null) ? null : parsed);
  }

  function handleSaveWeightWeeks() {
    const parsed = weightWkInput.map((s) => {
      const v = parseFloat(s);
      return v > 0 ? roundKg(v) : null;
    });
    onSaveWeeklyWeight(parsed.every((v) => v == null) ? null : parsed);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => onNavigate(-1)} className="text-[var(--text-md)] text-[var(--color-text-secondary)]">
          {t("journal.report.periodPrev")}
        </button>
        <span className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{ym}</span>
        <button onClick={() => onNavigate(1)} className="text-[var(--text-md)] text-[var(--color-text-secondary)]">
          {t("journal.report.periodNext")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("journal.report.kpiNet"), value: fmtWon(monthTotals.net) },
          { label: t("journal.report.kpiIncome"), value: fmtWon(monthTotals.inc) },
          { label: t("journal.report.kpiExpense"), value: fmtWon(monthTotals.exp) },
          { label: t("journal.report.kpiImpulse"), value: String(monthImpulseCount) },
        ].map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-3">
            <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{kpi.label}</span>
            <span className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{kpi.value}</span>
          </div>
        ))}
      </div>

      <Card title={t("journal.report.budgetTitle")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{t("journal.report.budgetIncome")}</span>
          <Input type="number" min={0} value={incomeInput} onChange={(e) => setIncomeInput(e.target.value)} className="w-32" />
          <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{t("journal.report.budgetExpense")}</span>
          <Input type="number" min={0} value={expenseInput} onChange={(e) => setExpenseInput(e.target.value)} className="w-32" />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const inc = parseFloat(incomeInput);
              const exp = parseFloat(expenseInput);
              onSaveBudget(inc >= 0 ? Math.round(inc) : null, exp >= 0 ? Math.round(exp) : null);
            }}
          >
            {t("journal.report.save")}
          </Button>
        </div>

        <button onClick={() => setAllocOpen((v) => !v)} className="self-start text-[var(--text-xs)] text-[var(--color-text-tertiary)] hover:underline">
          {t("journal.report.allocToggle")}
        </button>
        {allocOpen && (
          <div className="flex flex-col gap-3">
            {(["income", "expense"] as const).map((kind) => {
              const raw = kind === "income" ? allocIncome : allocExpense;
              const setter = kind === "income" ? setAllocIncome : setAllocExpense;
              const target = kind === "income" ? incTargetSum : expTargetSum;
              const sum = raw.reduce((s, v) => s + (parseFloat(v) || 0), 0);
              return (
                <div key={kind} className="flex flex-col gap-1.5">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-text-secondary)]">
                    {kind === "income" ? t("journal.report.budgetIncome") : t("journal.report.budgetExpense")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {weekLabels.map((label, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{label}</span>
                        <Input
                          type="number"
                          min={0}
                          value={raw[i] ?? ""}
                          onChange={(e) => setter((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                          className="w-24"
                        />
                      </span>
                    ))}
                  </div>
                  <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    {t("journal.report.allocSum", { sum: fmtWon(sum), target: fmtWon(target), diff: fmtWon(sum - target) })}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveAlloc(kind)}>
                      {t("journal.report.allocSave")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onResetWeekAllocation(kind);
                        setter(Array(weeks.length).fill(""));
                      }}
                    >
                      {t("journal.report.allocReset")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title={t("journal.report.incomeChartTitle")}>
        <GroupedBarChart
          xLabels={weekLabels}
          fmtY={(v) => fmtWon(v)}
          fmtLabel={(v) => fmtWon(v)}
          series={[
            { label: t("journal.report.seriesTarget"), color: "var(--color-info)", values: targets.inc, outline: true },
            { label: t("journal.report.seriesActual"), color: "var(--color-info)", values: actuals.inc },
          ]}
        />
        <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t("journal.report.incomeAchieved", { pct: incPct })}</span>
      </Card>

      <Card title={t("journal.report.expenseChartTitle")}>
        <GroupedBarChart
          xLabels={weekLabels}
          fmtY={(v) => fmtWon(v)}
          fmtLabel={(v) => fmtWon(v)}
          series={[
            { label: t("journal.report.seriesTarget"), color: "var(--color-error-text)", values: targets.exp, outline: true },
            { label: t("journal.report.seriesActual"), color: "var(--color-error-text)", values: actuals.exp },
          ]}
        />
        <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t("journal.report.expenseUsed", { pct: expPct })}</span>
      </Card>

      <Card title={t("journal.report.impulseChartTitle")}>
        <BarChart xLabels={weekLabels} values={weeklyImpulseCounts} />
      </Card>

      <Card title={t("journal.report.weightGoalTitle")}>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            step={0.1}
            min={0}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder={t("journal.report.weightGoalPlaceholder")}
            className="w-24"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const v = parseFloat(goalInput);
              onSaveWeightGoal(v > 0 ? roundKg(v) : null);
            }}
          >
            {t("journal.report.save")}
          </Button>
          {latestWeight != null && goal != null && weightDiff != null && (
            <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">
              {t("journal.report.weightGoalCompare", { latest: latestWeight, goal, diffSign: weightDiff >= 0 ? "+" : "", diff: weightDiff.toFixed(1) })}
            </span>
          )}
        </div>

        <button onClick={() => setWeightWkOpen((v) => !v)} className="self-start text-[var(--text-xs)] text-[var(--color-text-tertiary)] hover:underline">
          {t("journal.report.weightWkToggle")}
        </button>
        {weightWkOpen && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              {weekLabels.map((label, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{label}</span>
                  <Input
                    type="number"
                    step={0.1}
                    min={0}
                    value={weightWkInput[i] ?? ""}
                    onChange={(e) => setWeightWkInput((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                    className="w-20"
                  />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveWeightWeeks}>
                {t("journal.report.allocSave")}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onResetWeeklyWeight();
                  setWeightWkInput(Array(weeks.length).fill(""));
                }}
              >
                {t("journal.report.allocReset")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card title={t("journal.report.weightChartTitle")}>
        <LineChart
          xLabels={weekLabels}
          noDataLabel={t("journal.report.noData")}
          series={[{ label: t("journal.report.seriesActual"), color: "var(--color-accent-indigo)", points: weights }]}
          hlines={goal != null ? [{ y: goal, color: "var(--color-error-text)", label: t("journal.report.seriesGoal") }] : []}
        />
      </Card>
    </div>
  );
}
