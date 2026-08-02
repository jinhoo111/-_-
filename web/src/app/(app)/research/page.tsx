"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { ResearchTabs, type ResearchView } from "@/components/research/ResearchTabs";
import { RegFeedsView } from "@/components/research/RegFeedsView";
import { SitesView } from "@/components/research/SitesView";

export default function ResearchPage() {
  useT();
  const [view, setView] = useState<ResearchView>("sites");

  return (
    <div className="flex flex-col gap-4">
      <ResearchTabs view={view} onChange={setView} />
      {view === "sites" && <SitesView />}
      {view === "regFeeds" && <RegFeedsView />}
    </div>
  );
}
