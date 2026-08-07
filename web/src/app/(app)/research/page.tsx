"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { ResearchTabs, type ResearchView } from "@/components/research/ResearchTabs";
import { RegFeedsView } from "@/components/research/RegFeedsView";
import { SitesView } from "@/components/research/SitesView";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ResearchPage() {
  const t = useT();
  const [view, setView] = useState<ResearchView>("sites");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("research.title")}
        subtitle={t("research.subtitle")}
        action={<ResearchTabs view={view} onChange={setView} />}
      />
      {view === "sites" && <SitesView />}
      {view === "regFeeds" && <RegFeedsView />}
    </div>
  );
}
