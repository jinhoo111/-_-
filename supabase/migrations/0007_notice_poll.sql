-- ════════════════════════════════════════════════════════════════════════
-- 공지 객관식 투표(Notice Poll)
-- ------------------------------------------------------------------------
--  · 관리자가 서비스 공지(0006)에 선택지를 붙여 게시하면, 사용자가 배너에서 1표 투표.
--    공지 JSON 확장:  { id, title, body, type, active,
--                       poll: { id, q, options:[문자열…] } }
--    - poll.id 는 표를 누적하는 키. 선택지가 바뀌지 않으면 재저장해도 유지(표 보존).
--  · notice_votes: 1인 1표(poll_id,user_id 기본키). 재투표 시 선택만 갱신.
--    RLS로 "본인 표"만 읽고 쓸 수 있음 → 누가 뭘 골랐는지 남에게 노출되지 않음.
--  · 집계는 security definer 함수로만 공개(선택지별 표 수). 개별 표는 비공개.
-- 적용: Supabase SQL Editor 에 붙여넣고 실행(또는 `supabase db push`).
-- ════════════════════════════════════════════════════════════════════════

-- 1) 투표 테이블
create table if not exists public.notice_votes(
  poll_id  text        not null,
  user_id  uuid        not null references auth.users(id) on delete cascade,
  choice   int         not null check (choice >= 0 and choice < 10),
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

alter table public.notice_votes enable row level security;

-- 2) RLS: 본인 표만 조회/등록/수정 (타인의 선택은 조회 불가)
drop policy if exists notice_votes_select_own on public.notice_votes;
create policy notice_votes_select_own on public.notice_votes
  for select using (auth.uid() = user_id);

drop policy if exists notice_votes_insert_own on public.notice_votes;
create policy notice_votes_insert_own on public.notice_votes
  for insert with check (auth.uid() = user_id);

drop policy if exists notice_votes_update_own on public.notice_votes;
create policy notice_votes_update_own on public.notice_votes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) 집계 공개 함수 → { "0": 3, "1": 7 } 형태(선택지 index → 표 수)
create or replace function public.get_notice_poll_results(p_poll_id text) returns jsonb
  language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_object_agg(choice::text, cnt), '{}'::jsonb)
  from (
    select choice, count(*) as cnt
    from public.notice_votes
    where poll_id = p_poll_id
    group by choice
  ) t;
$$;
grant execute on function public.get_notice_poll_results(text) to anon, authenticated;

-- 4) 투표 함수(로그인 필수 · 1인 1표 · 재투표 시 선택 변경) → 갱신된 집계 반환
create or replace function public.vote_notice_poll(p_poll_id text, p_choice int) returns jsonb
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;
  if p_choice < 0 or p_choice > 9 then
    raise exception 'bad_choice';
  end if;
  insert into public.notice_votes(poll_id, user_id, choice)
  values (p_poll_id, auth.uid(), p_choice)
  on conflict (poll_id, user_id)
    do update set choice = excluded.choice, voted_at = now();
  return public.get_notice_poll_results(p_poll_id);
end;
$$;
grant execute on function public.vote_notice_poll(text, int) to authenticated;
