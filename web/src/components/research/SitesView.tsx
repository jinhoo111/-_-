"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/LanguageProvider";
import { RESEARCH_SITES, type SiteCategory } from "@/lib/news/constants";

const CATEGORIES: (SiteCategory | "all")[] = ["all", "ib", "news", "reg", "data", "kr"];

export function SitesView() {
  const t = useT();
  const [cat, setCat] = useState<SiteCategory | "all">("all");
  const sites = cat === "all" ? RESEARCH_SITES : RESEARCH_SITES.filter((s) => s.cat === cat);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-[var(--text-sm)] ${
              cat === c ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
            }`}
          >
            {t(`research.sites.cat.${c}`)}
          </button>
        ))}
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sites.map((site) => (
          <a
            key={site.url}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-control)] border border-[var(--color-border-faint)] p-3 text-center text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-overlay)]"
          >
            {site.name}
          </a>
        ))}
      </div>
    </div>
  );
}
