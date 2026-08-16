"use client";

import { useRichbuildVisitTracking } from "@/lib/richbuild/useVisitTracking";

export function RichBuildVisitTracker() {
  useRichbuildVisitTracking();
  return null;
}
