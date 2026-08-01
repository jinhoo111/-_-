"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TAG_KEYS } from "@/lib/journal/constants";
import type { MemoArchiveEntry, MemoTag } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function MemoComposeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Pick<MemoArchiveEntry, "text" | "tag" | "important">;
  onSave: (data: { text: string; tag: MemoTag; important: boolean }) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [text, setText] = useState(initial?.text ?? "");
  const [tag, setTag] = useState<MemoTag>(initial?.tag ?? "general");
  const [important, setImportant] = useState(!!initial?.important);

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave({ text: trimmed, tag, important });
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("journal.compose.placeholder")}
        rows={2}
        className="w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] p-2 text-[var(--text-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-info)]"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {TAG_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setTag(k)}
            className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-xs)] font-medium ${
              tag === k ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
            }`}
          >
            {t(`journal.tag.${k}`)}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-1.5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
          <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
          {t("journal.compose.important")}
        </label>
        <div className="ml-auto flex gap-1.5">
          <Button size="sm" onClick={onCancel}>
            {t("journal.compose.cancel")}
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave}>
            {t("journal.compose.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
