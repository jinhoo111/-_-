"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { authErrIsRateLimit, authErrText, passwordStrength } from "@/lib/auth/errors";
import { useResendCooldown } from "@/lib/auth/useResendCooldown";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const STRENGTH_LABEL = ["", "약해요 — 영문과 숫자를 섞어보세요.", "적당해요.", "안전해요 👍"];
const STRENGTH_COLOR = ["", "bg-[var(--color-error)]", "bg-[var(--color-warning)]", "bg-[var(--color-success)]"];

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
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
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호가 일치하지 않습니다.");
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
      setError(authErrText(signUpError));
      return;
    }

    // With email confirmation on, Supabase returns 200 + identities:[] for an
    // already-registered address instead of an error (avoids leaking account
    // existence). Detect that here rather than trusting the absence of an error.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해주세요.");
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
      setResendMsg("이메일 정보가 없습니다. 회원가입을 다시 진행해주세요.");
      return;
    }
    setResendIsError(false);
    setResendMsg("발송 중...");
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
        setResendMsg(
          "메일 발송 한도에 걸렸습니다(서비스 전체 기준). 60초 후 다시 시도해주세요. 계속 안 오면 스팸함 확인 후 관리자에게 문의해주세요.",
        );
        cooldown.start(60);
      } else if (lm.includes("already confirmed") || resendError.code === "email_already_confirmed") {
        setResendMsg("이미 인증이 완료된 계정입니다. 로그인해주세요.");
      } else {
        setResendMsg("재발송 실패: " + authErrText(resendError));
      }
      return;
    }

    setResendIsError(false);
    setResendMsg("인증 이메일을 재발송했습니다. 도착까지 1~2분 걸릴 수 있고, 스팸함도 확인해주세요.");
    cooldown.start(60);
  }

  if (view === "verify") {
    return (
      <>
        <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">이메일 인증</h1>
        <p className="mt-4 text-[var(--text-md)] text-[var(--color-text-tertiary)]">
          <span className="font-medium text-[var(--color-text-primary)]">{email}</span> 주소로 인증 링크를
          발송했습니다. 받은 편지함(스팸함 포함)을 확인해주세요.
        </p>
        {resendMsg && (
          <p
            className={`mt-3 text-[var(--text-md)] ${resendIsError ? "text-[var(--color-error-text)]" : "text-[var(--color-success-text)]"}`}
          >
            {resendMsg}
          </p>
        )}
        <Button type="button" onClick={handleResend} disabled={cooldown.remaining > 0} className="mt-4 w-full">
          {cooldown.remaining > 0 ? `재발송 (${cooldown.remaining}초)` : "인증 이메일 재발송"}
        </Button>
        <div className="mt-4 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
          <Link href="/login" className="hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">회원가입</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="signup-email" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            이메일
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
              {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "✓ 사용 가능한 형식이에요." : "이메일 형식을 확인해주세요."}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="signup-pw" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            비밀번호
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
                {password.length < 8 ? "최소 8자가 필요해요." : STRENGTH_LABEL[strength]}
              </p>
            </>
          )}
        </div>
        <div>
          <label htmlFor="signup-pw2" className="mb-1 block text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            비밀번호 확인
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
              {password === password2 ? "✓ 비밀번호가 일치해요." : "비밀번호가 일치하지 않아요."}
            </p>
          )}
        </div>
        {error && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
          {pending ? "처리 중..." : "회원가입"}
        </Button>
      </form>
      <div className="mt-4 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="hover:underline">
          로그인
        </Link>
      </div>
    </>
  );
}
