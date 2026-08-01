"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { authErrIsRateLimit, authErrText, passwordStrength } from "@/lib/auth/errors";
import { useResendCooldown } from "@/lib/auth/useResendCooldown";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LanguageProvider";

const STRENGTH_COLOR = ["", "bg-[var(--color-error)]", "bg-[var(--color-warning)]", "bg-[var(--color-success)]"];

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const t = useT();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"form" | "verify">(searchParams.get("verify") === "1" ? "verify" : "form");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendIsError, setResendIsError] = useState(false);
  const cooldown = useResendCooldown();

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(t("auth.signup.fillRequired"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.signup.passwordTooShort"));
      return;
    }
    if (password !== password2) {
      setError(t("auth.signup.passwordMismatch"));
      return;
    }

    setPending(true);
    const supabase = createClient();
    // emailRedirectTo must point back to the app, not the Supabase project's
    // Site URL default — otherwise the confirm link 404s.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);

    if (signUpError) {
      console.warn("[signUp] status=%s code=%s msg=%s", signUpError.status, signUpError.code, signUpError.message);
      setError(t(authErrText(signUpError)));
      return;
    }

    // With email confirmation on, Supabase returns 200 + identities:[] for an
    // already-registered address instead of an error (avoids leaking account
    // existence). Detect that here rather than trusting the absence of an error.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError(t("auth.signup.alreadyRegistered"));
      return;
    }

    setEmail(trimmedEmail);
    setView("verify");
    // First verification email was just sent by signUp() itself — lock resend
    // for 60s so an immediate click doesn't burn the shared send-rate limit.
    cooldown.start(60);
  }

  async function handleResend() {
    if (cooldown.remaining > 0) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setResendIsError(true);
      setResendMsg(t("auth.signup.verify.noEmail"));
      return;
    }
    setResendIsError(false);
    setResendMsg(t("auth.signup.verify.sending"));
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: trimmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (resendError) {
      console.warn("[resend] status=%s code=%s msg=%s", resendError.status, resendError.code, resendError.message);
      setResendIsError(true);
      const lm = (resendError.message || "").toLowerCase();
      if (authErrIsRateLimit(resendError)) {
        setResendMsg(t("auth.signup.verify.rateLimited"));
        cooldown.start(60);
      } else if (lm.includes("already confirmed") || resendError.code === "email_already_confirmed") {
        setResendMsg(t("auth.signup.verify.alreadyConfirmed"));
      } else {
        setResendMsg(t("auth.signup.verify.resendFailed", { reason: t(authErrText(resendError)) }));
      }
      return;
    }

    setResendIsError(false);
    setResendMsg(t("auth.signup.verify.resendSuccess"));
    cooldown.start(60);
  }

  if (view === "verify") {
    return (
      <>
        <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("auth.signup.verify.title")}</h1>
        <p className="mt-4 text-[var(--text-md)] text-[var(--color-text-tertiary)]">
          {t("auth.signup.verify.sentTo", { email })}
        </p>
        {resendMsg && (
          <p
            className={`mt-3 text-[var(--text-md)] ${resendIsError ? "text-[var(--color-error-text)]" : "text-[var(--color-success-text)]"}`}
          >
            {resendMsg}
          </p>
        )}
        <Button type="button" onClick={handleResend} disabled={cooldown.remaining > 0} className="mt-4 w-full">
          {cooldown.remaining > 0 ? t("auth.signup.verify.resendCooldown", { seconds: cooldown.remaining }) : t("auth.signup.verify.resend")}
        </Button>
        <div className="mt-4 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
          <Link href="/login" className="hover:underline">
            {t("auth.signup.verify.backToLogin")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("auth.signup.title")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="signup-email" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {t("auth.signup.email")}
          </label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {email && (
            <p
              className={`mt-1 text-[var(--text-xs)] ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]"}`}
            >
              {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? t("auth.signup.emailFormatOk") : t("auth.signup.emailFormatBad")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="signup-pw" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {t("auth.signup.password")}
          </label>
          <Input
            id="signup-pw"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password && (
            <>
              <div className="mt-1.5 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i < strength ? STRENGTH_COLOR[strength] : "bg-[var(--color-border-default)]"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                {password.length < 8 ? t("auth.signup.passwordMinHint") : t(`auth.signup.strength.${strength}`)}
              </p>
            </>
          )}
        </div>
        <div>
          <label htmlFor="signup-pw2" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {t("auth.signup.passwordConfirm")}
          </label>
          <Input
            id="signup-pw2"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
          {password2 && (
            <p
              className={`mt-1 text-[var(--text-xs)] ${password === password2 ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]"}`}
            >
              {password === password2 ? t("auth.signup.passwordMatchOk") : t("auth.signup.passwordMatchBad")}
            </p>
          )}
        </div>
        {error && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
          {pending ? t("auth.signup.submitting") : t("auth.signup.submit")}
        </Button>
      </form>
      <div className="mt-4 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        {t("auth.signup.haveAccount")}{" "}
        <Link href="/login" className="hover:underline">
          {t("auth.signup.login")}
        </Link>
      </div>
    </>
  );
}
