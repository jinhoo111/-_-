"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { Tabs } from "@/components/ui/Tabs";

export type ResearchView = "sites" | "regFeeds";

export function ResearchTabs({ view, onChange }: { view: ResearchView; onChange: (v: ResearchView) => void }) {
  const t = useT();
  const tabs: { id: ResearchView; label: string }[] = [
    { id: "sites", label: t("research.tab.sites") },
    { id: "regFeeds", label: t("research.tab.regFeeds") },
  ];
  return <Tabs items={tabs} value={view} onChange={(id) => onChange(id as ResearchView)} />;
}
