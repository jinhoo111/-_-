import { AppFooter } from "@/components/layout/AppFooter";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-0)] px-6 py-10">
      <div className="mb-6 flex w-[400px] max-w-full items-center justify-between">
        <span className="font-display text-[26px] font-bold tracking-[var(--tracking-display)] text-[var(--text-primary)]">
          RichHub<span className="text-[var(--accent)]">.</span>
        </span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className="w-[400px] max-w-full rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-card)]">
        {children}
      </div>
      <AppFooter />
    </div>
  );
}
