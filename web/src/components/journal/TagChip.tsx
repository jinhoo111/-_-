import { tagMeta } from "@/lib/journal/constants";
import { useT } from "@/lib/i18n/LanguageProvider";

export function TagChip({ tag, className = "" }: { tag: string; className?: string }) {
  const t = useT();
  const meta = tagMeta(tag);
  return (
    <span
      className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-xs)] font-semibold whitespace-nowrap ${className}`}
      style={{ background: `var(${meta.bg})`, color: `var(${meta.fg})` }}
    >
      {t(meta.labelKey)}
    </span>
  );
}
