"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";
import { EMPTY_USER_DATA, type UserData } from "@/lib/types/userData";

const USER_DATA_KEY = ["user_data"];

async function fetchUserData(): Promise<UserData> {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error("not_authenticated");

  const { data, error } = await supabase.from("user_data").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return data as UserData;

  return { user_id: user.id, updated_at: new Date().toISOString(), ...EMPTY_USER_DATA };
}

export function useUserData() {
  return useQuery({ queryKey: USER_DATA_KEY, queryFn: fetchUserData });
}

// Debounced upsert into user_data, mirroring the old app's _syncToCloud
// (1.2s debounce) but with a properly typed payload instead of a JS blob.
export function useUpdateUserData() {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return function updateUserData(patch: Partial<Omit<UserData, "user_id">>, immediate = false) {
    const current = queryClient.getQueryData<UserData>(USER_DATA_KEY);
    if (!current) return;
    const next: UserData = { ...current, ...patch, updated_at: new Date().toISOString() };
    queryClient.setQueryData(USER_DATA_KEY, next);

    if (timerRef.current) clearTimeout(timerRef.current);
    const doSync = async () => {
      const supabase = createClient();
      const { error } = await supabase.from("user_data").upsert(next);
      if (error) console.warn("[sync] user_data upsert failed:", error.message);
    };
    if (immediate) doSync();
    else timerRef.current = setTimeout(doSync, 1200);
  };
}
