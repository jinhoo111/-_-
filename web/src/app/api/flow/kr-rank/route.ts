import { NextResponse } from "next/server";
import { getFlowKrRank } from "@/lib/flow/server";

export async function GET() {
  try {
    const data = await getFlowKrRank();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "flow_unavailable" }, { status: 502 });
  }
}
