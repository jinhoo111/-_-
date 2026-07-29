"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { authErrIsEmailNotConfirmed, authErrText } from "@/lib/auth/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
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
      setError("이메일과 비밀번호를 입력해주세요.");
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
      setError(authErrText(signInError));
      if (authErrIsEmailNotConfirmed(signInError)) {
        router.push(`/signup?verify=1&email=${encodeURIComponent(email.trim())}`);
      }
      return;
    }

    router.push(searchParams.get("redirectTo") || "/portfolio");
  }

  return (
    <>
      <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">로그인</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            이메일
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
          <label htmlFor="login-pw" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            비밀번호
          </label>
          <Input
            id="login-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
          {pending ? "로그인 중..." : "로그인"}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        <Link href="/forgot-password" className="hover:underline">
          비밀번호 찾기
        </Link>
        <Link href="/signup" className="hover:underline">
          회원가입
        </Link>
      </div>
    </>
  );
}
