"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";

// user_profiles row shape used by onboarding/settings (mirrors legacy columns).
export interface UserProfile {
  user_id: string;
  email?: string;
  user_type?: "personal" | "business";
  age_range?: string;
  business_type?: string;
  purposes?: string[];
  marketing_opt_in?: boolean;
  onboarding_done?: boolean;
  business_approved?: boolean;
  is_admin?: boolean;
  created_at?: string;
  last_seen?: string;
}

const PROFILE_KEY = ["user_profile"];

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async (): Promise<UserProfile | null> => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return null;
      if (user.is_anonymous) return null; // anonymous guests skip onboarding
      const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return (data as UserProfile) ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserProfile>): Promise<UserProfile> => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("no_user");
      const { data, error } = await supabase
        .from("user_profiles")
        .upsert({ user_id: user.id, ...patch })
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY, data);
    },
  });
}
