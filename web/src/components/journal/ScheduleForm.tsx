"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ScheduleEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function ScheduleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Pick<ScheduleEntry, "time" | "title" | "memo">;
  onSave: (data: { time: string; title: string; memo: string }) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [time, setTime] = useState(initial?.time ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError(t("journal.schedule.titleRequired"));
      return;
    }
    onSave({ time, title: trimmed, memo: memo.trim() });
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-accent-border-soft)] bg-[var(--color-accent-subtle)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-32" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("journal.schedule.titlePlaceholder")}
          maxLength={60}
          className="min-w-36 flex-1"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={t("journal.schedule.memoPlaceholder")}
          maxLength={200}
          className="min-w-36 flex-1"
        />
        <div className="flex gap-1.5">
          <Button size="sm" onClick={onCancel}>
            {t("journal.compose.cancel")}
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave}>
            {initial ? t("journal.schedule.saveEdit") : t("journal.schedule.save")}
          </Button>
        </div>
      </div>
      {error && <p className="text-[var(--text-sm)] text-[var(--color-error-text)]">{error}</p>}
      <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t("journal.schedule.hint")}</p>
    </div>
  );
}
