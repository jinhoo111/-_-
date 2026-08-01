"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import type { MonitorMemo } from "@/lib/types/userData";

export function MonitorMemoList({ memos, onDelete }: { memos: MonitorMemo[]; onDelete: (id: number) => void }) {
  const t = useT();
  if (!memos.length) return <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.memo.empty")}</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {memos.map((m) => (
        <li key={m.id} className="flex items-start justify-between gap-2 rounded-[var(--radius-control)] bg-[var(--color-bg-overlay)] px-2.5 py-1.5">
          <div>
            <p className="text-[var(--text-md)] text-[var(--color-text-primary)]">{m.text}</p>
            {m.source && (
              <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                {m.source.disclosure_title} · {m.source.disclosure_date}
              </p>
            )}
            <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{new Date(m.time).toLocaleString()}</p>
          </div>
          <button onClick={() => onDelete(m.id)} className="text-[var(--text-sm)] text-[var(--color-error)]">
            {t("monitor.memo.delete")}
          </button>
        </li>
      ))}
    </ul>
  );
}
