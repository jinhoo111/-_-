"use client";

import { HoldingsSection } from "@/components/richbuild/HoldingsSection";
import { RankingSection } from "@/components/richbuild/RankingSection";
import { useHoldings } from "@/lib/queries/useHoldings";

// Home is one screen with two states, not two screens (spec §3): order flips by login
// state — guest sees the ranking first (trust-building before the signup ask), member
// sees holdings first (retention purpose outweighs re-education).
export default function RichBuildHomePage() {
  const { isGuest } = useHoldings();

  return (
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
  );
}
