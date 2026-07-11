-- ════════════════════════════════════════════════════════════════════════
-- 외부 API 응답 공유 캐시(api_cache)
-- ------------------------------------------------------------------------
--  · 왜 DB인가: Edge Function의 메모리(Map) 캐시는 요청마다 다른 isolate가 처리할 수
--    있어 공유되지 않는다(실측: 연속 호출이 전부 MISS). 인스턴스와 무관하게 공유되는
--    저장소가 필요해 Postgres 테이블을 캐시로 사용한다.
--  · 목적: 시세·뉴스·레이팅처럼 "누가 요청하든 같은 응답"인 데이터를 TTL 동안 재사용해
--    Finnhub 분당 60회 한도를 사용자 수와 분리한다.
--  · 접근: Edge Function(service_role)만 읽고 쓴다. RLS 켜고 정책을 두지 않아
--    일반 사용자(anon/authenticated)는 어떤 접근도 불가.
-- 적용: Supabase SQL Editor 에 붙여넣고 실행(또는 `supabase db push`).
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.api_cache (
  key        text primary key,              -- 예: fh:quote?symbol=NVDA
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

-- 만료 항목 정리용(오래된 것부터 훑기)
create index if not exists idx_api_cache_updated on public.api_cache (updated_at);

alter table public.api_cache enable row level security;
-- 정책 없음 = service_role(Edge Function) 외에는 접근 불가.
