"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { ResearchTabs, type ResearchView } from "@/components/research/ResearchTabs";
import { RegFeedsView } from "@/components/research/RegFeedsView";
import { RegSearchView } from "@/components/research/RegSearchView";
import { SitesView } from "@/components/research/SitesView";

export default function ResearchPage() {
  useT();
  const [view, setView] = useState<ResearchView>("regFeeds");

  return (
    <div className="flex flex-col gap-4">
      <ResearchTabs view={view} onChange={setView} />
      {view === "regFeeds" && <RegFeedsView />}
      {view === "regSearch" && <RegSearchView />}
      {view === "sites" && <SitesView />}
    </div>
  );
}
