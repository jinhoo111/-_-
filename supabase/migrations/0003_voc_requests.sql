-- ════════════════════════════════════════════════════════════════════════
-- VoC(기능 요청·문의) 수집 테이블
-- ------------------------------------------------------------------------
-- 설계 원칙
--  · 기존 테이블(user_profiles / user_data / security_events)은 건드리지 않는
--    "순수 추가" → 적용해도 현재 서비스 동작에 영향 없음.
--  · 쓰기(INSERT): 로그인 사용자가 '본인 것'만 등록(auth.uid() = user_id).
--  · 읽기(SELECT): 관리자만 전체 조회 → 관리자 대시보드에서 목록/엑셀 확인.
--  · 일반 사용자는 남의 요청을 조회할 수 없음.
-- 적용: Supabase 대시보드 SQL Editor 또는 `supabase db push` 로 실행.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.voc_requests (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),

  -- 누가(계정)
  user_id     uuid references auth.users(id) on delete set null,
  email       text,
  user_type   text,   -- personal | business

  -- 무엇을
  category    text,   -- 기능요청 | 문의 | 버그 | 기타
  message     text not null
);

create index if not exists idx_voc_created on public.voc_requests (created_at desc);

-- ── RLS: 쓰기는 본인만, 읽기는 관리자만 ──────────────────────────────────
alter table public.voc_requests enable row level security;

-- 로그인 사용자: 본인(user_id = auth.uid()) 행만 INSERT
drop policy if exists voc_user_insert on public.voc_requests;
create policy voc_user_insert on public.voc_requests
  for insert
  with check (auth.uid() = user_id);

-- 관리자: 전체 SELECT (대시보드/엑셀용)
drop policy if exists voc_admin_read on public.voc_requests;
create policy voc_admin_read on public.voc_requests
  for select
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

-- 관리자: DELETE (처리 완료·스팸 정리용)
drop policy if exists voc_admin_delete on public.voc_requests;
create policy voc_admin_delete on public.voc_requests
  for delete
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );
