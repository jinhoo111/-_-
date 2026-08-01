"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";

// UI-only affordance (show real AI-briefing card vs ProLockCard). The authoritative
// check happens server-side in /api/monitor/brief — never trust this for gating.
export function useIsPro() {
  const { data } = useQuery({
    queryKey: ["monitor", "is-pro"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_admin, business_approved")
        .eq("user_id", user.id)
        .single();
      return Boolean(profile?.is_admin || profile?.business_approved);
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return data ?? false;
}
