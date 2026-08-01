"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { authErrText } from "@/lib/auth/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("auth.forgot.emailRequired"));
      return;
    }
    setError(t("auth.forgot.processing"));
    setPending(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setPending(false);
    setError("");

    if (resetError) {
      console.warn("[forgotPw] status=%s code=%s msg=%s", resetError.status, resetError.code, resetError.message);
      // Reset emails share the same send-rate limit as signup — same mapper.
      setError(t(authErrText(resetError)));
      return;
    }
    setMessage(t("auth.forgot.sent"));
  }

  return (
    <>
      <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("auth.forgot.title")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="forgot-email" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {t("auth.forgot.email")}
          </label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{error}</p>}
        {message && <p className="text-[var(--text-md)] text-[var(--color-success-text)]">{message}</p>}
        <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
          {t("auth.forgot.submit")}
        </Button>
      </form>
      <div className="mt-4 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        <Link href="/login" className="hover:underline">
          {t("auth.forgot.backToLogin")}
        </Link>
      </div>
    </>
  );
}
