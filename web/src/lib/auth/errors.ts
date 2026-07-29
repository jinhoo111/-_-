import type { AuthError } from "@supabase/supabase-js";

type AuthErrorLike = Pick<AuthError, "message" | "status"> & { code?: string | null };

// Supabase auth errors are English; the app is Korean-only. Centralize the
// mapping here instead of comparing message strings at each call site — that
// pattern let new errors (rate limits especially) leak raw English text to users.
export function authErrIsRateLimit(error?: AuthErrorLike | null): boolean {
  const m = (error?.message || "").toLowerCase();
  const code = error?.code || "";
  // "for security purposes..." is Supabase's same-address resend cooldown message,
  // sometimes returned with status 400 — status/code alone won't catch it.
  return (
    error?.status === 429 ||
    code === "over_email_send_rate_limit" ||
    m.includes("rate limit") ||
    m.includes("too many") ||
    m.includes("for security purposes") ||
    m.includes("you can only request this after")
  );
}

export function authErrText(error?: AuthErrorLike | null): string {
  const m = error?.message || "";
  const lm = m.toLowerCase();
  const code = error?.code || "";

  if (authErrIsRateLimit(error)) {
    return "메일 발송 한도에 걸렸습니다(서비스 전체 기준). 잠시 후 다시 시도하거나 관리자에게 문의해주세요.";
  }
  if (lm.includes("invalid login") || code === "invalid_credentials" || lm.includes("invalid_credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (lm.includes("email not confirmed") || code === "email_not_confirmed") {
    return "이메일 인증이 필요합니다. 받은 편지함(스팸함 포함)을 확인해주세요.";
  }
  if (lm.includes("already registered") || lm.includes("already been registered") || code === "user_already_exists") {
    return "이미 가입된 이메일입니다. 로그인해주세요.";
  }
  if (lm.includes("password") && lm.includes("should be")) {
    return "비밀번호가 보안 요건을 충족하지 않습니다. 8자 이상으로 설정해주세요.";
  }
  if (lm.includes("failed to fetch") || lm.includes("networkerror")) {
    return "네트워크 연결을 확인해주세요.";
  }
  if (lm.includes("validate email") || lm.includes("invalid format") || code === "validation_failed") {
    return "이메일 주소 형식이 올바르지 않습니다. 예: name@example.com";
  }
  // Never fall through to `m`: Supabase messages are English and users are Korean.
  if (m) console.warn("[auth] unmapped error:", code, m);
  return "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

export function authErrIsEmailNotConfirmed(error?: AuthErrorLike | null): boolean {
  const lm = (error?.message || "").toLowerCase();
  return lm.includes("email not confirmed") || error?.code === "email_not_confirmed";
}

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 3) as 0 | 1 | 2 | 3;
}
