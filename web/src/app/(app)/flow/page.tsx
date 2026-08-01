"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { FlowTabs, type FlowView } from "@/components/flow/FlowTabs";
import { FlowKrRankView } from "@/components/flow/FlowKrRankView";
import { FlowInsiderView } from "@/components/flow/FlowInsiderView";
import { FlowF13View } from "@/components/flow/FlowF13View";

export default function FlowPage() {
  useT();
  const [view, setView] = useState<FlowView>("krRank");

  return (
    <div className="flex flex-col gap-4">
      <FlowTabs view={view} onChange={setView} />
      {view === "krRank" && <FlowKrRankView />}
      {view === "insider" && <FlowInsiderView />}
      {view === "f13" && <FlowF13View />}
    </div>
  );
}
