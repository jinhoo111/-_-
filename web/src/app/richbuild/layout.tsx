import { RichBuildNav } from "@/components/richbuild/RichBuildNav";
import { RichBuildVisitTracker } from "@/components/richbuild/RichBuildVisitTracker";

export default function RichBuildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-0)]">
      <RichBuildVisitTracker />
      <header className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-[var(--surface-0)]">
        <RichBuildNav />
      </header>
      <main className="mx-auto flex w-full max-w-[1188px] flex-1 flex-col gap-6 px-[1.65rem] pt-8 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-16">
        {children}
      </main>
    </div>
  );
}
