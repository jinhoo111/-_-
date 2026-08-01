"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-input)] text-[var(--text-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)] ${className}`}
    >
      {mounted ? (isDark ? "☀️" : "🌙") : null}
    </button>
  );
}
