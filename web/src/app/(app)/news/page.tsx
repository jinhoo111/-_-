"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { NewsTabs, type NewsView } from "@/components/news/NewsTabs";
import { MarketNewsView } from "@/components/news/MarketNewsView";
import { CompanyNewsView } from "@/components/news/CompanyNewsView";
import { NaverNewsView } from "@/components/news/NaverNewsView";
import { QuotesView } from "@/components/news/QuotesView";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewsPage() {
  const t = useT();
  const [view, setView] = useState<NewsView>("market");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("news.title")}
        subtitle={t("news.subtitle")}
        action={<NewsTabs view={view} onChange={setView} />}
      />
      {view === "market" && <MarketNewsView />}
      {view === "company" && <CompanyNewsView />}
      {view === "naver" && <NaverNewsView />}
      {view === "quotes" && <QuotesView />}
    </div>
  );
}
