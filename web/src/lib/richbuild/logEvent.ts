import { createClient } from "@/lib/supabase/browser";
import { getVisitorId } from "@/lib/richbuild/visitorId";

// Discrete product events (working-flow diagram §4: `signup_completed` fires at
// guest→member conversion). Best-effort — never throws, so a logging failure can't
// block the actual user-facing flow it's attached to.
export async function logRichbuildEvent(event: string, userId: string | null) {
  try {
    const supabase = createClient();
    await supabase.from("richbuild_events").insert({ visitor_id: getVisitorId(userId), event });
  } catch {
    // best-effort — e.g. migration 0015 not applied yet, or offline.
  }
}
