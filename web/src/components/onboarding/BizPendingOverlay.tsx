"use client";

import { useProfile } from "@/lib/queries/useProfile";
import { useT } from "@/lib/i18n/LanguageProvider";

// Full-screen "business account approval pending" gate, ported from legacy
// #biz-pending-overlay. Blocks unapproved business accounts until admin approval.
export function BizPendingOverlay() {
  const t = useT();
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) return null;
  const isPendingBiz = profile.user_type === "business" && profile.business_approved !== true && !profile.is_admin;
  if (!isPendingBiz) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-base)] p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <span className="text-[var(--text-3xl)]">⏳</span>
        <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("onboarding.bizPending.title")}</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("onboarding.bizPending.body")}</p>
        <div className="flex flex-col gap-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
          <span className="font-semibold">{t("onboarding.bizPending.features")}</span>
          <span>📡 경쟁사 브리핑 · 기업 모니터링 · AI 요약</span>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="mt-2 cursor-pointer text-[var(--text-sm)] text-[var(--color-text-tertiary)] underline">
            {t("onboarding.bizPending.logout")}
          </button>
        </form>
      </div>
    </div>
  );
}
