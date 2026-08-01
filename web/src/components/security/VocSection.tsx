"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useDeleteVoc,
  useSetVocStatus,
  useVocRequests,
  type VocStatus,
} from "@/lib/queries/useSecurityAdmin";

const STATUSES: VocStatus[] = ["진행중", "보류", "완료"];

function exportVocCsv(rows: { created_at: string; email: string | null; user_type: string | null; category: string | null; message: string; status: VocStatus | null }[]) {
  const header = ["date", "email", "user_type", "category", "message", "status"];
  const lines = rows.map((r) =>
    [r.created_at, r.email ?? "", r.user_type ?? "", r.category ?? "", r.message.replace(/\n/g, " "), r.status ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "voc_requests.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function VocSection() {
  const t = useT();
  const { data: rows, isLoading, error } = useVocRequests();
  const setStatus = useSetVocStatus();
  const deleteVoc = useDeleteVoc();
  const [query, setQuery] = useState("");

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <EmptyState title={t("security.voc.error")} />;

  const all = rows ?? [];
  const filtered = query
    ? all.filter((r) => (r.email ?? "").toLowerCase().includes(query.toLowerCase()) || r.message.toLowerCase().includes(query.toLowerCase()))
    : all;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("security.voc.searchPlaceholder")}
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => exportVocCsv(filtered)} disabled={!filtered.length} className="ml-auto">
          {t("security.voc.exportCsv")}
        </Button>
      </div>

      {!filtered.length ? (
        <EmptyState title={t("security.voc.empty")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[var(--text-table)]">
            <thead>
              <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                <th className="py-2 pr-2">{t("security.voc.col.date")}</th>
                <th className="py-2 pr-2">{t("security.voc.col.email")}</th>
                <th className="py-2 pr-2">{t("security.voc.col.type")}</th>
                <th className="py-2 pr-2">{t("security.voc.col.category")}</th>
                <th className="py-2 pr-2">{t("security.voc.col.message")}</th>
                <th className="py-2 pr-2">{t("security.voc.col.status")}</th>
                <th className="py-2 pr-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border-faint)] align-top">
                  <td className="py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-2">{r.email ?? "—"}</td>
                  <td className="py-2 pr-2">{r.user_type === "business" ? t("security.voc.type.business") : t("security.voc.type.personal")}</td>
                  <td className="py-2 pr-2">{r.category ?? "—"}</td>
                  <td className="max-w-[320px] py-2 pr-2 whitespace-pre-wrap text-[var(--text-sm)]">{r.message}</td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-1">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus.mutate({ id: r.id, status: r.status === s ? null : s })}
                          className={`rounded-full px-2 py-0.5 text-[var(--text-sm)] ${
                            r.status === s
                              ? "bg-[var(--color-accent-primary)] text-[var(--color-accent-on)]"
                              : "border border-[var(--color-border-default)] text-[var(--color-text-tertiary)]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <Button size="sm" onClick={() => deleteVoc.mutate(r.id)}>
                      {t("security.delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
