"use client";

import { useEffect, useState } from "react";
import { useProfile, useUpdateProfile } from "@/lib/queries/useProfile";
import { useUserData } from "@/lib/queries/useUserData";
import { useDisplayPrefs, UPDOWN_SCHEMES, CURRENCIES } from "@/lib/displayPrefs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/LanguageProvider";

// Profile/settings page, ported from legacy #profile-overlay: type, age/business,
// purposes, marketing opt-in. (Admin shared-key management stays in /security.)
const AGE_OPTIONS = ["20s", "30s", "40s", "50s", "60plus"] as const;
const BIZ_OPTIONS = ["manufacturing", "it", "finance", "service", "retail", "other"] as const;
const PERSONAL_PURPOSES = ["portfolio", "news", "reg", "research", "journal"] as const;
const BUSINESS_PURPOSES = ["competitor", "holdings", "dart", "reg", "market", "alert"] as const;

export default function SettingsPage() {
  const t = useT();
  const toast = useToast();
  const { data: profile, isLoading } = useProfile();
  const { data: userData, isLoading: userDataLoading } = useUserData();
  const updateProfile = useUpdateProfile();
  const { updown, currency, setUpdown, setCurrency } = useDisplayPrefs();
  const [form, setForm] = useState<{
    type: "personal" | "business";
    ageRange: string;
    businessType: string;
    purposes: string[];
    marketing: boolean;
  }>({ type: "personal", ageRange: "", businessType: "", purposes: [], marketing: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Intentional client-side hydration of the form from the async profile query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      type: profile.user_type === "business" ? "business" : "personal",
      ageRange: profile.age_range ?? "",
      businessType: profile.business_type ?? "",
      purposes: profile.purposes ?? [],
      marketing: !!profile.marketing_opt_in,
    });
  }, [profile]);

  if (isLoading) {
    return <Card className="h-96 animate-pulse bg-[var(--color-bg-overlay)]" />;
  }
  if (!profile) {
    return (
      <Card className="flex flex-col gap-2 p-6">
        <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("settings.title")}</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("settings.notFound")}</p>
      </Card>
    );
  }

  const isBiz = form.type === "business";
  const purposes = isBiz ? BUSINESS_PURPOSES : PERSONAL_PURPOSES;

  function togglePurpose(p: string) {
    setForm((f) => ({ ...f, purposes: f.purposes.includes(p) ? f.purposes.filter((x) => x !== p) : [...f.purposes, p] }));
  }

  function handleExport() {
    if (!userData) return; // button is disabled until the query resolves
    const payload = { exportedAt: new Date().toISOString(), app: "RichHub", ...userData };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `richhub-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show(t("settings.exported"), "success");
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        user_type: form.type,
        age_range: isBiz ? undefined : form.ageRange || undefined,
        business_type: isBiz ? form.businessType || undefined : undefined,
        purposes: form.purposes,
        marketing_opt_in: form.marketing,
      });
      toast.show(t("settings.saved"), "success");
    } catch {
      toast.show(t("settings.error"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{t("settings.emailLabel")}</span>
          <span className="font-mono text-[var(--text-md)] text-[var(--text-primary)]">{profile.email ?? "—"}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{t("settings.typeLabel")}</span>
          <div className="flex gap-2">
            {(["personal", "business"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: v }))}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  form.type === v
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
                }`}
              >
                {v === "personal" ? t("onboarding.type.personal") : t("onboarding.type.business")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{isBiz ? t("settings.bizLabel") : t("settings.ageLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {(isBiz ? BIZ_OPTIONS : AGE_OPTIONS).map((opt) => {
              const active = isBiz ? form.businessType === opt : form.ageRange === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => (isBiz ? { ...f, businessType: opt } : { ...f, ageRange: opt }))}
                  className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                    active
                      ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                      : "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
                  }`}
                >
                  {t(`onboarding.${isBiz ? "biz" : "age"}.${opt}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{t("settings.purposeLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {purposes.map((p) => {
              const active = form.purposes.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePurpose(p)}
                  className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                    active
                      ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                      : "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
                  }`}
                >
                  {t(`onboarding.purpose.${p}`)}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-[var(--text-md)] text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={form.marketing}
            onChange={(e) => setForm((f) => ({ ...f, marketing: e.target.checked }))}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {t("settings.marketingLabel")}
        </label>

        <div>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "⟳" : t("settings.save")}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <span className="font-display text-[var(--text-md)] font-semibold text-[var(--text-primary)]">🎨 {t("prefs.title")}</span>
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{t("prefs.updown.title")}</span>
          <div className="flex flex-wrap gap-2">
            {UPDOWN_SCHEMES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setUpdown(s.key)}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  updown === s.key
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
                }`}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{t("prefs.currency.title")}</span>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  currency === c.code
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
                }`}
              >
                {c.symbol} {t(c.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <span className="font-display text-[var(--text-md)] font-semibold text-[var(--text-primary)]">💾 {t("settings.export")}</span>
        <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{t("settings.exportDesc")}</span>
        <div>
          <Button variant="secondary" onClick={handleExport} disabled={userDataLoading || !userData}>
            {userDataLoading || !userData ? "…" : t("settings.export")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
