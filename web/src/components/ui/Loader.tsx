import { type HTMLAttributes } from "react";

// Animated spinner (rotating arc) — replaces the static "⟳" character so users
// can tell something is loading.
export function Spinner({ size = 14, className = "", ...props }: { size?: number; className?: string } & HTMLAttributes<SVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
      className={`animate-spin ${className}`}
      {...props}
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// Indeterminate progress bar — a bar sweeping left→right to signal ongoing work.
export function ProgressBar({ className = "", ...props }: { className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="progressbar"
      aria-busy="true"
      className={`relative h-1 w-full overflow-hidden rounded-full bg-[var(--surface-2)] ${className}`}
      {...props}
    >
      <div className="animate-progress-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-[var(--accent)]" />
    </div>
  );
}
