import type { AuthError } from "@supabase/supabase-js";

type AuthErrorLike = Pick<AuthError, "message" | "status"> & { code?: string | null };

// Supabase auth errors are English; the app is localized via i18n keys.
// Centralize the mapping here instead of comparing message strings at each
// call site — that pattern let new errors (rate limits especially) leak raw
// English text to users. Callers resolve the returned key with t().
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
    return "authError.rateLimit";
  }
  if (lm.includes("invalid login") || code === "invalid_credentials" || lm.includes("invalid_credentials")) {
    return "authError.invalidCredentials";
  }
  if (lm.includes("email not confirmed") || code === "email_not_confirmed") {
    return "authError.emailNotConfirmed";
  }
  if (lm.includes("already registered") || lm.includes("already been registered") || code === "user_already_exists") {
    return "authError.alreadyRegistered";
  }
  if (lm.includes("password") && lm.includes("should be")) {
    return "authError.weakPassword";
  }
  if (lm.includes("failed to fetch") || lm.includes("networkerror")) {
    return "authError.networkError";
  }
  if (lm.includes("validate email") || lm.includes("invalid format") || code === "validation_failed") {
    return "authError.invalidEmailFormat";
  }
  // Never fall through to `m`: Supabase messages are English; callers resolve keys via t().
  if (m) console.warn("[auth] unmapped error:", code, m);
  return "authError.unknown";
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
