"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { Tabs } from "@/components/ui/Tabs";

export type MonitorView = "card" | "table" | "radar";

const VIEWS: MonitorView[] = ["card", "table", "radar"];

export function MonitorViewTabs({ view, onChange }: { view: MonitorView; onChange: (v: MonitorView) => void }) {
  const t = useT();
  const items = VIEWS.map((v) => ({ id: v, label: t(`monitor.view.${v}`) }));
  return <Tabs items={items} value={view} onChange={(id) => onChange(id as MonitorView)} size="sm" />;
}
