import { NextResponse } from "next/server";
import { FLOW_INSTITUTIONS } from "@/lib/flow/constants";

export async function GET() {
  return NextResponse.json(FLOW_INSTITUTIONS.map((i) => ({ id: i.id, name: i.name, who: i.who })));
}
