import { AppFooter } from "@/components/layout/AppFooter";
import { AppNav } from "@/components/layout/AppNav";
import { ServiceNoticeBanner } from "@/components/layout/ServiceNoticeBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg-base)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
        <AppNav />
      </header>
      <ServiceNoticeBanner />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
      <AppFooter />
    </div>
  );
}
