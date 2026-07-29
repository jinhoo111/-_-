import Link from "next/link";

const NAV_ITEMS = [
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/indices", label: "지수" },
  { href: "/journal", label: "일지" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg-base)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
        <nav className="mx-auto flex max-w-4xl items-center gap-1 px-4 py-2">
          <span className="mr-4 text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">RichHub</span>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius-control)] px-3 py-1.5 text-[var(--text-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
            >
              {item.label}
            </Link>
          ))}
          <form action="/auth/signout" method="post" className="ml-auto">
            <button
              type="submit"
              className="rounded-[var(--radius-control)] px-3 py-1.5 text-[var(--text-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-overlay)]"
            >
              로그아웃
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
