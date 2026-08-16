import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RANKING_DEPTH } from "@/lib/richbuild/constants";
import type { RankingRow } from "@/lib/richbuild/types";

// GET /api/richbuild/ranking?market=kr&depth=guest|member
// Reads the daily-batch snapshot (spec §5/§8: Top 10 guest / Top 50 member, daily batch,
// explicitly not real-time). Table is populated by a cron-triggered refresh route — not
// wired up yet, so this returns an empty list (not fabricated numbers) until that job runs.
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") === "us" ? "us" : "kr";
  const depthKey = request.nextUrl.searchParams.get("depth") === "member" ? "member" : "guest";
  const limit = RANKING_DEPTH[depthKey];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("richbuild_daily_rank")
    .select("rank, ticker, name, price, change_pct, heat_score")
    .eq("market", market)
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) return NextResponse.json({ error: "ranking_unavailable" }, { status: 502 });

  const rows: RankingRow[] = (data ?? []).map((r) => ({
    rank: r.rank,
    ticker: r.ticker,
    name: r.name,
    price: r.price,
    changePct: r.change_pct,
    heatScore: r.heat_score,
  }));
  return NextResponse.json({ rows });
}
