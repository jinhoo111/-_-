"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { NewsTabs, type NewsView } from "@/components/news/NewsTabs";
import { MarketNewsView } from "@/components/news/MarketNewsView";
import { CompanyNewsView } from "@/components/news/CompanyNewsView";
import { NaverNewsView } from "@/components/news/NaverNewsView";

export default function NewsPage() {
  useT();
  const [view, setView] = useState<NewsView>("market");

  return (
    <div className="flex flex-col gap-4">
      <NewsTabs view={view} onChange={setView} />
      {view === "market" && <MarketNewsView />}
      {view === "company" && <CompanyNewsView />}
      {view === "naver" && <NaverNewsView />}
    </div>
  );
}
