-- ════════════════════════════════════════════════════════════════════════
-- 회원 최근 접속일: user_profiles.last_seen
-- ------------------------------------------------------------------------
--  · 앱 진입(로그인 세션 확인) 시 클라이언트가 본인 행 last_seen 을 갱신(세션당 1회).
--  · 기존 값은 auth.users.last_sign_in_at 으로 1회 백필.
--  · 읽기: 관리자(0004 profiles_admin_read), 쓰기: 본인(기존 own-update 정책) → 추가 정책 불필요.
-- 적용: Supabase SQL Editor 또는 `supabase db push`.
-- ════════════════════════════════════════════════════════════════════════

alter table public.user_profiles add column if not exists last_seen timestamptz;

-- 기존 사용자: 마지막 로그인 시각으로 백필
update public.user_profiles p
  set last_seen = u.last_sign_in_at
  from auth.users u
  where u.id = p.user_id and p.last_seen is null;
