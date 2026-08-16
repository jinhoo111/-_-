"use client";

import { HoldingsSection } from "@/components/richbuild/HoldingsSection";
import { RankingSection } from "@/components/richbuild/RankingSection";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useT } from "@/lib/i18n/LanguageProvider";

// Home is one screen with two states, not two screens (spec §3): order flips by login
// state — guest sees the ranking first (trust-building before the signup ask), member
// sees holdings first (retention purpose outweighs re-education).
export default function RichBuildHomePage() {
  const t = useT();
  const { isGuest } = useHoldings();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-2 text-center text-[var(--text-sm)] text-[var(--accent)]">
        {isGuest ? t("richbuild.home.guestBanner") : t("richbuild.home.memberBanner")}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {isGuest ? (
          <>
            <RankingSection depth="guest" />
            <HoldingsSection />
          </>
        ) : (
          <>
            <HoldingsSection />
            <RankingSection depth="member" />
          </>
        )}
      </div>
    </div>
  );
}
