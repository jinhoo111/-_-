"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface KeyStatus {
  exists: boolean;
  masked?: string;
}

export interface AdminKeysStatus {
  dart: KeyStatus;
  finnhub: KeyStatus;
}

const ADMIN_KEYS_KEY = ["admin", "keys-status"];

async function callKeysApi(action: string, extra: Record<string, unknown> = {}) {
  const res = await fetch("/api/admin/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || "request_failed");
  return data;
}

export function useAdminKeysStatus() {
  return useQuery({
    queryKey: ADMIN_KEYS_KEY,
    queryFn: async () => (await callKeysApi("admin-keys-status")) as AdminKeysStatus,
  });
}

export function useSaveDartKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => callKeysApi("store-dart-key", { key }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_KEYS_KEY }),
  });
}

export function useDeleteDartKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => callKeysApi("delete-dart-key"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_KEYS_KEY }),
  });
}

export function useSaveFinnhubKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => callKeysApi("admin-save-finnhub-key", { key }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_KEYS_KEY }),
  });
}

export function useDeleteFinnhubKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => callKeysApi("admin-delete-finnhub-key"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_KEYS_KEY }),
  });
}
