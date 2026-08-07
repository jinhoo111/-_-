"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFlowKrRank } from "@/lib/queries/useFlow";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { isKrTicker, type MemoArchiveEntry } from "@/lib/types/userData";
import { FLOW_WARN_DAYS } from "@/lib/flow/constants";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";

// Ported from legacy renderFlowBar: today's KR supply summary (institution/foreign #1
// net-buy) + a warning strip when any of MY KR holdings has N consecutive institution
// net-sell days, with a "일지로" action that logs a flow-tagged journal entry.
interface WarnItem {
  code: string;
  name: string;
  organStreak: number;
  organ: number;
  foreign: number;
}

export function FlowBar() {
  const t = useT();
  const router = useRouter();
  const { data: userData } = useUserData();
  const updateUserData = useUpdateUserData();
  const { data: rank, isLoading: rankLoading } = useFlowKrRank();
  const [warns, setWarns] = useState<WarnItem[]>([]);

  const krHoldings = useMemo(() => {
    const stocks = userData?.stocks ?? [];
    return stocks
      .filter((s) => !s.hidden && isKrTicker(s.ticker) && s.ticker.trim())
      .map((s) => ({ code: s.ticker.replace(/\.(KS|KQ)$/i, ""), name: s.name }));
  }, [userData]);

  // Load per-holding KR flow to detect consecutive institution net-sell streaks.
  useEffect(() => {
    if (!krHoldings.length) return;
    let cancelled = false;
    Promise.allSettled(
      krHoldings.map(async ({ code }) => {
        const res = await fetch(`/api/flow/kr-stock?code=${code}`);
        if (!res.ok) return null;
        const data = await res.json();
        const rows: { date: string; organ: number; foreign: number }[] = data?.rows ?? [];
        const sorted = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        let streak = 0;
        for (const row of sorted) {
          if ((row.organ ?? 0) < 0) streak += 1;
          else break;
        }
        return { code, streak, newest: sorted[0] };
      }),
    ).then((results) => {
      if (cancelled) return;
      const items: WarnItem[] = [];
      results.forEach((r) => {
        if (r.status !== "fulfilled" || !r.value) return;
        const { code, streak, newest } = r.value;
        if (streak >= FLOW_WARN_DAYS) {
          const h = krHoldings.find((x) => x.code === code);
          items.push({
            code,
            name: h?.name ?? code,
            organStreak: -streak,
            organ: newest?.organ ?? 0,
            foreign: newest?.foreign ?? 0,
          });
        }
      });
      setWarns(items);
    });
    return () => {
      cancelled = true;
    };
  }, [krHoldings]);

  // Browser notifications for institution sell-streak warnings (legacy _fireFlowAlerts),
  // deduped once per stock per day via the `flow_alerted` localStorage key.
  useEffect(() => {
    if (!warns.length) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission().catch(() => {});
    if (Notification.permission !== "granted") return;
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    let sent: { date: string; codes: string[] } = { date: "", codes: [] };
    try {
      sent = JSON.parse(localStorage.getItem("flow_alerted") || "{}");
    } catch {
      // ignore malformed cache
    }
    if (sent.date !== todayKey) sent = { date: todayKey, codes: [] };
    const fresh = warns.filter((w) => !sent.codes.includes(w.code));
    if (!fresh.length) return;
    for (const w of fresh) {
      try {
        new Notification(`${w.name} · 🟠 수급 경고`, { body: `기관이 ${Math.abs(w.organStreak)}일 연속 순매도 중입니다` });
      } catch {
        // some browsers require the SW registration — swallow
      }
      sent.codes.push(w.code);
    }
    try {
      localStorage.setItem("flow_alerted", JSON.stringify(sent));
    } catch {
      // storage unavailable
    }
  }, [warns]);

  function handleWarnToJournal() {
    if (!warns.length) return;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const archive = userData?.memo_archive ?? [];
    const already = new Set(
      archive
        .filter((m) => m.tag === "flow" && (m.completedAt || "").slice(0, 10) === today)
        .map((m) => (m.source as { code?: string } | undefined)?.code),
    );
    const entries: MemoArchiveEntry[] = [];
    for (const w of warns) {
      if (already.has(w.code)) continue;
      entries.push({
        id: crypto.randomUUID(),
        text: `[수급] ${w.name}(${w.code}) — 기관 ${Math.abs(w.organStreak)}일 연속 순매도 (전일 ${w.organ.toLocaleString()}주, 외국인 ${w.foreign >= 0 ? "+" : ""}${w.foreign.toLocaleString()}주)`,
        tag: "flow",
        time: now,
        completedAt: now,
        important: false,
        source: { type: "flow", code: w.code, name: w.name, organStreak: w.organStreak },
      });
    }
    if (entries.length) updateUserData({ memo_archive: [...entries, ...archive] });
    router.push("/journal");
  }

  if (rankLoading && !rank) return <Skeleton className="h-16 w-full" />;
  if (!rank || (!rank.organBuy?.length && !rank.foreignBuy?.length)) return null;

  const org1 = rank.organBuy?.[0];
  const frn1 = rank.foreignBuy?.[0];
  const dt = String(rank.date || "");
  const dstr = dt.length >= 8 ? `${dt.slice(4, 6)}/${dt.slice(6, 8)}` : "";
  const warnNames = warns.map((w) => w.name).join(", ");

  return (
    <Card className="flex flex-col gap-2">
      <Link
        href="/flow"
        title={t("home.flowBar.goFlowTitle")}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--radius-control)] px-1 py-0.5 transition-colors hover:bg-[var(--color-bg-overlay)]"
      >
        <span className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)]">💰 {dstr} 수급</span>
        {org1 && (
          <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            {t("home.flowBar.organ")} <b className="text-[var(--color-text-primary)]">{org1.name}</b>{" "}
            <span className="font-semibold text-[var(--color-up)]">+{org1.organ.toLocaleString()}</span>
          </span>
        )}
        {frn1 && (
          <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            {t("home.flowBar.foreign")} <b className="text-[var(--color-text-primary)]">{frn1.name}</b>{" "}
            <span className="font-semibold text-[var(--color-up)]">+{frn1.foreign.toLocaleString()}</span>
          </span>
        )}
        <span className="ml-auto text-[var(--text-sm)] font-medium text-[var(--color-info)]">{t("home.flowBar.more")}</span>
      </Link>
      {warns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-warning-bg)] px-3 py-2">
          <span className="text-[var(--text-sm)] text-[var(--color-warning-text)]">
            ⚠️ {t("home.flowBar.warn", { names: warnNames, days: Math.abs(warns[0].organStreak) })}
          </span>
          <button
            type="button"
            onClick={handleWarnToJournal}
            className="rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] px-2 py-1 text-[var(--text-xs)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-overlay)]"
          >
            {t("home.flowBar.toJournal")}
          </button>
        </div>
      )}
    </Card>
  );
}
