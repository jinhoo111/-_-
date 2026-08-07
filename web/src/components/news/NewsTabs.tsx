"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { Tabs } from "@/components/ui/Tabs";

export type NewsView = "market" | "company" | "naver" | "quotes";

export function NewsTabs({ view, onChange }: { view: NewsView; onChange: (v: NewsView) => void }) {
  const t = useT();
  const tabs: { id: NewsView; label: string }[] = [
    { id: "market", label: t("news.tab.market") },
    { id: "company", label: t("news.tab.company") },
    { id: "naver", label: t("news.tab.naver") },
    { id: "quotes", label: t("news.tab.quotes") },
  ];
  return <Tabs items={tabs} value={view} onChange={(id) => onChange(id as NewsView)} />;
}
