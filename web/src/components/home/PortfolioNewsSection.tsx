"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { isKrTicker, type MemoArchiveEntry } from "@/lib/types/userData";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/LanguageProvider";

// Ported from legacy loadPortfolioNews: per-ticker latest-news feed (Finnhub US /
// Naver KR) for holdings, with a "일지로" action that logs a journal memo and jumps
// to the journal calendar.
interface NewsEntry {
  headline: string;
  url: string;
  source: string;
  datetime: number | null;
  summary: string;
}

interface TickerNews {
  ticker: string;
  name: string;
  isKR: boolean;
  items: NewsEntry[];
  error?: boolean;
}

function toDateStr(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function safeUrl(url: string): string {
  try {
    const u = new URL(url, "https://example.com");
    return /^https?:$/.test(u.protocol) ? url : "#";
  } catch {
    return "#";
  }
}

interface NaverNewsRawItem {
  title?: string;
  datetime?: string;
  officeName?: string;
  mobileNewsUrl?: string;
  officeId?: string;
  articleId?: string;
  body?: string;
}

type NaverNewsPayload = { value?: { items?: NaverNewsRawItem[] }[]; items?: NaverNewsRawItem[] } | NaverNewsRawItem[];

// Normalize the raw Naver news API payload (legacy fetchStockNews KR branch).
function normalizeNaverNews(data: unknown): NewsEntry[] {
  const payload = data as NaverNewsPayload;
  let items: NaverNewsRawItem[] = [];
  if (Array.isArray(payload)) {
    items = payload.flatMap((d) => (d as { items?: NaverNewsRawItem[] }).items ?? []);
  } else if (Array.isArray(payload.value)) {
    items = payload.value.flatMap((d) => d.items ?? []);
  } else if (payload.items) {
    items = payload.items;
  }
  return items.slice(0, 5).map((n) => {
    const dt = n.datetime ?? "";
    let ts: number | null = null;
    if (dt.length >= 12) {
      const [yr, mo, dy, hr, mi] = [dt.slice(0, 4), dt.slice(4, 6), dt.slice(6, 8), dt.slice(8, 10), dt.slice(10, 12)];
      ts = Math.floor(new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:00+09:00`).getTime() / 1000);
    }
    const link = n.mobileNewsUrl || (n.officeId && n.articleId ? `https://n.news.naver.com/article/${n.officeId}/${n.articleId}` : "#");
    return { headline: n.title ?? "", url: link, source: n.officeName ?? "네이버", datetime: ts, summary: (n.body ?? "").slice(0, 130) };
  });
}

export function PortfolioNewsSection() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { data: userData } = useUserData();
  const updateUserData = useUpdateUserData();
  const [feed, setFeed] = useState<TickerNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [refresh, setRefresh] = useState(0);

  const holdings = useMemo(() => {
    const stocks = userData?.stocks ?? [];
    return stocks.filter((s) => !s.hidden && s.ticker && s.ticker.trim() !== "");
  }, [userData]);

  useEffect(() => {
    if (!holdings.length) return;
    let cancelled = false;
    Promise.allSettled(
      holdings.map(async (s) => {
        const isKR = isKrTicker(s.ticker);
        if (isKR) {
          const code = s.ticker.replace(/\.(KS|KQ)$/i, "");
          try {
            const res = await fetch(`/api/news/naver?code=${code}`);
            if (!res.ok) return { ticker: s.ticker, name: s.name, isKR, items: [] as NewsEntry[], error: true };
            const data = await res.json();
            return { ticker: s.ticker, name: s.name, isKR, items: normalizeNaverNews(data) };
          } catch {
            return { ticker: s.ticker, name: s.name, isKR, items: [] as NewsEntry[], error: true };
          }
        }
        try {
          const res = await fetch(`/api/news/company?symbol=${encodeURIComponent(s.ticker)}`);
          if (!res.ok) return { ticker: s.ticker, name: s.name, isKR, items: [] as NewsEntry[], error: true };
          const data = await res.json();
          const raw: { headline?: string; url?: string; source?: string; datetime?: number; summary?: string }[] = data?.items ?? [];
          const items: NewsEntry[] = raw.slice(0, 5).map((n) => ({
            headline: n.headline ?? "",
            url: safeUrl(n.url ?? "#"),
            source: n.source ?? "—",
            datetime: n.datetime ?? null,
            summary: (n.summary ?? "").slice(0, 130),
          }));
          return { ticker: s.ticker, name: s.name, isKR, items };
        } catch {
          return { ticker: s.ticker, name: s.name, isKR, items: [] as NewsEntry[], error: true };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const out: TickerNews[] = [];
      results.forEach((r) => {
        if (r.status === "fulfilled") out.push(r.value);
      });
      setFeed(out);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [holdings, refresh]);

  function handleToJournal(item: NewsEntry) {
    const now = new Date().toISOString();
    const archive = userData?.memo_archive ?? [];
    const entry: MemoArchiveEntry = {
      id: crypto.randomUUID(),
      text: item.headline || item.url,
      tag: "general",
      time: now,
      completedAt: now,
      important: false,
    };
    updateUserData({ memo_archive: [entry, ...archive] });
    toast.show(t("home.news.saved"), "success");
    router.push("/journal");
  }

  function handleRetry() {
    setLoading(true);
    setFeed([]);
    // Force the effect to re-run by touching a refresh counter.
    setRefresh((r) => r + 1);
  }

  if (!holdings.length) return null;

  const hasNews = feed.some((f) => f.items.length > 0);
  const hasError = feed.some((f) => f.error);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">{t("home.news.title")}</div>
        {hasError && (
          <button
            type="button"
            onClick={handleRetry}
            className="cursor-pointer bg-transparent p-0 text-[var(--text-sm)] text-[var(--color-info)] hover:underline"
          >
            {t("home.news.retry")}
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">⟳ {t("home.news.loading")}</p>
      ) : !hasNews && !hasError ? (
        <p className="text-[var(--text-sm)] text-[var(--color-text-disabled)]">{t("home.news.empty")}</p>
      ) : (
        feed.map((f, idx) => {
          const open = !!expanded[f.ticker];
          const first = f.items[0];
          const more = f.items.slice(1);
          const sep = idx > 0 ? "border-t border-[var(--color-bg-overlay)] pt-3 mt-2" : "";
          return (
            <div key={`${f.ticker}-${idx}`} className={sep}>
              {f.items.length === 0 ? (
                <div className="flex items-center gap-2 py-1">
                  <TickerBadge ticker={f.ticker} isKR={f.isKR} />
                  <span className="text-[var(--text-sm)] text-[var(--color-text-disabled)]">
                    {f.error ? t("home.news.failed") : t("home.news.noNews")}
                  </span>
                </div>
              ) : (
                <>
                  <div className="mb-1 flex items-center gap-2">
                    <TickerBadge ticker={f.ticker} isKR={f.isKR} />
                    <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{first.source}</span>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{toDateStr(first.datetime)}</span>
                  </div>
                  <div className="text-[var(--text-base)] font-medium">
                    <a href={safeUrl(first.url)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {first.headline}
                    </a>
                  </div>
                  {first.summary && <p className="mt-0.5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">{first.summary}</p>}
                  <NewsAction onJournal={() => handleToJournal(first)} />
                  {open &&
                    more.map((m, mi) => (
                      <div key={mi} className="mt-2 border-t border-[var(--color-bg-muted)] pt-2">
                        <div className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                          <span>{m.source}</span>
                          <span>{toDateStr(m.datetime)}</span>
                        </div>
                        <div className="text-[var(--text-base)] font-medium">
                          <a href={safeUrl(m.url)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {m.headline}
                          </a>
                        </div>
                        {m.summary && <p className="mt-0.5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">{m.summary}</p>}
                        <NewsAction onJournal={() => handleToJournal(m)} />
                      </div>
                    ))}
                  {more.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [f.ticker]: !open }))}
                      className="mt-1 block cursor-pointer bg-transparent p-0 text-[var(--text-sm)] text-[var(--color-info)] hover:underline"
                    >
                      {open ? t("home.news.collapse") : t("home.news.more", { count: more.length })}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
    </Card>
  );
}

function TickerBadge({ ticker, isKR }: { ticker: string; isKR: boolean }) {
  const bg = isKR ? "var(--color-success-bg)" : "var(--color-info-bg)";
  const col = isKR ? "var(--color-success-text)" : "var(--color-info)";
  return (
    <span style={{ background: bg, color: col }} className="rounded-full px-1.5 py-0.5 font-mono text-[var(--text-xs)] font-bold">
      {ticker}
    </span>
  );
}

function NewsAction({ onJournal }: { onJournal: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onJournal}
      className="mt-1 cursor-pointer rounded border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] px-2 py-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-overlay)]"
    >
      {t("home.news.toJournal")}
    </button>
  );
}
