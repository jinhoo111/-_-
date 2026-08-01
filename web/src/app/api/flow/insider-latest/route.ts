import { NextResponse } from "next/server";
import { getInsiderLatest } from "@/lib/flow/server";

export async function GET() {
  try {
    const data = await getInsiderLatest();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "insider_unavailable" }, { status: 502 });
  }
}
