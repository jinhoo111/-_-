export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-base)] px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-8 shadow-[var(--shadow-card)]">
        {children}
      </div>
    </div>
  );
}
