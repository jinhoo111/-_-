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
      className={`inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-base)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-3)] ${className}`}
    >
      {mounted ? (isDark ? "☀️" : "🌙") : null}
    </button>
  );
}
