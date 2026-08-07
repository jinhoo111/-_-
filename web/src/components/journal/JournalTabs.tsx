"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { Tabs } from "@/components/ui/Tabs";

export type JournalView = "calendar" | "report" | "archive" | "philosophy";

export function JournalTabs({ view, onChange }: { view: JournalView; onChange: (view: JournalView) => void }) {
  const t = useT();
  const tabs: { id: JournalView; label: string }[] = [
    { id: "calendar", label: t("journal.tab.calendar") },
    { id: "report", label: t("journal.tab.report") },
    { id: "archive", label: t("journal.tab.archive") },
    { id: "philosophy", label: t("journal.tab.philosophy") },
  ];

  return <Tabs items={tabs} value={view} onChange={(id) => onChange(id as JournalView)} size="sm" />;
}
