"use client";

import { useEffect, useRef } from "react";

/** Minted-styled modal/dialog: surface-1, border-strong, radius-lg, shadow, closes on outside click + Esc. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    // use mouseup so a drag that ends outside doesn't close
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[10vh]" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-[var(--surface-overlay)]" />
      <div
        ref={ref}
        className={`relative w-full ${maxWidth} rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-raised)]`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <div className="font-display text-[var(--text-lg)] font-semibold tracking-[var(--tracking-heading)] text-[var(--text-primary)]">
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">{subtitle}</div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
        {footer ? <div className="mt-5 flex items-center justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
