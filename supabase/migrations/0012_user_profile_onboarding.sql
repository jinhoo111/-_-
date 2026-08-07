-- 0012_user_profile_onboarding.sql
-- Onboarding / profile columns on user_profiles, ported from legacy index.html
-- (the old SPA wrote these via the onboarding wizard and the profile modal).
-- Idempotent: safe to run even if some columns already exist.

alter table public.user_profiles add column if not exists user_type text;      -- 'personal' | 'business'
alter table public.user_profiles add column if not exists age_range text;      -- '20s'|'30s'|'40s'|'50s'|'60plus'
alter table public.user_profiles add column if not exists business_type text;  -- KSIC-ish category key
alter table public.user_profiles add column if not exists purposes jsonb;      -- array of feature keys
alter table public.user_profiles add column if not exists marketing_opt_in boolean default false;
alter table public.user_profiles add column if not exists onboarding_done boolean default false;
