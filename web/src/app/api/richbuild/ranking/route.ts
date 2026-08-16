import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeRanking } from "@/lib/richbuild/rankingEngine";
import { RANKING_DEPTH } from "@/lib/richbuild/constants";
import type { Market, RankingRow } from "@/lib/richbuild/types";

// GET /api/richbuild/ranking?market=kr&depth=guest|member
// Daily-batch, not real-time (spec §5/§8): the first request of the day for a given
// market computes and caches the ranking in richbuild_daily_rank; every later request
// that day just reads the cached rows. This gets "daily batch" semantics without a
// dedicated cron slot (Vercel Hobby's cron count is already used by flow/monitor).
export async function GET(request: NextRequest) {
  const market: Market = request.nextUrl.searchParams.get("market") === "us" ? "us" : "kr";
  const depthKey = request.nextUrl.searchParams.get("depth") === "member" ? "member" : "guest";
  const limit = RANKING_DEPTH[depthKey];
  const today = new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data: cached, error: readError } = await supabase
    .from("richbuild_daily_rank")
    .select("rank, ticker, name, price, change_pct, heat_score")
    .eq("market", market)
    .eq("as_of_date", today)
    .order("rank", { ascending: true })
    .limit(limit);

  if (readError) return NextResponse.json({ error: "ranking_unavailable" }, { status: 502 });

  if (cached && cached.length > 0) {
    return NextResponse.json({ rows: cached.map(fromCacheRow) });
  }

  // Cache miss for today — compute now and persist so subsequent requests (any
  // depth, any user) hit the fast path above for the rest of the day.
  let computed: RankingRow[];
  try {
    computed = await computeRanking(market);
  } catch {
    return NextResponse.json({ error: "ranking_unavailable" }, { status: 502 });
  }
  if (!computed.length) return NextResponse.json({ rows: [] });

  const admin = createAdminClient();
  await admin.from("richbuild_daily_rank").upsert(
    computed.slice(0, RANKING_DEPTH.member).map((row) => ({
      market,
      rank: row.rank,
      ticker: row.ticker,
      name: row.name,
      price: row.price,
      change_pct: row.changePct,
      heat_score: row.heatScore,
      as_of_date: today,
    })),
    { onConflict: "market,rank,as_of_date" },
  );

  return NextResponse.json({ rows: computed.slice(0, limit) });
}

function fromCacheRow(r: { rank: number; ticker: string; name: string; price: number; change_pct: number | null; heat_score: number }): RankingRow {
  return { rank: r.rank, ticker: r.ticker, name: r.name, price: r.price, changePct: r.change_pct, heatScore: r.heat_score };
}
