"use client";

export function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  className = "",
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-3 ${disabled ? "cursor-not-allowed opacity-40" : ""} ${className}`}
    >
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => {
          if (!disabled && onChange) onChange(!checked);
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            if (onChange) onChange(!checked);
          }
        }}
        className={`relative h-7 w-12 shrink-0 rounded-[var(--radius-pill)] border transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] ${
          checked ? "border-transparent bg-[var(--accent)]" : "border-[var(--border-strong)] bg-[var(--surface-3)]"
        }`}
      >
        <span
          className={`absolute top-[3px] h-[21px] w-[21px] rounded-full transition-[left,background] duration-[var(--duration-base)] ease-[var(--ease-out)] ${
            checked ? "left-[23px] bg-[var(--text-on-accent)]" : "left-[3px] bg-[var(--text-secondary)]"
          }`}
        />
      </span>
      {label ? <span className="text-[var(--text-base)] text-[var(--text-primary)]">{label}</span> : null}
    </label>
  );
}
