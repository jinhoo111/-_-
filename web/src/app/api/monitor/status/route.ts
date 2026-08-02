import { NextResponse } from "next/server";

// Locale-free readiness probe — mirrors legacy's dartKeyStored flag (shared owner DART key
// configured server-side). The client resolves the two-state banner text via t().
export async function GET() {
  return NextResponse.json({ ready: Boolean(process.env.OWNER_DART_KEY) });
}
