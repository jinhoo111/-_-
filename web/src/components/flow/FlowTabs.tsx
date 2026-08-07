"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { Tabs } from "@/components/ui/Tabs";

export type FlowView = "krRank" | "insider" | "f13";

export function FlowTabs({ view, onChange }: { view: FlowView; onChange: (v: FlowView) => void }) {
  const t = useT();
  const tabs: { id: FlowView; label: string }[] = [
    { id: "krRank", label: t("flow.tab.krRank") },
    { id: "insider", label: t("flow.tab.insider") },
    { id: "f13", label: t("flow.tab.f13") },
  ];
  return <Tabs items={tabs} value={view} onChange={(id) => onChange(id as FlowView)} />;
}
