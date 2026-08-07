# Anonymous Sign-ins ("free without login") — setup

The web app supports a "free without login" mode via Supabase **Anonymous Sign-ins**.
The code is in place and guarded — nothing breaks until you flip the switch.

## ✅ Already done (2026-08-07)

- **Migrations `0012_user_profile_onboarding.sql` and `0013_anonymous_access.sql` are APPLIED**
  (via the Supabase Management API). The `user_profiles` onboarding columns and the anonymous
  RLS policies exist in the database.

## ⚠️ Remaining manual step — enable in Supabase dashboard

1. Supabase → your project (`yijkwuiqnviapztqskak`) → **Authentication → Sign In / Up**.
2. Turn **ON** *Anonymous Sign-Ins* (current value: `external_anonymous_users_enabled = false`).
3. Optional: set a JWT expiry that fits your product (e.g. **30 days**).

> This cannot be done from the Management API with the current access token (403 — the token
> has query-only privileges, not auth-config privileges). It's a dashboard toggle.

## Set the env flag (after the toggle above)

Add to the environment (local `.env.local` and Vercel):

```
ALLOW_ANON=true
```

This is a **server-only** env var read by `web/src/lib/supabase/middleware.ts`. While it is
not set (or the project hasn't enabled anonymous sign-ins yet), the middleware keeps the old
behavior: unauthenticated users are redirected to `/login`. When `ALLOW_ANON=true` and the
project supports it, the middleware silently creates an anonymous session instead.

Anonymous users are covered by the existing `auth.uid() = user_id` policies on
`user_data` / `voc_requests` / `notice_votes` (plus the explicit policies in `0013`).

## 4. UX notes

- Anonymous guests get the **AttachEmailBanner** (`components/layout/AttachEmailBanner.tsx`)
  nudging them to `/signup` for cross-device sync — the successor to the legacy guest CTA.
- Onboarding/settings are **skipped** for anonymous users (`useProfile()` returns null when
  `user.is_anonymous`).
- `/security` stays admin-only — an anonymous user hitting it is sent to `/login`.
