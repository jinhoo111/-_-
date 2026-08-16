import Link from "next/link";

// Fixed bottom-right on every screen per the working-flow diagram ("전 화면 우측 하단
// 고정") and every screen mockup — doubles as onboarding, so there's no separate
// onboarding flow (spec §3).
export function HelpFab() {
  return (
    <Link
      href="/richbuild/help"
      aria-label="Help"
      className="fixed right-4 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)] shadow-[var(--shadow-raised)] hover:text-[var(--text-primary)] md:bottom-6"
    >
      ?
    </Link>
  );
}
