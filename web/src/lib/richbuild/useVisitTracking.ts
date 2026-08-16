"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { getVisitorId } from "@/lib/richbuild/visitorId";

// D7 retention is the v1 North Star (spec §8), not DAU — the ostrich-effect finding
// (§2) means daily engagement is the wrong yardstick. Logs first_visit/last_visit per
// visitor from day one so cohort cuts can be computed once there's real usage data.
export function useRichbuildVisitTracking() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        const visitorId = getVisitorId(data.user?.id ?? null);
        const now = new Date().toISOString();
        const { data: existing } = await supabase
          .from("richbuild_visits")
          .select("visitor_id")
          .eq("visitor_id", visitorId)
          .maybeSingle();
        if (existing) {
          await supabase.from("richbuild_visits").update({ last_visit: now }).eq("visitor_id", visitorId);
        } else {
          await supabase.from("richbuild_visits").insert({ visitor_id: visitorId, first_visit: now, last_visit: now });
        }
      } catch {
        // Retention logging is best-effort — never block the app on it (e.g. before
        // migration 0014 is applied, or offline).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
