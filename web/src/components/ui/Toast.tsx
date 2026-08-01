"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; variant: "default" | "error" | "success" };
type ToastContextValue = { show: (message: string, variant?: Toast["variant"]) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASS: Record<Toast["variant"], string> = {
  default: "bg-[var(--color-text-strong)] text-[var(--color-bg-surface)]",
  error: "bg-[var(--color-error)] text-white",
  success: "bg-[var(--color-success)] text-white",
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
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-[var(--radius-pill)] px-4 py-2 text-[var(--text-md)] shadow-[var(--shadow-pop)] ${VARIANT_CLASS[toast.variant]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
