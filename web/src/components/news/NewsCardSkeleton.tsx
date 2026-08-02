import { Skeleton } from "@/components/ui/Skeleton";

export function NewsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-faint)] p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
