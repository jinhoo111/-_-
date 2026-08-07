"use client";

import { useAutoFetchPrices } from "@/lib/queries/useAutoFetchPrices";

// Client wrapper so the background auto-fetch can live in the (server) app layout.
export function AutoFetchPrices() {
  useAutoFetchPrices();
  return null;
}
