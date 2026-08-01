"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";

export function MonitorMemoForm({
  onSave,
}: {
  onSave: (text: string, source: { disclosure_title: string; disclosure_date: string } | null) => void;
}) {
  const t = useT();
  const [text, setText] = useState("");

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(trimmed, null);
    setText("");
  };

  return (
    <div className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder={t("monitor.memo.placeholder")}
      />
      <Button size="sm" onClick={handleSave} disabled={!text.trim()}>
        {t("monitor.memo.save")}
      </Button>
    </div>
  );
}
