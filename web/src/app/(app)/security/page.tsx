"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { SecurityTabs, type SecurityView } from "@/components/security/SecurityTabs";
import { SecurityEventsSection } from "@/components/security/SecurityEventsSection";
import { VocSection } from "@/components/security/VocSection";
import { NoticeSection } from "@/components/security/NoticeSection";
import { AccountsSection } from "@/components/security/AccountsSection";

export default function SecurityPage() {
  const t = useT();
  const [view, setView] = useState<SecurityView>("events");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("security.title")}</h1>
      <SecurityTabs view={view} onChange={setView} />
      {view === "events" && <SecurityEventsSection />}
      {view === "voc" && <VocSection />}
      {view === "notice" && <NoticeSection />}
      {view === "accounts" && <AccountsSection />}
    </div>
  );
}
