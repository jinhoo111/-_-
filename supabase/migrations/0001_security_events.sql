-- ════════════════════════════════════════════════════════════════════════
-- Phase 1: 보안 이벤트 로그 (이상행위 감지 + 운영 대시보드의 단일 데이터 소스)
-- ------------------------------------------------------------------------
-- 설계 원칙
--  · 기존 테이블(user_profiles / user_data)은 전혀 건드리지 않는 "순수 추가" 이므로
--    적용해도 현재 서비스 동작에 영향 없음(코드 꼬임 없음).
--  · 쓰기(INSERT)는 Edge Function이 service_role 로 수행 → RLS 우회.
--  · 읽기(SELECT)는 관리자만 허용 → 대시보드에서 안전하게 조회.
--  · 일반 사용자는 이 테이블에 어떤 접근 권한도 없음.
-- 적용: Supabase 대시보드 SQL Editor 또는 `supabase db push` 로 실행.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),

  -- 주체(누가). 로그인 실패 등 사용자 식별 전 이벤트는 user_id 가 null 일 수 있음.
  user_id     uuid references auth.users(id) on delete set null,
  email       text,

  -- 분류(무엇을). 예: login_success, login_fail, auth_forged, key_access,
  --                 key_change, rate_limit, blocked, suspicious, impossible_travel
  event_type  text not null,

  -- 등급(얼마나 위험). info | warn | critical  →  대시보드 필터/알림 기준
  severity    text not null default 'info' check (severity in ('info','warn','critical')),

  -- 위험 점수(규칙 + 행동기준선 + 시그니처 합산). 0 = 정상
  risk_score  int  not null default 0,

  -- 신원 신호 (어디서/무엇으로)
  ip          text,
  country     text,
  user_agent  text,
  device_hash text,   -- UA+화면+언어 등을 해시한 디바이스 지문(원문 저장 안 함)

  -- 부가 컨텍스트(행위 상세). 예: {"action":"store-dart-key","fail_reason":"..."}
  detail      jsonb not null default '{}'::jsonb
);

-- 대시보드 조회 최적화 인덱스
create index if not exists idx_secevt_created         on public.security_events (created_at desc);
create index if not exists idx_secevt_user_created    on public.security_events (user_id, created_at desc);
create index if not exists idx_secevt_type_created    on public.security_events (event_type, created_at desc);
-- 위험 이벤트(info 제외)만 빠르게 — 부분 인덱스로 저장공간 절약
create index if not exists idx_secevt_severe          on public.security_events (created_at desc)
  where severity <> 'info';

-- ── RLS: 읽기는 관리자만, 쓰기는 service_role(Edge Function)만 ──────────────
alter table public.security_events enable row level security;

-- 관리자만 SELECT (대시보드용)
drop policy if exists secevt_admin_read on public.security_events;
create policy secevt_admin_read on public.security_events
  for select
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

-- 일반 사용자용 INSERT/UPDATE/DELETE 정책은 두지 않음.
-- → Edge Function 의 service_role 키만 RLS 를 우회해 기록할 수 있음(변조 불가).
