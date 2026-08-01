"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useClearSecurityEvents,
  useDeleteSecurityEvent,
  useSecurityEvents,
  type Severity,
} from "@/lib/queries/useSecurityAdmin";

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "var(--color-error-text)",
  warn: "var(--color-warning)",
  info: "var(--color-text-tertiary)",
};

export function SecurityEventsSection() {
  const t = useT();
  const { data: events, isLoading, error, refetch, isFetching } = useSecurityEvents();
  const deleteEvent = useDeleteSecurityEvent();
  const clearEvents = useClearSecurityEvents();
  const [now] = useState(() => Date.now());

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <EmptyState title={t("security.events.error")} />;

  const rows = events ?? [];
  const last24h = rows.filter((e) => now - new Date(e.created_at).getTime() < 864e5).length;
  const warnCount = rows.filter((e) => e.severity === "warn").length;
  const criticalCount = rows.filter((e) => e.severity === "critical").length;
  const rejectedCount = rows.filter((e) => e.event_type === "auth_rejected").length;

  function handleClear() {
    if (!confirm(t("security.events.clearConfirm1"))) return;
    if (!confirm(t("security.events.clearConfirm2"))) return;
    clearEvents.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? t("security.refreshing") : t("security.refresh")}
        </Button>
        <Button size="sm" variant="default" onClick={handleClear} disabled={!rows.length}>
          {t("security.events.clearAll")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          [t("security.events.total"), rows.length],
          [t("security.events.last24h"), last24h],
          [t("security.events.warn"), warnCount],
          [t("security.events.critical"), criticalCount],
          [t("security.events.rejected"), rejectedCount],
        ].map(([label, value]) => (
          <Card key={label as string} className="flex flex-col gap-1">
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{label}</span>
            <span className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{value}</span>
          </Card>
        ))}
      </div>

      {!rows.length ? (
        <EmptyState title={t("security.events.empty")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[var(--text-table)]">
            <thead>
              <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                <th className="py-2 pr-2">{t("security.events.col.time")}</th>
                <th className="py-2 pr-2">{t("security.events.col.type")}</th>
                <th className="py-2 pr-2">{t("security.events.col.severity")}</th>
                <th className="py-2 pr-2">{t("security.events.col.target")}</th>
                <th className="py-2 pr-2">{t("security.events.col.ip")}</th>
                <th className="py-2 pr-2">{t("security.events.col.detail")}</th>
                <th className="py-2 pr-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-border-faint)]">
                  <td className="py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-2">{e.event_type}</td>
                  <td className="py-2 pr-2 font-semibold" style={{ color: SEVERITY_COLOR[e.severity] }}>
                    {t(`security.severity.${e.severity}`)}
                  </td>
                  <td className="py-2 pr-2">{e.email ?? e.user_id ?? "—"}</td>
                  <td className="py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{e.ip ?? "—"}</td>
                  <td className="max-w-[280px] truncate py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    {JSON.stringify(e.detail)}
                  </td>
                  <td className="py-2 pr-2">
                    <Button size="sm" onClick={() => deleteEvent.mutate(e.id)}>
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
