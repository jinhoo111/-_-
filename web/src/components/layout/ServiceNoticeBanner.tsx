"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useMyNoticeVote, useNoticePollPublicResults, useServiceNotice, useVoteNoticePoll } from "@/lib/queries/useServiceNotice";

const DISMISS_KEY = "svc_notice_dismissed";

export function ServiceNoticeBanner() {
  const t = useT();
  const { data: notice } = useServiceNotice();
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    // One-time sync from client-only localStorage after mount (mirrors LanguageProvider).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissedId(localStorage.getItem(DISMISS_KEY));
  }, []);

  const pollId = notice?.poll?.id ?? null;
  const { data: results } = useNoticePollPublicResults(pollId);
  const { data: myVote } = useMyNoticeVote(pollId);
  const vote = useVoteNoticePoll();

  if (!notice || !notice.active || notice.id === dismissedId) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, notice!.id);
    setDismissedId(notice!.id);
  }

  const total = results ? Object.values(results).reduce((a, b) => a + b, 0) : 0;

  return (
    <div
      className={`mx-auto flex w-full max-w-4xl flex-col gap-2 px-2 py-3 text-[var(--text-md)] sm:px-4 ${
        notice.type === "warn"
          ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
          : "bg-[var(--color-info-bg)] text-[var(--color-info-text)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-semibold">{notice.title}</span>
          {notice.body && <span className="whitespace-pre-wrap text-[var(--text-sm)]">{notice.body}</span>}
        </div>
        <button onClick={dismiss} className="text-[var(--text-sm)] underline">
          {t("notice.dismiss")}
        </button>
      </div>

      {notice.poll && (
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] font-medium">{notice.poll.q}</span>
          {myVote == null ? (
            <div className="flex flex-wrap gap-2">
              {notice.poll.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => vote.mutate({ pollId: notice.poll!.id, choice: i })}
                  className="rounded-[var(--radius-control)] border border-current px-3 py-1 text-[var(--text-sm)]"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {notice.poll.options.map((opt, i) => {
                const count = results?.[String(i)] ?? 0;
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2 text-[var(--text-sm)]">
                    <span className="w-28 shrink-0 truncate" title={opt}>
                      {opt}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-black/10">
                      <div className="h-2 rounded-full bg-current" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
