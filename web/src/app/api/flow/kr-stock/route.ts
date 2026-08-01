import { NextResponse, type NextRequest } from "next/server";
import { getFlowKrStock } from "@/lib/flow/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "code_required" }, { status: 400 });
  try {
    const data = await getFlowKrStock(code);
    return NextResponse.json({ code, rows: data });
  } catch {
    return NextResponse.json({ error: "flow_unavailable" }, { status: 502 });
  }
}
