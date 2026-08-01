import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Shared DB cache (api_cache table) — ports the `cacheGet`/`cacheSet`/`cacheGetStale`
// helpers from `supabase/functions/market-data/index.ts` 1:1. Vercel functions are
// stateless between invocations, so the DB is the only cache tier here (no in-memory
// first tier, unlike the edge function's per-isolate `memCache`).
export async function cacheGet(key: string, ttlMs: number): Promise<unknown | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("api_cache").select("data, updated_at").eq("key", key).maybeSingle();
    if (error || !data) return null;
    const at = new Date(data.updated_at).getTime();
    if (Date.now() - at >= ttlMs) return null;
    return data.data;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, data: unknown): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("api_cache").upsert({ key, data, updated_at: new Date().toISOString() }, { onConflict: "key" });
  } catch {
    // swallow — cache failures must never break the request
  }
}

export async function cacheGetStale(key: string): Promise<unknown | null> {
  return cacheGet(key, Number.MAX_SAFE_INTEGER);
}
