import { NextResponse, type NextRequest } from "next/server";
import { getInsiderStock } from "@/lib/flow/server";

export async function GET(req: NextRequest) {
  const ticker = (req.nextUrl.searchParams.get("ticker") || "").toUpperCase();
  if (!/^[A-Z.\-]{1,10}$/.test(ticker)) return NextResponse.json({ error: "ticker_required" }, { status: 400 });
  try {
    const data = await getInsiderStock(ticker);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "insider_unavailable" }, { status: 502 });
  }
}
