-- 0013_anonymous_access.sql
--
-- "Free without login" — Supabase Anonymous Sign-ins.
--
-- ⚠️ PREREQUISITE (Supabase dashboard, cannot be done from SQL):
--   Authentication → Sign In / Up → Anonymous Sign-Ins → Enable.
--   Pick a JWT expiry that fits "free, no forced signup" (e.g. 30 days).
--   The web app is guarded by `ALLOW_ANON=true` (server env); without it the
--   middleware keeps the old hard /login gate, so this is safe to ship early.
--
-- Anonymous users get a real auth.users row, so the existing `auth.uid() = user_id`
-- policies already cover them. This file just makes that explicit and idempotent,
-- and notes the one table whose RLS must be audited (user_profiles: one row per anon
-- user can bloat; the web app's useProfile() skips anon users, so no row is created).

-- user_data: anon can read/write their own blob
drop policy if exists user_data_anon_own on public.user_data;
create policy user_data_anon_own on public.user_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- voc_requests: anon can submit, admin reads
drop policy if exists voc_requests_anon_insert on public.voc_requests;
create policy voc_requests_anon_insert on public.voc_requests
  for insert with check (auth.uid() = user_id);

-- notice_votes: anon can vote their own poll rows
drop policy if exists notice_votes_anon_own on public.notice_votes;
create policy notice_votes_anon_own on public.notice_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTE: user_profiles — leave admin-only policies as-is. Anonymous users are treated
-- as guests (useProfile() returns null and the onboarding/settings UI is skipped for
-- them), so no per-anon profile row is created.
