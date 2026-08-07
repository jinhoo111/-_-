// DROP-IN replacement for web/src/app/(app)/layout.tsx
// Fixes: 1080px shell (was max-w-4xl/896px), header on page color --surface-0
// (was card color), Minted paddings (px-6, pt-8, pb-16) and section gap.
import { AppFooter } from "@/components/layout/AppFooter";
import { AppNav } from "@/components/layout/AppNav";
import { ServiceNoticeBanner } from "@/components/layout/ServiceNoticeBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-0)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-[var(--surface-0)]">
        <AppNav />
      </header>
      <ServiceNoticeBanner />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-6 px-6 pt-8 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-16">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
