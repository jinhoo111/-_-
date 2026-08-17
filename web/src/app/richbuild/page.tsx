"use client";

import { HoldingsSection } from "@/components/richbuild/HoldingsSection";
import { RankingSection } from "@/components/richbuild/RankingSection";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useT } from "@/lib/i18n/LanguageProvider";

// Home keeps a consistent layout regardless of login state: ranking always on the
// left (fixed-height scrollable list), holdings always on the right (bounded,
// scrollable). Depth still varies — guest gets the top 10 with a signup upsell,
// member gets the full top 50 in the same scrollable frame.
export default function RichBuildHomePage() {
  const t = useT();
  const { isGuest } = useHoldings();

  return (
    <div className="flex flex-col gap-4">
      {isGuest && (
        <div className="rounded-[var(--radius-md)] bg-[var(--warning-soft)] px-4 py-2 text-center text-[var(--text-sm)] text-[var(--warning)]">
          {t("richbuild.home.guestLimitedBanner")}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RankingSection depth={isGuest ? "guest" : "member"} />
        <HoldingsSection />
      </div>
    </div>
  );
}
