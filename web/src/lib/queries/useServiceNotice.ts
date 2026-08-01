"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";
import type { ServiceNotice } from "./useSecurityAdmin";

const NOTICE_KEY = ["public-notice"];

export function useServiceNotice() {
  return useQuery({
    queryKey: NOTICE_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_service_notice");
      if (error) throw error;
      return (data ?? null) as ServiceNotice | null;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useNoticePollPublicResults(pollId: string | null) {
  return useQuery({
    queryKey: ["public-notice", "poll-results", pollId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_notice_poll_results", { p_poll_id: pollId });
      if (error) throw error;
      return (data ?? {}) as Record<string, number>;
    },
    enabled: !!pollId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useMyNoticeVote(pollId: string | null) {
  return useQuery({
    queryKey: ["public-notice", "my-vote", pollId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !pollId) return null;
      const { data } = await supabase
        .from("notice_votes")
        .select("choice")
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .maybeSingle();
      return (data?.choice ?? null) as number | null;
    },
    enabled: !!pollId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useVoteNoticePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pollId, choice }: { pollId: string; choice: number }) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("vote_notice_poll", { p_poll_id: pollId, p_choice: choice });
      if (error) throw error;
    },
    onSuccess: (_data, { pollId }) => {
      queryClient.invalidateQueries({ queryKey: ["public-notice", "poll-results", pollId] });
      queryClient.invalidateQueries({ queryKey: ["public-notice", "my-vote", pollId] });
    },
  });
}
