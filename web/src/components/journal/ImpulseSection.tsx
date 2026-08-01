"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ImpulseTradeEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function ImpulseSection({
  entry,
  onSave,
  onDelete,
}: {
  entry: ImpulseTradeEntry | undefined;
  onSave: (reason: string) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState("");

  function openForm() {
    setReason(entry?.reason ?? "");
    setFormOpen((cur) => !cur);
  }

  function save() {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setFormOpen(false);
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-[var(--radius-control)] border p-3"
      style={{ borderColor: entry ? "var(--color-error-border)" : "var(--color-border-default)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[var(--text-sm)] font-semibold"
          style={{ color: entry ? "var(--color-error-text)" : "var(--color-text-primary)" }}
        >
          {entry ? t("journal.impulse.recordedTitle") : t("journal.impulse.checkTitle")}
        </span>
        {entry ? (
          <div className="flex gap-1.5">
            <button onClick={openForm} className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] hover:underline">
              {t("journal.impulse.editReason")}
            </button>
            <button onClick={onDelete} className="text-[var(--text-xs)] text-[var(--color-error)] hover:underline">
              {t("journal.impulse.clear")}
            </button>
          </div>
        ) : (
          <Button size="sm" onClick={openForm} className="border-[var(--color-error-border)] text-[var(--color-error)]">
            {t("journal.impulse.add")}
          </Button>
        )}
      </div>

      {entry && !formOpen && (
        <>
          <p className="whitespace-pre-wrap rounded-[8px] bg-[var(--color-error-bg)] p-[8px_10px] text-[var(--text-sm)] leading-relaxed text-[var(--color-text-secondary)]">
            {entry.reason}
          </p>
          <p className="text-[var(--text-xs)] text-[var(--color-error-text)]">{t("journal.impulse.warning")}</p>
        </>
      )}

      {!entry && !formOpen && <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("journal.impulse.hint")}</p>}

      {formOpen && (
        <div className="flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("journal.impulse.placeholder")}
            autoFocus
            className="min-h-[80px] w-full rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] p-2 text-[var(--text-sm)] text-[var(--color-text-primary)]"
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setFormOpen(false)}
              className="rounded-[6px] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] px-3 py-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]"
            >
              {t("journal.impulse.cancel")}
            </button>
            <button
              onClick={save}
              disabled={!reason.trim()}
              className="rounded-[6px] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-3.5 py-1 text-[var(--text-sm)] font-bold text-[var(--color-error-text)] disabled:opacity-50"
            >
              {t("journal.impulse.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
