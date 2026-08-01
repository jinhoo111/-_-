import { NextResponse, type NextRequest } from "next/server";
import { refreshFlowKrRank } from "@/lib/flow/server";

// Vercel Cron target. Legacy `flow-kr-refresh` batch action had no in-repo scheduler
// either — configure the actual schedule in `vercel.json` when a cron slot is assigned.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-flow-refresh-secret");
  if (!process.env.FLOW_REFRESH_SECRET || secret !== process.env.FLOW_REFRESH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const data = await refreshFlowKrRank();
    return NextResponse.json({ ok: true, universe: data.universe });
  } catch {
    return NextResponse.json({ error: "refresh_failed" }, { status: 502 });
  }
}
