"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";

// UI-only affordance (show the /security nav link). The authoritative check is
// server-side in middleware.ts (ADMIN_PATHS) and RLS — never trust this for gating.
export function useIsAdmin() {
  const { data } = useQuery({
    queryKey: ["admin", "is-admin"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();
      return Boolean(profile?.is_admin);
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return data ?? false;
}
