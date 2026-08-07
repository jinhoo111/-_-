"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/LanguageProvider";

// "Free without login" guest CTA (successor to the legacy guest banner): shown to
// anonymous-session users to nudge them toward a real account (cross-device sync).
const DISMISS_KEY = "attach_email_dismissed";

export function AttachEmailBanner() {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  const { data: user } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await createClient().auth.getUser();
      return data.user ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // One-time client-only hydration (mirrors LanguageProvider).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed || !user?.is_anonymous) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 bg-[var(--color-accent-bg)] px-2 py-2 text-[var(--text-sm)] sm:px-4">
      <span className="font-semibold text-[var(--color-accent)]">{t("app.attachEmail.title")}</span>
      <span className="text-[var(--color-text-secondary)]">{t("app.attachEmail.body")}</span>
      <span className="ml-auto flex items-center gap-3">
        <Link href="/signup" className="rounded-[var(--radius-control)] bg-[var(--color-accent-primary)] px-3 py-1 font-medium text-[var(--color-accent-on)] hover:bg-[var(--color-accent-hover)]">
          {t("app.attachEmail.cta")}
        </Link>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="cursor-pointer text-[var(--text-sm)] text-[var(--color-text-tertiary)] underline"
        >
          {t("notice.dismiss")}
        </button>
      </span>
    </div>
  );
}
