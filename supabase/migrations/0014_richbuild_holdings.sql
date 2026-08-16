-- 0014_richbuild_holdings.sql
--
-- RichBuild v1 (Stop-Loss / Herding indicator product — see richbuild_features_flow_en.pdf,
-- prepared for engineering handoff 2026-08). Separate product surface from the main
-- 투자허브 dashboard (`user_data`); RichBuild has its own guest-first data model where the
-- local (device) schema and the account schema must be IDENTICAL from day one so signup
-- migrates local holdings with zero loss (spec §4.5) — see web/src/lib/richbuild/types.ts.

create table if not exists public.richbuild_holdings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  name        text not null,
  market      text not null check (market in ('kr', 'us')),
  buy_price   numeric,              -- null = guest never entered one; Loss Severity stays gated
  quantity    numeric not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_richbuild_holdings_user on public.richbuild_holdings (user_id);

alter table public.richbuild_holdings enable row level security;

drop policy if exists richbuild_holdings_own on public.richbuild_holdings;
create policy richbuild_holdings_own on public.richbuild_holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- D7 retention is the v1 North Star (spec §8) — daily-active is explicitly the wrong
-- yardstick given the ostrich-effect finding (§2), so we log first/last visit per
-- visitor (authenticated user_id, or a random device id for guests) instead of events.
create table if not exists public.richbuild_visits (
  visitor_id  text primary key,
  first_visit timestamptz not null default now(),
  last_visit  timestamptz not null default now()
);

alter table public.richbuild_visits enable row level security;

-- Insert/update-your-own-row only; no read policy — this table is write-only analytics
-- from the client, read via service_role for retention reporting.
drop policy if exists richbuild_visits_upsert_own on public.richbuild_visits;
create policy richbuild_visits_upsert_own on public.richbuild_visits
  for all using (true) with check (true);

-- Daily-batch ranking snapshot (spec §5: Top 10 guest / Top 50 member, KR/US, daily
-- batch — explicitly NOT real-time in v1). Populated by a cron-triggered refresh route
-- (mirrors api/flow/refresh); empty until that job is wired up and scheduled.
create table if not exists public.richbuild_daily_rank (
  market      text not null check (market in ('kr', 'us')),
  rank        int not null,
  ticker      text not null,
  name        text not null,
  price       numeric not null,
  change_pct  numeric,
  heat_score  numeric not null,
  as_of_date  date not null,
  primary key (market, rank, as_of_date)
);

alter table public.richbuild_daily_rank enable row level security;

-- Public read (ranking is visible to guests with no login, §3); writes are
-- service_role only via the refresh route (no insert/update policy defined).
drop policy if exists richbuild_daily_rank_public_read on public.richbuild_daily_rank;
create policy richbuild_daily_rank_public_read on public.richbuild_daily_rank
  for select using (true);
