"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { authErrText } from "@/lib/auth/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function ResetPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      console.warn("[resetPw] status=%s code=%s msg=%s", updateError.status, updateError.code, updateError.message);
      setError(t(authErrText(updateError)));
      return;
    }
    router.push("/portfolio");
  }

  return (
    <>
      <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{t("auth.reset.title")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="reset-pw" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {t("auth.reset.newPassword")}
          </label>
          <Input
            id="reset-pw"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="reset-pw2" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {t("auth.reset.confirmPassword")}
          </label>
          <Input
            id="reset-pw2"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>
        {error && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
          {t("auth.reset.submit")}
        </Button>
      </form>
    </>
  );
}
