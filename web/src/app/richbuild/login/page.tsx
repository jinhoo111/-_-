"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { createClient } from "@/lib/supabase/browser";
import { authErrText } from "@/lib/auth/errors";

// authErrText returns an i18n message KEY (the dashboard resolves it via t()); RichBuild
// has no i18n layer yet (spec's mockups are English-only for v1), so map the same keys
// to plain English here instead of duplicating the error-classification logic.
const AUTH_ERROR_TEXT: Record<string, string> = {
  "authError.rateLimit": "Too many attempts — please wait a moment and try again.",
  "authError.invalidCredentials": "Incorrect email or password.",
  "authError.emailNotConfirmed": "Please confirm your email before logging in.",
  "authError.alreadyRegistered": "That email is already registered — try logging in instead.",
  "authError.weakPassword": "Password is too weak — use at least 8 characters.",
  "authError.networkError": "Network error — check your connection and try again.",
  "authError.invalidEmailFormat": "Enter a valid email address.",
  "authError.unknown": "Something went wrong — please try again.",
};

export default function RichBuildLoginPage() {
  return (
    <Suspense>
      <RichBuildLoginForm />
    </Suspense>
  );
}

function RichBuildLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/richbuild";
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter an email and password.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: authError } =
      mode === "signup"
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(false);
    if (authError) {
      const key = authErrText(authError);
      setError(AUTH_ERROR_TEXT[key] ?? AUTH_ERROR_TEXT["authError.unknown"]);
      return;
    }
    router.push(redirectTo);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md text-center">
      <h1 className="font-display text-[var(--text-xl)] font-bold text-[var(--text-primary)]">Login / Sign Up</h1>
      <div className="mt-4 flex justify-center">
        <Tabs
          items={[
            { id: "signup", label: "Sign Up" },
            { id: "login", label: "Login" },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "signup" | "login")}
        />
      </div>

      {mode === "signup" && (
        <>
          <p className="mt-4 text-[var(--text-sm)] text-[var(--text-secondary)]">Sign up to manage unlimited holdings</p>
          <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] px-4 py-3 text-[var(--text-xs)] text-[var(--text-muted)]">
            Holdings you&rsquo;ve added will transfer automatically
          </div>
        </>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {showEmailForm ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 text-left">
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            {error && <p className="text-[var(--text-sm)] text-[var(--negative)]">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Please wait…" : mode === "signup" ? "Sign Up" : "Login"}
            </Button>
          </form>
        ) : (
          <Button variant="primary" onClick={() => setShowEmailForm(true)}>
            Continue with Email
          </Button>
        )}
        <Button variant="secondary" onClick={handleGoogle}>
          Continue with Google
        </Button>
      </div>

      <button
        onClick={() => router.push("/richbuild")}
        className="mt-5 text-[var(--text-sm)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        Continue browsing without signup →
      </button>
    </Card>
  );
}
