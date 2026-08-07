"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; variant: "default" | "error" | "success" };
type ToastContextValue = { show: (message: string, variant?: Toast["variant"]) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE: Record<Toast["variant"], { icon: string; fg: string; bg: string }> = {
  default: { icon: "i", fg: "var(--info)", bg: "var(--info-soft)" },
  error: { icon: "!", fg: "var(--negative)", bg: "var(--negative-soft)" },
  success: { icon: "✓", fg: "var(--positive)", bg: "var(--positive-soft)" },
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: Toast["variant"] = "default") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-[360px] max-w-[calc(100vw-32px)] -translate-x-1/2 flex-col gap-2">
        {toasts.map((toast) => {
          const tone = TONE[toast.variant];
          return (
            <div
              key={toast.id}
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-4 shadow-[var(--shadow-raised)]"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: tone.bg, color: tone.fg }}
              >
                {tone.icon}
              </span>
              <div className="min-w-0 text-[var(--text-sm)] font-medium text-[var(--text-primary)]">
                {toast.message}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
