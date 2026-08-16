import type { Holding } from "@/lib/richbuild/types";

// Guest holdings live on-device only (spec §5: "no account required"). Schema is
// identical to the `richbuild_holdings` table row shape (minus user_id) so signup can
// migrate this array verbatim into inserts — see useHoldings' migrateLocalToAccount.
const STORAGE_KEY = "richbuild_holdings";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readLocalHoldings(): Holding[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalHoldings(holdings: Holding[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function addLocalHolding(holding: Omit<Holding, "id" | "createdAt">): Holding {
  const next: Holding = { ...holding, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  writeLocalHoldings([...readLocalHoldings(), next]);
  return next;
}

export function removeLocalHolding(id: string) {
  writeLocalHoldings(readLocalHoldings().filter((h) => h.id !== id));
}

export function clearLocalHoldings() {
  writeLocalHoldings([]);
}
