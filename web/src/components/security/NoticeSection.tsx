"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { BarChart } from "@/components/journal/charts/BarChart";
import {
  useAdminServiceNotice,
  useClearServiceNotice,
  useNoticePollResults,
  useSaveServiceNotice,
  type ServiceNotice,
} from "@/lib/queries/useSecurityAdmin";

const MAX_POLL_OPTIONS = 9;

export function NoticeSection() {
  const t = useT();
  const { data: notice, isLoading } = useAdminServiceNotice();
  const save = useSaveServiceNotice();
  const clear = useClearServiceNotice();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"info" | "warn">("info");
  const [active, setActive] = useState(false);
  const [pollOn, setPollOn] = useState(false);
  const [pollQ, setPollQ] = useState("");
  const [pollOptionsText, setPollOptionsText] = useState("");

  useEffect(() => {
    if (!notice) return;
    /* eslint-disable react-hooks/set-state-in-effect -- prefill editor from fetched notice */
    setTitle(notice.title);
    setBody(notice.body);
    setType(notice.type);
    setActive(notice.active);
    setPollOn(!!notice.poll);
    setPollQ(notice.poll?.q ?? "");
    setPollOptionsText((notice.poll?.options ?? []).join("\n"));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [notice]);

  const { data: pollResults } = useNoticePollResults(notice?.poll?.id ?? null);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  function handleSave() {
    const options = pollOptionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_POLL_OPTIONS);

    const prevPoll = notice?.poll ?? null;
    const optionsUnchanged = !!prevPoll && prevPoll.options.length === options.length && prevPoll.options.every((o, i) => o === options[i]);

    const poll =
      pollOn && options.length >= 2
        ? {
            id: optionsUnchanged ? prevPoll!.id : `poll_${Date.now()}`,
            q: pollQ,
            options,
          }
        : null;

    const next: ServiceNotice = {
      id: notice?.id || `notice_${Date.now()}`,
      title,
      body,
      type,
      active,
      poll,
    };
    save.mutate(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("security.notice.title")}</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("security.notice.body")}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] p-2 text-[var(--text-md)] text-[var(--color-text-primary)]"
          />
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[var(--text-md)]">
            <input type="radio" checked={type === "info"} onChange={() => setType("info")} />
            {t("security.notice.type.info")}
          </label>
          <label className="flex items-center gap-2 text-[var(--text-md)]">
            <input type="radio" checked={type === "warn"} onChange={() => setType("warn")} />
            {t("security.notice.type.warn")}
          </label>
          <label className="ml-auto flex items-center gap-2 text-[var(--text-md)]">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            {t("security.notice.active")}
          </label>
        </div>

        <div className="border-t border-[var(--color-border-faint)] pt-3">
          <label className="flex items-center gap-2 text-[var(--text-md)]">
            <input type="checkbox" checked={pollOn} onChange={(e) => setPollOn(e.target.checked)} />
            {t("security.notice.pollEnable")}
          </label>
          {pollOn && (
            <div className="mt-2 flex flex-col gap-2">
              <Input value={pollQ} onChange={(e) => setPollQ(e.target.value)} placeholder={t("security.notice.pollQuestion")} />
              <textarea
                value={pollOptionsText}
                onChange={(e) => setPollOptionsText(e.target.value)}
                rows={4}
                placeholder={t("security.notice.pollOptionsPlaceholder")}
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] p-2 text-[var(--text-md)] text-[var(--color-text-primary)]"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={() => clear.mutate(notice ?? null)}>{t("security.notice.clear")}</Button>
          <Button variant="primary" onClick={handleSave}>
            {t("security.notice.save")}
          </Button>
        </div>
      </Card>

      {notice?.poll && pollResults && (
        <Card className="flex flex-col gap-2">
          <span className="text-[var(--text-md)] font-semibold">{notice.poll.q}</span>
          <BarChart
            xLabels={notice.poll.options}
            values={notice.poll.options.map((_, i) => pollResults[String(i)] ?? 0)}
            color="var(--color-accent-primary)"
          />
        </Card>
      )}
    </div>
  );
}
