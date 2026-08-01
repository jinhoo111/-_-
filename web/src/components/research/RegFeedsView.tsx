"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useRegFeeds } from "@/lib/queries/useResearch";
import { RssList } from "@/components/news/RssList";

export function RegFeedsView() {
  const t = useT();
  const { data, isLoading, error } = useRegFeeds();

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !data) return <EmptyState title={t("news.error")} />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("research.reg.us.title")}</p>
        <RssList items={data.us} />
      </Card>
      <Card>
        <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("research.reg.kr.title")}</p>
        <RssList items={data.kr} />
      </Card>
    </div>
  );
}
