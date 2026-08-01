import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "admin_only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const targetUserId = body?.user_id;
  if (!targetUserId) return NextResponse.json({ error: "invalid_user" }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });

  const admin = createAdminClient();
  const { data: targetProfile } = await admin
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", targetUserId)
    .single();
  if (targetProfile?.is_admin) return NextResponse.json({ error: "cannot_delete_admin" }, { status: 400 });

  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return NextResponse.json({ error: `delete_failed:${error.message}` }, { status: 502 });

  return NextResponse.json({ ok: true });
}
