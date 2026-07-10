-- ════════════════════════════════════════════════════════════════════════
-- 서비스 공지(Service Notice)
-- ------------------------------------------------------------------------
--  · 관리자가 자기 user_profiles.service_notice(jsonb)에 공지를 저장.
--    (본인 행 UPDATE 정책이 이미 있으므로 앱에서 직접 update 가능)
--  · 전체 사용자는 security definer 함수 get_service_notice() 로 활성 공지 1건만
--    읽음. user_profiles 를 일반 SELECT 하면 RLS(본인 행/관리자)로 막히므로,
--    RLS 를 우회하되 공지 필드만 노출하는 함수로 안전하게 공개.
--  · 공지 JSON 형태: { id, title, body, type("info"|"warn"), active }
--    - id: 게시 시각 등 유니크 값(클라이언트 dismiss 1회 노출 추적용)
-- 적용: Supabase SQL Editor 에 붙여넣고 실행(또는 `supabase db push`).
-- ════════════════════════════════════════════════════════════════════════

-- 1) service_notice 컬럼(관리자 행에만 실질 사용)
alter table public.user_profiles add column if not exists service_notice jsonb;

-- 2) 활성 공지 1건만 읽는 공개 함수(RLS 우회 · 공지 필드만 반환)
create or replace function public.get_service_notice() returns jsonb
  language sql security definer stable set search_path = public as $$
  select service_notice
  from public.user_profiles
  where is_admin = true
    and service_notice is not null
    and coalesce((service_notice->>'active')::boolean, false) = true
  limit 1;
$$;

-- 3) 로그인 여부와 무관하게 공지를 볼 수 있도록 실행 권한 부여
grant execute on function public.get_service_notice() to anon, authenticated;
