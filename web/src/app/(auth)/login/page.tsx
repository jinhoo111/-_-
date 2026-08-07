"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { authErrIsEmailNotConfirmed, authErrText } from "@/lib/auth/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError(t("auth.login.fillRequired"));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);

    if (signInError) {
      console.warn("[signIn] status=%s code=%s msg=%s", signInError.status, signInError.code, signInError.message);
      setError(t(authErrText(signInError)));
      if (authErrIsEmailNotConfirmed(signInError)) {
        router.push(`/signup?verify=1&email=${encodeURIComponent(email.trim())}`);
      }
      return;
    }

    router.push(searchParams.get("redirectTo") || "/portfolio");
  }

  return (
    <>
      <div className="text-center">
        <h1 className="font-display text-[var(--text-2xl)] font-bold tracking-[var(--tracking-heading)] text-[var(--text-primary)]">
          {t("auth.login.title")}
        </h1>
        <p className="mt-1.5 text-[var(--text-base)] text-[var(--text-secondary)]">{t("auth.login.subtitle")}</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
            {t("auth.login.email")}
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="login-pw" className="mb-2 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
            {t("auth.login.password")}
          </label>
          <Input
            id="login-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-[var(--text-md)] text-[var(--negative)]">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
          {pending ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => router.push("/forgot-password")}>
          {t("auth.login.forgotPassword")}
        </Button>
      </form>
      <div className="mt-5 text-center text-[var(--text-sm)] text-[var(--text-muted)]">
        {t("auth.login.signupPrompt")}{" "}
        <Link href="/signup" className="font-semibold text-[var(--accent)]">
          {t("auth.login.signup")}
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--accent-soft)] p-4">
        <span className="text-[var(--text-md)] font-semibold text-[var(--accent)]">{t("guest.cta.title")}</span>
        <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">{t("guest.cta.body")}</span>
        <Link
          href="/signup"
          className="mt-1 inline-flex h-[var(--btn-h-sm)] w-fit items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-[14px] text-[var(--text-sm)] font-semibold text-[var(--text-on-accent)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--accent-hover)]"
        >
          {t("guest.cta.cta")}
        </Link>
      </div>
    </>
  );
}
