"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { createClient } from "@/lib/supabase/browser";
import { authErrText } from "@/lib/auth/errors";
import { logRichbuildEvent } from "@/lib/richbuild/logEvent";
import { useT } from "@/lib/i18n/LanguageProvider";

// authErrText returns an i18n message KEY; mapped onto richbuild.authError.* below
// instead of duplicating the error-classification logic.
const AUTH_ERROR_KEY: Record<string, string> = {
  "authError.rateLimit": "richbuild.authError.rateLimit",
  "authError.invalidCredentials": "richbuild.authError.invalidCredentials",
  "authError.emailNotConfirmed": "richbuild.authError.emailNotConfirmed",
  "authError.alreadyRegistered": "richbuild.authError.alreadyRegistered",
  "authError.weakPassword": "richbuild.authError.weakPassword",
  "authError.networkError": "richbuild.authError.networkError",
  "authError.invalidEmailFormat": "richbuild.authError.invalidEmailFormat",
  "authError.unknown": "richbuild.authError.unknown",
};

export default function RichBuildLoginPage() {
  return (
    <Suspense>
      <RichBuildLoginForm />
    </Suspense>
  );
}

function RichBuildLoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError(t("richbuild.login.errorFillFields"));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { data, error: authError } =
      mode === "signup"
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(false);
    if (authError) {
      const key = authErrText(authError);
      setError(t(AUTH_ERROR_KEY[key] ?? "richbuild.authError.unknown"));
      return;
    }
    // Working-flow diagram §4: signup fires a discrete signup_completed event (distinct
    // from the plain visit-timestamp log) at guest→member conversion.
    if (mode === "signup") await logRichbuildEvent("signup_completed", data.user?.id ?? null);
    router.push(redirectTo);
  }

  async function handleGoogle() {
    setError("");
    setGooglePending(true);
    const supabase = createClient();
    // signup_completed for the Google path is logged in /auth/callback (new-user
    // heuristic there) since this redirects away before we'd know the outcome.
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
    // Only reachable on failure — success navigates away to Google's consent screen
    // before this resolves. Without this, an unconfigured/misconfigured provider (e.g.
    // "Google" not yet enabled in Supabase) just did nothing visible on click.
    if (authError) {
      setGooglePending(false);
      setError(
        authError.message.toLowerCase().includes("provider is not enabled")
          ? t("richbuild.login.errorGoogleNotEnabled")
          : t("richbuild.login.errorGoogleGeneric"),
      );
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md text-center">
      <h1 className="font-display text-[var(--text-xl)] font-bold text-[var(--text-primary)]">{t("richbuild.login.title")}</h1>
      <div className="mt-4 flex justify-center">
        <Tabs
          items={[
            { id: "signup", label: t("richbuild.login.signupTab") },
            { id: "login", label: t("richbuild.login.loginTab") },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "signup" | "login")}
        />
      </div>

      {mode === "signup" && (
        <>
          <p className="mt-4 text-[var(--text-sm)] text-[var(--text-secondary)]">{t("richbuild.login.signupSubtitle")}</p>
          <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] px-4 py-3 text-[var(--text-xs)] text-[var(--text-muted)]">
            {t("richbuild.login.migrationNote")}
          </div>
        </>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {showEmailForm ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 text-left">
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <Input
              type="password"
              placeholder={t("richbuild.login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            {error && <p className="text-[var(--text-sm)] text-[var(--negative)]">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? t("richbuild.login.submitPending") : mode === "signup" ? t("richbuild.login.submitSignup") : t("richbuild.login.submitLogin")}
            </Button>
          </form>
        ) : (
          <Button variant="primary" onClick={() => setShowEmailForm(true)}>
            {t("richbuild.login.continueEmail")}
          </Button>
        )}
        <Button variant="secondary" onClick={handleGoogle} disabled={googlePending}>
          {googlePending ? t("richbuild.login.googlePending") : t("richbuild.login.continueGoogle")}
        </Button>
        {!showEmailForm && error && <p className="text-[var(--text-sm)] text-[var(--negative)]">{error}</p>}
      </div>

      <button
        onClick={() => router.push("/home")}
        className="mt-5 text-[var(--text-xs)] text-[var(--text-muted)] opacity-60 transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:opacity-100"
      >
        {t("richbuild.login.continueGuest")}
      </button>
    </Card>
  );
}
