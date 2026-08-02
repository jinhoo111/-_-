"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useAccounts,
  useDeleteAccount,
  useSetAccountApproved,
  useSetAccountType,
} from "@/lib/queries/useSecurityAdmin";
import { createClient } from "@/lib/supabase/browser";
import { useQuery } from "@tanstack/react-query";

export function AccountsSection() {
  const t = useT();
  const { data: rows, isLoading, error } = useAccounts();
  const setType = useSetAccountType();
  const setApproved = useSetAccountApproved();
  const deleteAccount = useDeleteAccount();
  const [query, setQuery] = useState("");
  const { data: meId } = useQuery({
    queryKey: ["admin", "me-id"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <EmptyState title={t("security.accounts.error")} />;

  const all = rows ?? [];
  const filtered = query ? all.filter((r) => (r.email ?? "").toLowerCase().includes(query.toLowerCase())) : all;
  const total = all.length;
  const personal = all.filter((r) => r.user_type !== "business").length;
  const business = all.filter((r) => r.user_type === "business").length;
  const approved = all.filter((r) => r.user_type === "business" && r.business_approved).length;
  const pending = business - approved;

  function handleDelete(userId: string, email: string | null) {
    if (!confirm(t("security.accounts.deleteConfirm1"))) return;
    const typed = prompt(t("security.accounts.deleteConfirm2", { email: email ?? "" }));
    if (typed !== email) return;
    deleteAccount.mutate(userId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {[
          [t("security.accounts.total"), total],
          [t("security.accounts.personal"), personal],
          [t("security.accounts.business"), business],
          [t("security.accounts.approved"), approved],
          [t("security.accounts.pending"), pending],
        ].map(([label, value]) => (
          <Card key={label as string} className="flex flex-col gap-1">
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{label}</span>
            <span className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{value}</span>
          </Card>
        ))}
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("security.accounts.searchPlaceholder")}
        className="max-w-xs"
      />

      {!filtered.length ? (
        <EmptyState title={t("security.accounts.empty")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[var(--text-table)]">
            <thead>
              <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                <th className="py-2 pr-2">{t("security.accounts.col.email")}</th>
                <th className="py-2 pr-2">{t("security.accounts.col.type")}</th>
                <th className="py-2 pr-2">{t("security.accounts.col.approved")}</th>
                <th className="py-2 pr-2">{t("security.accounts.col.joined")}</th>
                <th className="py-2 pr-2">{t("security.accounts.col.lastSeen")}</th>
                <th className="py-2 pr-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.user_id} className="border-b border-[var(--color-border-faint)]">
                  <td className="py-2 pr-2">
                    {r.email ?? "—"}
                    {r.is_admin && (
                      <span className="ml-1 rounded-full bg-[var(--color-accent-primary)] px-2 py-0.5 text-[var(--text-sm)] text-[var(--color-accent-on)]">
                        {t("security.accounts.adminBadge")}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <Select
                      value={r.user_type ?? "personal"}
                      onChange={(e) => setType.mutate({ userId: r.user_id, type: e.target.value as "personal" | "business" })}
                      className="text-[var(--text-sm)]"
                    >
                      <option value="personal">{t("security.accounts.type.personal")}</option>
                      <option value="business">{t("security.accounts.type.business")}</option>
                    </Select>
                  </td>
                  <td className="py-2 pr-2">
                    {r.user_type === "business" && (
                      <button
                        onClick={() => setApproved.mutate({ userId: r.user_id, approved: !r.business_approved })}
                        className={`rounded-full px-2 py-0.5 text-[var(--text-sm)] ${
                          r.business_approved
                            ? "bg-[var(--color-success-text)] text-[var(--color-accent-on)]"
                            : "border border-[var(--color-border-default)] text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {r.business_approved ? t("security.accounts.approvedYes") : t("security.accounts.approvedNo")}
                      </button>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    {r.last_seen ? new Date(r.last_seen).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-2">
                    {!r.is_admin && r.user_id !== meId && (
                      <Button size="sm" onClick={() => handleDelete(r.user_id, r.email)}>
                        {t("security.delete")}
                      </Button>
                    )}
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
