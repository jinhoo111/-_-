"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useProfile } from "@/lib/queries/useProfile";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/LanguageProvider";

// Floating help widget, ported from legacy #help-fab / #help-pop: per-page tip +
// a VoC (기능요청/문의/버그/기타) submission form writing to voc_requests.
const CATEGORIES = ["feature", "inquiry", "bug", "other"] as const;

const TIP_KEY_BY_PATH: Record<string, string> = {
  "/portfolio": "help.tip.portfolio",
  "/indices": "help.tip.indices",
  "/journal": "help.tip.journal",
  "/news": "help.tip.news",
  "/research": "help.tip.research",
  "/flow": "help.tip.flow",
  "/monitor": "help.tip.monitor",
  "/security": "help.tip.security",
  "/settings": "help.tip.settings",
};

export function HelpFab() {
  const t = useT();
  const pathname = usePathname();
  const toast = useToast();
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("inquiry");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const tipKey = TIP_KEY_BY_PATH[pathname ?? ""] ?? "help.tip.portfolio";

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from("voc_requests").insert({
        user_id: authData.user?.id ?? null,
        email: profile?.email ?? authData.user?.email ?? null,
        user_type: profile?.user_type ?? null,
        category: t(`help.voc.category.${category}`),
        message: message.trim(),
      });
      if (insertError) throw insertError;
      setMessage("");
      setOpen(false);
      toast.show(t("help.voc.sent"), "success");
    } catch {
      setError(t("help.voc.error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}
      <div className="fixed right-3 bottom-16 z-40 flex flex-col items-end md:bottom-4">
        {open && (
          <div
            className="mb-2 flex w-72 max-w-[calc(100vw-24px)] flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--color-text-primary)]">{t("help.title")}</span>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-[var(--color-text-tertiary)]">
                ✕
              </button>
            </div>
            <div className="rounded-[var(--radius-control)] bg-[var(--color-bg-overlay)] p-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              <span className="font-semibold">{t("help.tips.title")}</span> · {t(tipKey)}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">{t("help.voc.title")}</span>
              <Select value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`help.voc.category.${c}`)}
                  </option>
                ))}
              </Select>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("help.voc.messagePlaceholder")}
                rows={3}
                className="w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] p-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent-primary)] focus:outline-none"
              />
              {error && <p className="text-[var(--text-sm)] text-[var(--color-error-text)]">{error}</p>}
              <Button size="sm" onClick={send} disabled={sending || !message.trim()}>
                {sending ? "⟳" : t("help.voc.send")}
              </Button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("help.toggle")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-primary)] text-[var(--text-xl)] text-[var(--color-accent-on)] shadow-lg"
        >
          💬
        </button>
      </div>
    </>
  );
}
