"use client";

import { useState } from "react";
import { useUpdateProfile } from "@/lib/queries/useProfile";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";

// 4-step onboarding wizard, ported from legacy #ob-overlay:
// type → age(개인)/industry(기업) → purposes → marketing opt-in.
const AGE_OPTIONS = ["20s", "30s", "40s", "50s", "60plus"] as const;
const BIZ_OPTIONS = ["manufacturing", "it", "finance", "service", "retail", "other"] as const;
const PERSONAL_PURPOSES = ["portfolio", "news", "reg", "research", "journal"] as const;
const BUSINESS_PURPOSES = ["competitor", "holdings", "dart", "reg", "market", "alert"] as const;

function purposeKey(p: string) {
  return `onboarding.purpose.${p}`;
}

export function OnboardingWizard() {
  const t = useT();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<"personal" | "business" | null>(null);
  const [ageRange, setAgeRange] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [purposes, setPurposes] = useState<string[]>([]);
  const [marketing, setMarketing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isBiz = type === "business";
  const purposeOptions = isBiz ? BUSINESS_PURPOSES : PERSONAL_PURPOSES;

  function togglePurpose(p: string) {
    setPurposes((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function canNext(): boolean {
    if (step === 0) return type != null;
    if (step === 1) return isBiz ? businessType !== "" : ageRange !== "";
    if (step === 2) return purposes.length > 0;
    return true;
  }

  async function submit() {
    if (!type) return;
    setSaving(true);
    setError("");
    try {
      await updateProfile.mutateAsync({
        user_type: type,
        age_range: isBiz ? undefined : ageRange || undefined,
        business_type: isBiz ? businessType || undefined : undefined,
        purposes,
        marketing_opt_in: marketing,
        onboarding_done: true,
      });
      // success → OnboardingGate's profile cache updates and the overlay unmounts
    } catch {
      setError(t("onboarding.err.saveFailed"));
      setSaving(false);
    }
  }

  const optionBtn = (active: boolean) =>
    `flex flex-col items-start gap-1 rounded-[var(--radius-control)] border px-4 py-3 text-left transition-colors ${
      active
        ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-bg)]"
        : "border-[var(--color-border-input)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-overlay)]"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6">
        <h2 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("onboarding.title")}</h2>
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("onboarding.subtitle")}</p>

        {step === 0 && (
          <div className="flex flex-col gap-2">
            <button type="button" className={optionBtn(type === "personal")} onClick={() => setType("personal")}>
              <span className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">{t("onboarding.type.personal")}</span>
              <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("onboarding.type.personalDesc")}</span>
            </button>
            <button type="button" className={optionBtn(type === "business")} onClick={() => setType("business")}>
              <span className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">{t("onboarding.type.business")}</span>
              <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("onboarding.type.businessDesc")}</span>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">
              {isBiz ? t("onboarding.biz.title") : t("onboarding.age.title")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(isBiz ? BIZ_OPTIONS : AGE_OPTIONS).map((opt) => {
                const active = isBiz ? businessType === opt : ageRange === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    className={optionBtn(active)}
                    onClick={() => (isBiz ? setBusinessType(opt) : setAgeRange(opt))}
                  >
                    <span className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">{t(`onboarding.${isBiz ? "biz" : "age"}.${opt}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2">
            <span className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("onboarding.purpose.title")}</span>
            <div className="flex flex-wrap gap-2">
              {purposeOptions.map((p) => {
                const active = purposes.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePurpose(p)}
                    className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-[var(--text-sm)] ${active ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"}`}
                  >
                    {t(purposeKey(p))}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-2">
            <span className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("onboarding.marketing.title")}</span>
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("onboarding.marketing.body")}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMarketing(true)}
                className={`flex-1 rounded-[var(--radius-control)] border px-4 py-2.5 text-[var(--text-sm)] ${marketing ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-bg)]" : "border-[var(--color-border-input)]"}`}
              >
                {t("onboarding.marketing.yes")}
              </button>
              <button
                type="button"
                onClick={() => setMarketing(false)}
                className={`flex-1 rounded-[var(--radius-control)] border px-4 py-2.5 text-[var(--text-sm)] ${!marketing ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-bg)]" : "border-[var(--color-border-input)]"}`}
              >
                {t("onboarding.marketing.no")}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{error}</p>}

        <div className="mt-2 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="default" onClick={() => setStep((s) => s - 1)}>
              {t("onboarding.prev")}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button variant="primary" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
              {t("onboarding.next")}
            </Button>
          ) : (
            <Button variant="primary" disabled={saving} onClick={submit}>
              {saving ? "⟳" : t("onboarding.submit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
