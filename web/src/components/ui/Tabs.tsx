"use client";

import { useState } from "react";

type TabItem = { id: string; label: React.ReactNode };

export function Tabs({
  items,
  value,
  onChange,
  size = "md",
  className = "",
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const h = size === "sm" ? "h-8" : "h-10";
  return (
    <div
      className={`inline-flex gap-1 rounded-[var(--radius-pill)] bg-[var(--surface-2)] p-1 ${className}`}
    >
      {items.map((it) => (
        <TabItem
          key={it.id}
          item={it}
          active={it.id === value}
          h={h}
          size={size}
          onClick={() => onChange(it.id)}
        />
      ))}
    </div>
  );
}

function TabItem({
  item,
  active,
  h,
  size,
  onClick,
}: {
  item: TabItem;
  active: boolean;
  h: string;
  size: "sm" | "md";
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`${h} inline-flex items-center rounded-[var(--radius-pill)] border-none ${
        size === "sm" ? "px-3.5 text-[var(--text-sm)]" : "px-[18px] text-[var(--text-base)]"
      } cursor-pointer transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
        active
          ? "bg-[var(--surface-0)] font-semibold text-[var(--accent)]"
          : hover
            ? "bg-[var(--surface-3)] font-medium text-[var(--text-secondary)]"
            : "bg-transparent font-medium text-[var(--text-secondary)]"
      }`}
    >
      {item.label}
    </button>
  );
}
