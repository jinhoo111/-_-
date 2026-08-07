"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";
import { useProfile } from "@/lib/queries/useProfile";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

// Shows the onboarding wizard for real (non-anonymous) users who don't have a profile
// row yet (brand-new signups). Existing accounts — even those predating the onboarding
// flag — are NOT blocked, so live users and the E2E suite keep working uninterrupted.
// (Legacy forced onboarding for everyone, but that would disrupt existing accounts here.)
export function OnboardingGate() {
  const { data: profile, isLoading } = useProfile();
  const { data: user } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await createClient().auth.getUser();
      return data.user ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !user || user.is_anonymous) return null;
  if (profile) return null; // existing profile → already set up

  return <OnboardingWizard />;
}
