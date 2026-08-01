"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";

export type Severity = "info" | "warn" | "critical";

export interface SecurityEvent {
  id: number;
  created_at: string;
  event_type: string;
  severity: Severity;
  risk_score: number;
  email: string | null;
  user_id: string | null;
  ip: string | null;
  detail: Record<string, unknown>;
}

const SECURITY_EVENTS_KEY = ["security", "events"];

export function useSecurityEvents() {
  return useQuery({
    queryKey: SECURITY_EVENTS_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("security_events")
        .select("id,created_at,event_type,severity,risk_score,email,user_id,ip,detail")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as SecurityEvent[];
    },
  });
}

export function useDeleteSecurityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createClient();
      const { error } = await supabase.from("security_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SECURITY_EVENTS_KEY }),
  });
}

export function useClearSecurityEvents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("security_events").delete().gt("id", 0);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SECURITY_EVENTS_KEY }),
  });
}

// ── VOC ──

export type VocStatus = "진행중" | "보류" | "완료";

export interface VocRequest {
  id: number;
  created_at: string;
  email: string | null;
  user_type: string | null;
  category: string | null;
  message: string;
  status: VocStatus | null;
}

const VOC_KEY = ["security", "voc"];

export function useVocRequests() {
  return useQuery({
    queryKey: VOC_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("voc_requests")
        .select("id,created_at,email,user_type,category,message,status")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as VocRequest[];
    },
  });
}

export function useSetVocStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: VocStatus | null }) => {
      const supabase = createClient();
      const { error } = await supabase.from("voc_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOC_KEY }),
  });
}

export function useDeleteVoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createClient();
      const { error } = await supabase.from("voc_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOC_KEY }),
  });
}

// ── Accounts ──

export interface AdminAccount {
  user_id: string;
  email: string | null;
  user_type: string | null;
  business_approved: boolean | null;
  is_admin: boolean | null;
  created_at: string;
  last_seen: string | null;
}

const ACCOUNTS_KEY = ["security", "accounts"];

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id,email,user_type,business_approved,is_admin,created_at,last_seen")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as AdminAccount[];
    },
  });
}

export function useSetAccountType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, type }: { userId: string; type: "personal" | "business" }) => {
      const supabase = createClient();
      const patch: { user_type: string; business_approved?: boolean } = { user_type: type };
      if (type === "business") patch.business_approved = true;
      const { error } = await supabase.from("user_profiles").update(patch).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useSetAccountApproved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from("user_profiles").update({ business_approved: approved }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "delete_failed");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

// ── Service notice (admin editor) ──

export interface NoticePoll {
  id: string;
  q: string;
  options: string[];
}

export interface ServiceNotice {
  id: string;
  title: string;
  body: string;
  type: "info" | "warn";
  active: boolean;
  poll: NoticePoll | null;
}

export function useAdminServiceNotice() {
  return useQuery({
    queryKey: ["security", "notice", "admin"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("service_notice")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return (data?.service_notice ?? null) as ServiceNotice | null;
    },
  });
}

export function useSaveServiceNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notice: ServiceNotice) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");
      const { error } = await supabase.from("user_profiles").update({ service_notice: notice }).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security", "notice", "admin"] }),
  });
}

export function useClearServiceNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (current: ServiceNotice | null) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");
      const notice: ServiceNotice = {
        id: current?.id ?? "",
        title: current?.title ?? "",
        body: current?.body ?? "",
        type: current?.type ?? "info",
        active: false,
        poll: null,
      };
      const { error } = await supabase.from("user_profiles").update({ service_notice: notice }).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security", "notice", "admin"] }),
  });
}

export function useNoticePollResults(pollId: string | null) {
  return useQuery({
    queryKey: ["security", "notice", "poll-results", pollId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_notice_poll_results", { p_poll_id: pollId });
      if (error) throw error;
      return (data ?? {}) as Record<string, number>;
    },
    enabled: !!pollId,
  });
}
