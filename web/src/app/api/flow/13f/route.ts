import { NextResponse, type NextRequest } from "next/server";
import { FLOW_INSTITUTIONS } from "@/lib/flow/constants";
import { getF13 } from "@/lib/flow/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!FLOW_INSTITUTIONS.some((i) => i.id === id)) return NextResponse.json({ error: "institution_not_found" }, { status: 400 });
  try {
    const data = await getF13(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "f13_unavailable" }, { status: 502 });
  }
}
