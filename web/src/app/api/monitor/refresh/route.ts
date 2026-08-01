import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonitorKrCompany } from "@/lib/monitor/server";
import { ingestOwnershipSignals, ingestSignals, corpCodeIsUs, MAX_COMPANIES } from "@/lib/monitor/constants";
import type { MonitorCompany } from "@/lib/types/userData";

// Vercel Cron target. Mirrors /api/flow/refresh — server-side ingestion replaces the
// legacy client-only 30-min setInterval poll. `vercel.json` schedule assignment deferred,
// same as Flow.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-monitor-refresh-secret");
  if (!process.env.MONITOR_REFRESH_SECRET || secret !== process.env.MONITOR_REFRESH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase.from("user_data").select("user_id, monitor_companies");
  if (error) return NextResponse.json({ error: "fetch_failed" }, { status: 502 });

  let usersUpdated = 0;
  let signalsAdded = 0;

  for (const row of rows ?? []) {
    const companies = (row.monitor_companies as MonitorCompany[] | null) ?? [];
    const alertable = companies.filter((c) => c.alert && !corpCodeIsUs(c.corp_code)).slice(0, MAX_COMPANIES);
    if (!alertable.length) continue;

    let changed = false;
    for (const co of alertable) {
      try {
        const bundle = await getMonitorKrCompany(co.corp_code);
        const added = [...ingestSignals(co, bundle.disclosures), ...ingestOwnershipSignals(co, bundle.major)];
        if (added.length) {
          signalsAdded += added.length;
          changed = true;
        }
        co.lastCheckedAt = new Date().toISOString();
        co.alertedNos = [...new Set([...(co.alertedNos ?? []), ...added.map((s) => s.rcept_no)])].slice(-100);
        changed = true;
      } catch {
        // leave this company's state untouched on failure — retried next cron tick
      }
    }

    if (changed) {
      const { error: upErr } = await supabase.from("user_data").update({ monitor_companies: companies }).eq("user_id", row.user_id);
      if (!upErr) usersUpdated++;
    }
  }

  return NextResponse.json({ ok: true, usersUpdated, signalsAdded });
}
