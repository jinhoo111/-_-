"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { authErrText } from "@/lib/auth/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
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
      setError("이메일을 입력해주세요.");
      return;
    }
    setError("처리 중...");
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
      setError(authErrText(resetError));
      return;
    }
    setMessage("재설정 링크를 발송했습니다. 이메일을 확인해주세요.");
  }

  return (
    <>
      <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">비밀번호 찾기</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="forgot-email" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            이메일
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
          재설정 링크 보내기
        </Button>
      </form>
      <div className="mt-4 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        <Link href="/login" className="hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    </>
  );
}
