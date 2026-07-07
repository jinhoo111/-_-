-- ════════════════════════════════════════════════════════════════════════
-- 관리자 계정 관리: 회원 목록/통계 + 유형·승인 변경
-- ------------------------------------------------------------------------
--  · user_profiles 에 email 컬럼 추가(+ auth.users 에서 백필/동기화 트리거).
--  · 관리자 전체 SELECT/UPDATE 정책 추가(기존 '본인 행' 정책은 그대로 유지 — 순수 추가).
--  · ⚠️ user_profiles 정책이 user_profiles 를 직접 조회하면 RLS 무한재귀 → 반드시
--    security definer 함수 is_admin() 로 우회.
-- 적용: Supabase SQL Editor 또는 `supabase db push`.
-- ════════════════════════════════════════════════════════════════════════

-- 1) email 컬럼 + 백필
alter table public.user_profiles add column if not exists email text;

update public.user_profiles p
  set email = u.email
  from auth.users u
  where u.id = p.user_id and (p.email is null or p.email = '');

-- 신규/변경 시 email 자동 채움(앱이 못 넣는 경우 대비)
create or replace function public.sync_profile_email() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or new.email = '' then
    select email into new.email from auth.users where id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_sync_profile_email on public.user_profiles;
create trigger trg_sync_profile_email
  before insert or update on public.user_profiles
  for each row execute function public.sync_profile_email();

-- 2) 관리자 판별 함수(재귀 방지: security definer 로 RLS 우회)
create or replace function public.is_admin() returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and is_admin = true
  );
$$;

-- 3) 관리자 전체 조회/수정 정책(본인 행 정책과 별개로 추가)
alter table public.user_profiles enable row level security;

drop policy if exists profiles_admin_read on public.user_profiles;
create policy profiles_admin_read on public.user_profiles
  for select using (public.is_admin());

drop policy if exists profiles_admin_update on public.user_profiles;
create policy profiles_admin_update on public.user_profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 참고: 특정 계정을 기업으로 즉시 등록하려면 —
--   update public.user_profiles p set user_type='business', business_approved=true
--     from auth.users u where u.id=p.user_id and u.email='someone@example.com';
