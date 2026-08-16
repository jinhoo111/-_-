"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";

const ITEM_KEYS = [
  { title: "richbuild.help.item1Title", subtitle: "richbuild.help.item1Subtitle", body: "richbuild.help.item1Body" },
  { title: "richbuild.help.item2Title", subtitle: "richbuild.help.item2Subtitle", body: "richbuild.help.item2Body" },
  { title: "richbuild.help.item3Title", subtitle: "richbuild.help.item3Subtitle", body: "richbuild.help.item3Body" },
  { title: "richbuild.help.item4Title", subtitle: "richbuild.help.item4Subtitle", body: "richbuild.help.item4Body" },
];

export default function HelpPage() {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <h1 className="font-display text-[var(--text-xl)] font-bold text-[var(--text-primary)]">{t("richbuild.help.title")}</h1>
      {ITEM_KEYS.map((item, i) => {
        const open = openIndex === i;
        return (
          <Card key={item.title} className="cursor-pointer" onClick={() => setOpenIndex(open ? null : i)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{t(item.title)}</div>
                <div className="text-[var(--text-sm)] text-[var(--text-secondary)]">{t(item.subtitle)}</div>
              </div>
              <span className="text-[var(--text-muted)]">{open ? "︿" : "﹀"}</span>
            </div>
            {open && <p className="mt-3 text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">{t(item.body)}</p>}
          </Card>
        );
      })}
      <p className="mt-2 text-center text-[var(--text-xs)] text-[var(--text-muted)]">{t("richbuild.help.version")}</p>
    </div>
  );
}
