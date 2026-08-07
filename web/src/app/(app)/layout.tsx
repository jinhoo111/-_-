import { AppFooter } from "@/components/layout/AppFooter";
import { AppNav } from "@/components/layout/AppNav";
import { ServiceNoticeBanner } from "@/components/layout/ServiceNoticeBanner";
import { AttachEmailBanner } from "@/components/layout/AttachEmailBanner";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { BizPendingOverlay } from "@/components/onboarding/BizPendingOverlay";
import { HelpFab } from "@/components/layout/HelpFab";
import { AutoFetchPrices } from "@/components/layout/AutoFetchPrices";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-0)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-[var(--surface-0)]">
        <AppNav />
      </header>
      <ServiceNoticeBanner />
      <AttachEmailBanner />
      <DisclaimerBanner />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-6 px-6 pt-8 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-16">
        {children}
      </main>
      <AppFooter />
      <OnboardingGate />
      <BizPendingOverlay />
      <HelpFab />
      <AutoFetchPrices />
    </div>
  );
}
