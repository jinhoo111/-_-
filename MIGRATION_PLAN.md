# RichHub Migration Plan — `index.html` → `web/` (Next.js)

> **Goal:** migrate *everything* from the legacy single-file SPA (`index.html`, 9,289 LOC)
> into the Next.js rewrite (`web/`, branch `rewrite/next`) — every feature, every small
> feature, every piece of UI text — and make the product **free without a forced login**.
> **Author:** Copilot audit + plan | **Date:** 2026-08-07 | **Status:** Draft for review
> **Companion docs:** `PROJECT_MAP.md` / `PROJECT_MAP_EN.md` (note: §13 of both is **stale** — see §1.4).

---

## 0. TL;DR

- **The rewrite is already ~95% feature-complete.** Verified via git log + code: Phases 1–6
  (Indices, Journal, News, Research, Flow, Monitor, Security admin) plus Phase 0 (auth +
  Portfolio) are all built and shipped on `rewrite/next`. The stale PROJECT_MAP still says
  "Phase 0 only" — that is wrong and should be fixed (see §7).
- **The real remaining gaps are small and well-defined:**
  1. The **Home dashboard widgets** (flow bar, competitor brief, tech signal scanner,
     portfolio-news feed) — deliberately removed in commit `f596e7a` ("remove Home page").
  2. The **auth-flow extras**: onboarding wizard, profile/settings modal, biz-pending
     overlay, guest CTA banner, dismissible disclaimer banner, help FAB + user-facing VoC form.
  3. A handful of **behavior/small features**: daily auto close-price fetch (04:30/15:30 KST),
     guest sample-data mode, live earnings calendar markers, notification dedup behaviors,
     `data_owner` account isolation.
  4. **i18n/copy parity**: a text-by-text sweep of legacy KO strings vs `messages.ts`.
  5. **QA/E2E depth** (feature-level tests) and **cutover** (Vercel + decommission legacy).
- **Big new requirement:** "free without login". Recommended approach = **Supabase Anonymous
  Sign-ins** (auto guest account, full cloud sync, all features work, RLS intact). Auth pages
  stay but become optional. Full design in §2.

---

## 1. Verified current state

### 1.1 Legacy `index.html` (reference, must stay live until cutover)

Single-file vanilla-JS SPA, **KO-only**, no build step. 8 top-level pages + the portfolio
page doubles as the Home view. Full inventory captured by audit (2026-08-07). Feature areas:

| Area | Legacy surface |
|---|---|
| **Portfolio / Home** | Hero metrics (총 평가금액 + USD/KRW toggle, 총 손익, 수익률, 보유 종목, 현금 KRW/USD inline edit), 오늘의 수급 요약 바, 경쟁사 브리핑 (Pro), 기술 신호 스캐너, 보유 종목 최신 소식, holdings table (filters/sort/edit/delete/hide, ticker autocomplete) |
| **Indices** | KOSPI/KOSDAQ/US/VIX/10Y–2Y/선물/코인/환율/원자재 sections, ⚙ display settings, load-time history, per-card external links, 지연/프리/애프터/종가 state labels |
| **News** | 시장 뉴스 (public) · 종목별 뉴스 · 월가 레이팅 · 실시간 시세 watchlist (last 3 login-gated) |
| **Research** | 리서치 사이트 (~20 curated links, categorized) · 규제 모니터링 (US/KR RSS + keyword search + live-dot states + cache) |
| **Flow** | 국내 수급 (기관/외국인, 순매수/매도 TOP, 내 보유 수급, 연속매도 경고) · 미국 내부자 (Form 4, CEO·CFO/내 종목 toggles, sorting) · 스마트머니 13F (8 investors, 신규/전량매도/비중/상위) |
| **Monitor** | DART + SEC company monitor: card/table/radar views, 지분변동/보유 현황/보유 변동 이력/팀 메모/공시 메모, 🔔 30-min polling, AI 브리핑 (Pro), demo preview, US SEC filings + Form 4 |
| **Journal** | 캘린더 (ledger/weight/glucose/workout/schedule/memo/impulse chips + goals) · 리포트 (KPI, monthly budget + weekly allocation, SVG charts) · 아카이브 · 투자 철학 (must/never + impulse auto-list) · 전체 알림 master toggle |
| **Security (admin)** | 이벤트 대시보드 · 회원 계정 관리 · 서비스 공지 + 객관식 투표 · 공용 시장 일정 · VoC (+CSV export) · 공용 API 키 관리 |
| **Auth/global** | login/signup/verify(resend cooldown)/forgot · 4-step onboarding wizard · profile modal · biz-pending overlay · guest CTA · help FAB + VoC form · disclaimer banner · theme toggle · guest sample data (NVDA/MU) |

Exhaustive sub-feature lists (every button/toggle/keyboard shortcut/empty state/localStorage
key/edge action) were captured in the audit and are folded into the checklist in §4.

### 1.2 Rewrite `web/` (as-built, verified 2026-08-07)

- **Routes:** all 7 `(app)/*` pages + `(auth)/*` pages + `/security` + ~26 `api/*` routes
  (quote, fx, crypto, search, news ×3, rating, flow ×6 + refresh, monitor ×7 + refresh/brief,
  research ×2, admin keys/delete-user, auth callback/signout).
- **Data layer:** `lib/supabase/{browser,server,admin,middleware}` · React Query hooks under
  `lib/queries/` · `user_data` blob type in `lib/types/userData.ts` · `api_cache` DB cache tier
  · `corp_map.json` ported (`lib/monitor/server.ts`).
- **i18n:** `lib/i18n/messages.ts`, ~644 keys each in ko & en, in sync; `LanguageProvider`
  (KO default, `rh_lang`), `useT()`. **No `home` namespace yet.**
- **Gating today:** `proxy.ts` middleware — only `/login /signup /forgot-password /auth` are
  public; everything else redirects to `/login`; `/security` is admin-only (server-checked).
  Pro/business is NOT route-gated (only inside `/api/monitor/brief`).
- **E2E:** Playwright suite (`e2e/`) — auth flow + route-protection + shell nav only. No
  per-feature interaction tests yet.
- **No TODOs/stubs** found in `web/src` (only intentional `ProLockCard`/`MonitorDemo`).

### 1.3 Parity matrix (legacy → web)

| Legacy area | Rewrite status | Notes |
|---|---|---|
| Auth (login/signup/verify/forgot/reset) | ✅ DONE | Rewrite adds proper reset-password page (legacy lacked it) |
| Portfolio (table + hero metrics + cash) | ✅ DONE | Hero metrics are on `/portfolio` |
| Indices | ✅ DONE | |
| News | ✅ DONE | Naver news tab added; `quotes` watchlist tab NOT present |
| Research | ✅ DONE | "restore exact legacy parity" commit |
| Flow | ✅ DONE | |
| Monitor | ✅ DONE | |
| Security admin (6 areas) | ✅ DONE | |
| **Home dashboard widgets** | ❌ MISSING | flow bar, competitor brief, tech scanner, portfolio news |
| **Auth-flow extras** | ❌ MISSING | onboarding, profile modal, biz-pending, guest CTA, disclaimer banner, help FAB/VoC form |
| **News `실시간 시세` watchlist** | ❌ MISSING | legacy quotes tab (login-gated watchlist) |
| **Live earnings markers** | ⚠️ PARTIAL | static local macro calendar only; live Finnhub/DART earnings deferred |
| **Daily auto close-price fetch** | ❌ MISSING | legacy `checkAndAutoFetch` (04:30/15:30 KST, dedup) |
| **Guest sample-data mode** | ❌ MISSING | legacy `pf_is_sample` (NVDA/MU preview) |
| **Notification/dedup behaviors** | ⚠️ PARTIAL | flow-alert dedup, notify master exist; per-day dedup keys not all ported |
| **i18n/copy parity** | ⚠️ PARTIAL | ~644 keys but legacy KO strings not yet diffed line-by-line |
| **E2E depth** | ⚠️ PARTIAL | auth/shell only |

### 1.4 Docs are stale

`PROJECT_MAP.md`/`PROJECT_MAP_EN.md` §13 (last updated 2026-07-29) say "Phase 0 only, nav
entries omitted". Git log shows Phases 1–6 shipped. **Update the maps as part of this work
(§7).**

---

## 2. Product decision: "free without login"

### 2.1 Today

Middleware forces `/login` for every page except the 4 public auth paths. All data lives in
`user_data` keyed by a Supabase `auth.users` id, protected by RLS. "No login" therefore
touches the data model, not just the UI.

### 2.2 Recommended: Supabase Anonymous Sign-ins (auto guest account)

Supabase has a built-in **Anonymous Sign-ins** feature: a visitor is silently given a
persistent anonymous `auth.users` row; later they can **link an email** to keep their data
and sync across devices. This preserves **every** feature exactly (cloud sync, RLS,
monitor 🔔 polling, VoC submission, journal, everything), so it best matches "migrate all
features".

**Changes required:**

1. **Supabase dashboard:** enable *Authentication → Sign In / Up → Anonymous Sign-Ins* for
   the project. Pick a JWT expiry (e.g. 30 days) that fits "free, no forced signup".
2. **Middleware (`proxy.ts` / `lib/supabase/middleware.ts`):** stop redirecting
   unauthenticated users. On any request with no session, create an anonymous session
   (`supabase.auth.signInAnonymously()` in the middleware), set the cookie, and continue.
   Keep `/security` admin-gated (needs a real user; see §2.5).
3. **RLS policies:** ensure tables (`user_data`, `user_profiles`, `voc_requests`,
   `notice_votes`, `monitor` state, …) allow the anonymous user id to read/write their own
   row — the standard `auth.uid() = user_id` policies already work for anonymous users once
   sign-ins are enabled; audit each table's policy.
4. **Guest sample data:** restore legacy behavior — a brand-new anonymous user with empty
   `user_data` sees sample NVDA/MU holdings + a "위 데이터는 예시 데이터 입니다." banner,
   exactly like `pf_is_sample` in legacy.
5. **"Save / attach email" prompt:** the *only* place login becomes visible — an optional
   banner/CTA ("내 데이터를 다른 기기에서도 보려면 이메일로 계정을 연결하세요") that calls
   Supabase's **link identity** flow. This is the natural successor to the legacy guest CTA.
6. **Logout semantics:** a guest's "로그아웃" clears the anonymous session (fresh guest on
   next visit); a linked user logs out normally.
7. **Admin console:** unchanged — still requires a real admin email/role (see §2.5).

### 2.3 Fallback: localStorage-only guest mode (documented, not recommended)

If anonymous sign-ins are unwanted: guest data goes to `localStorage` only (no Supabase
user), an optional signup "migrates local data up" to `user_data`. Cost: no cross-device
sync, RLS writes need an account, and features that assume a user id (VoC submit, monitor
alerts, notice votes) must be reworked or gated. **Recommendation: use §2.2.** This fallback
is noted here only so the decision is explicit.

### 2.4 Decision record

- **Chosen:** Anonymous Sign-ins (keep login/signup as an optional upgrade path + admin).
- **Why:** "all features" requirement + zero data-model disruption + free.
- **Rejected:** full auth removal (breaks admin console and cross-device sync).
- This is a proposal for review — revisit if the product intent differs.

### 2.5 Admin/Pro identity under no-login

- **Admin** stays a real logged-in user (hardcoded legacy email check `wlsgn1878@naver.com`
  is already replaced in web by `user_profiles.is_admin` + server-side checks — keep that;
  consider moving to a proper role claim eventually).
- **Pro/business** (competitor brief, AI brief): currently `business_approved` flag in
  `user_profiles`. With no-login, non-logged-in users are not Pro — decide whether the
  "free" tier makes everything free (drop Pro gating) or keep Pro for logged-in business
  users. **Recommendation:** keep the Pro lock on the two AI features for now (cheap to
  keep, matches legacy), revisit when pricing is real.

---

## 3. Migration phases (ordered)

> Each phase ends green: `npm run build`, `npm run lint`, `npx tsc --noEmit`, and any new
> E2E specs pass. **Never edit `index.html`** — it is the reference for behavior parity.

### Phase A — No-login foundation (prereq for everything below)

> **Status (2026-08-07):** CODE DONE, guarded. Middleware anon-session path + attach-email
> banner + guest CTA + RLS migration (`0013_anonymous_access.sql`) + `supabase/ANONYMOUS_SETUP.md`.
> **Migrations 0012 + 0013 APPLIED via Management API (2026-08-07)** — settings/onboarding
> DB write now works. STILL REQUIRED (dashboard-only, token lacks auth-config privileges):
> enable Anonymous Sign-ins in the Supabase dashboard (`external_anonymous_users_enabled`
> is currently `false`) + set `ALLOW_ANON=true` + Vercel env.
> Guest sample-data mode (`pf_is_sample`) not yet ported.
1. Enable Anonymous Sign-ins in Supabase dashboard + document JWT expiry.
2. Rework `lib/supabase/middleware.ts` / `proxy.ts`: anonymous session creation, drop the
   login redirect (keep `/security` admin gate).
3. Audit + adjust RLS policies for anonymous users on: `user_data`, `user_profiles`,
   `voc_requests`, `notice_votes`, `market_events` (already world-readable), `api_cache`.
4. Add guest sample-data mode (`EMPTY_USER_DATA` → NVDA/MU sample + banner) + a
   "attach email to save" CTA (replaces legacy guest CTA).
5. Update auth pages: login/signup become optional/upgrade, not a gate.
6. E2E: guest-can-browse-all-pages spec; guest data persists across reload.

### Phase B — Home dashboard widgets (biggest visible gap)
Port the 4 home components (legacy source → new files under `web/src/components/home/`,
rendered on `/portfolio` above the holdings table or on a restored `/` landing — see §B.5):
1. **오늘의 수급 요약 바** (`renderFlowBar`): institution/foreign #1 net-buy, "자세히 →" to
   `/flow`, 2-day institution sell-streak warning strip + "📝 일지로" button. Reuses
   `useFlow` KR rank data.
2. **경쟁사 브리핑 카드** (`renderCompetitorBrief`): Pro ✨ badge, non-Pro locked teaser
   (`ProLockCard` reuse), AI-summary button (dev-gated as in legacy), radar 전체보기.
3. **기술 신호 스캐너** (`renderTechCard`): 📡 스캔 button, golden-cross / 52-week-high /
   disparity chips, RSI·MFI grade badges, 산출 기준 legend, empty states. Needs a new
   `lib/market/technical.ts` (1y daily candles via Yahoo chart — semaphore throttling like
   legacy `_ySem`).
4. **보유 종목 최신 소식** (`#portfolio-news-section`): per-ticker feed (Finnhub US /
   Naver KR), "📝 일지로", "+N건 더보기/접기", "최근 7일 뉴스 없음", refresh; AI 요약 kept
   dev-gated.
5. Decide `/` landing: either restore a real Home page (hero + widgets + shortcuts) or keep
   `/` → `/portfolio` and put the widgets on `/portfolio`. **Recommendation:** put widgets on
   `/portfolio` (matches legacy where portfolio = home), leave `/` as redirect.

### Phase C — Auth-flow extras (small but important)

> **Status (2026-08-07):** onboarding wizard, profile/settings page, biz-pending overlay,
> guest CTA/attach-email, dismissible disclaimer banner, help FAB + VoC form — all DONE.
> (Admin shared-key section stays in `/security` `KeysSection`; onboarding shown to new users only.)
1. **Onboarding wizard** (4-step: type → age/business → purpose → marketing) — shown once
   after signup / on first guest→account link; writes `user_profiles`. Port from legacy
   `#ob-overlay`.
2. **Profile/settings modal** (email, type, age, business, purposes, marketing; admin shared
   DART/Finnhub key section) — port from `#profile-overlay`.
3. **Biz-pending overlay** for unapproved business accounts (⏳ "기업 계정 승인 대기 중").
4. **Dismissible disclaimer banner** (reuse `AppFooter` copy; `disclaimer_dismissed`).
5. **Help FAB + VoC form** (per-page tips from `HELP_CONTENT`, full accordion, 기능요청/
   문의/버그/기타 submission → `voc_requests`). VoC admin already exists — this adds the
   user-side submitter.

### Phase D — Small-feature & behavior parity sweep

> **Status (2026-08-07):** auto close-price fetch, live US earnings markers, news watchlist
> tab — DONE. Remaining: `data_owner` isolation, notification per-day dedup polish,
> per-user Google AI key decision (server key chosen).
1. **Daily auto close-price fetch:** `checkAndAutoFetch` — US batch ≥04:30 KST, KR ≥15:30
   KST, once/day dedup keys (`auto_fetch_us`/`auto_fetch_kr`). Runs in a client effect (and/or
   a cron route) mirroring legacy 60s timer.
2. **Live earnings calendar markers:** wire Finnhub `calendar/earnings` (US) + KR earnings
   into the journal calendar (currently static `MARKET_EVENTS` + `market_events` table only);
   un-defer `useMarketEvents` Phase-3 note.
3. **News `실시간 시세` watchlist tab** (`fh_q` symbols, default NVDA/AAPL/TSLA/MSFT, note
   "*미국 주식 실시간 · 국내(KS) 15분 딜레이").
4. **Notification/dedup behaviors:** `flow_alerted` daily dedup, notify per-memo/per-time,
   monitor alert dedup + `alertedNos` cap (100), browser Notification permission on demand.
5. **`data_owner` account isolation:** when a linked account signs in over a guest session,
   merge/clear local data the way legacy `_clearLocalUserData()` does.
6. **Misc behaviors:** `_syncSkipCols` missing-column retry on `user_data` upsert; `기타`
   broker default + 2-letter broker chip; `fxRate` default 1400 + Yahoo `KRW=X` fallback;
   `marketState` labels (지연/프리/애프터/종가) as price suffix; escape/safe-URL helpers;
   keyboard/accessibility (focus rings, 44px targets, `prefers-reduced-motion`).
7. **Per-user Google AI key flow** (legacy `store-key`/`googleai`): decide keep vs. server
   `OWNER_GEMINI_KEY`. **Recommendation:** keep server key (already done in `lib/monitor/server.ts`),
   drop per-user key UI (documented parity deviation).

### Phase E — i18n & UI-copy parity (text-by-text)
1. Extract every hardcoded KO string from legacy audit §8 into a checklist.
2. Diff against `lib/i18n/messages.ts` (644 keys) — add any missing keys to **both** ko and en.
3. New namespaces: `home` (widgets), `onboarding`, `profile`, `guest`, `help`, `disclaimer`,
   `news.quotes`.
4. Keep message-key indirection rules (non-component libs return keys, never text) and the
   proper-noun rule (broker names, `기타`, ticker keys stay Korean in both languages).

### Phase F — Backend/data parity (audit, mostly done)
1. Confirm every legacy Edge-Function action has a web route or is intentionally server-side:
   `fh-call` (quote/company-news/recommendation/price-target/earnings), `dart-proxy`
   (list/company/majorstock/elestock/otrCprInvstmntSttus), `yahoo-finance`, `flow-kr-rank`,
   `flow-kr-stock`, `sec-insider-latest`, `sec-13f`, `public-news`, `sec-company`,
   `sec-filings`, `sec-insider-stock`, `admin-delete-user`, `keys-ready`, `store/delete-fh-key`,
   `admin-*` key actions. (Web already covers nearly all; fill gaps.)
2. Port caching/expiry contracts: market news 60s, flow rank server-cache, insider/13F
   session cache, tech_scan daily, earnings US 6h / KR 24h, `reg_cache`.
3. DB migrations: add any columns/types needed for anonymous users, sample flag, new
   dedup keys, and live-earnings cache (reuse `api_cache`).

### Phase G — QA & E2E hardening
1. Feature-interaction E2E specs per area (portfolio CRUD, journal CRUD + charts, monitor
   add/memo/delete, admin security tabs, flow tabs, news tabs, home widgets).
2. Empty / loading / error + accessibility pass (legacy "not started" item) — skeleton,
   empty states, error+retry for every view; a11y (labels, focus, contrast, reduced motion).
3. Guest-path E2E: anonymous session created, all pages reachable, sample data shown,
   attach-email works.

### Phase H — Cutover & decommission
1. Deploy `web/` to Vercel (env: `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_*` keys, `FLOW_REFRESH_SECRET`, `ALLOWED_ORIGINS`).
2. Domain repoint (GitHub Pages `jinhoo111.github.io/-_-/` → Vercel).
3. Fix custom SMTP + restore email confirmation (legacy "urgent" open issue) before relying
   on email-link account attach.
4. Decommission GitHub Pages + legacy `proxy-api`/`market-data` Edge Functions once parity is
   confirmed and the last user migrations are done.
5. Update `PROJECT_MAP.md`/`PROJECT_MAP_EN.md` §13 to reflect the true state; refresh
   `CLAUDE.md` if needed.

---

## 4. Exhaustive "migrate everything" checklist

> Tick each box. Source = `index.html` (audit refs in parentheses). Blank = not yet done.

### A. Home / portfolio
- [ ] Hero metrics row — DONE (web portfolio page)
- [ ] USD/KRW toggle on total — DONE
- [ ] 현금 원화/달러 inline edit — DONE
- [x] 오늘의 수급 요약 바 (`renderFlowBar`) + 기관/외국인 1위 + 자세히→ /flow — **DONE 2026-08-07** (`components/home/FlowBar.tsx`)
- [x] 기관 연속 순매도 경고 strip + 📝 일지로 — **DONE 2026-08-07** (`FlowBar.tsx`)
- [x] 경쟁사 브리핑 카드 (Pro ✨, locked teaser, AI 요약 dev-gated) — **DONE 2026-08-07** (`components/home/CompetitorBriefCard.tsx`)
- [x] 기술 신호 스캐너 (스캔, golden-cross/52w-high/disparity, RSI/MFI grades, 산출 기준 legend) — **DONE 2026-08-07** (`components/home/TechSignalScanner.tsx` + `/api/market/technical` + `lib/market/technical.ts`)
- [x] 보유 종목 최신 소식 (per-ticker, 일지로, +N 더보기, 7일 없음, refresh) — **DONE 2026-08-07** (`components/home/PortfolioNewsSection.tsx`)
- [ ] 표: status/market/style filter pills (전체/보유/매수/관심/숨김 · 미장/국장 · 단타/장타)
- [ ] 표: sortable 수량/평가금액/수익률/비중 with ↑↓ indicators
- [ ] 표: inline edit row (1-at-a-time), 편집/삭제/숨김(복원)
- [ ] ticker autocomplete (local dict + Naver/Yahoo, debounce, arrows/Enter/Esc, outside-click)
- [ ] add-form auto market detect + auto price fetch + `#price-err` error box
- [ ] 13 brokers + 기타, 2-letter broker chip
- [ ] `marketState` suffix (지연/프리/애프터/종가)
- [ ] sample-data notice (guest mode, Phase A)

### B. Indices
- [ ] sections: 국내/미국/VIX/10Y−2Y/선물/코인/환율/원자재 — DONE
- [ ] ⚙ 표시 항목 설정 chips persisted (`idx_settings`) — DONE
- [ ] load-time history (소요시간 평균 N초, last-5) — DONE
- [ ] per-card external link (IDX_LINK_MAP) — DONE
- [ ] 10Y−2Y 4-band + 역전 flag — DONE
- [ ] skeleton cells per section — DONE
- [ ] CoinGecko 24h ▲▼ — DONE

### C. News
- [ ] 시장 뉴스 category pills (전체/외환/코인/M&A) + 20 cards — DONE
- [ ] 종목별 뉴스 (내 종목 chips, 15 cards) — DONE
- [ ] 월가 레이팅 consensus (Strong Buy→Sell pill, 3-seg bar, price target) — DONE
- [x] 실시간 시세 watchlist tab (`fh_q`, default NVDA/AAPL/TSLA/MSFT, 15분 딜레이 note) — **DONE 2026-08-07** (`components/news/QuotesView.tsx`, `news.tab.quotes`)
- [ ] 공용 Finnhub 연결 안내 box (`#fh-biz-note`) — check/port
- [ ] related-ticker chips + ko-KR time on cards — check/port

### D. Research
- [ ] 리서치 사이트 ~20 links, categories, badges — DONE
- [ ] 규제 모니터링 US/KR RSS + live-dot states + cache time — DONE
- [ ] keyword search + 최신 검색 + ✕ 초기화 — DONE

### E. Flow
- [ ] 국내 수급: 기관/외국인 toggle, 순매수/순매도 TOP, 내 보유 수급, 연속매도 경고 — DONE
- [ ] 미국 내부자: Form 4, 전체/매도/매수, CEO·CFO만, 내 종목만, 금액순/최신순/오래된순, 경영진 badge — DONE
- [ ] 13F: 8 investors, 신규/전량매도/비중/상위, `$1.2B` formatting, info box — DONE
- [ ] daily `flow_alerted` dedup — MISSING

### F. Monitor
- [ ] card/table/radar views — DONE
- [ ] search (Naver autocomplete, 6-digit, US ticker), 추가 — DONE
- [ ] 지분변동 (5%룰+임원, 신규/증가/매도), 보유 주식 현황, 보유 변동 이력 — DONE
- [ ] 공시 메모 + 팀 메모 (일지 연계, 공시 연계 badge) — DONE
- [ ] 🔔 alert toggle + 30-min polling + alertedNos cap(100) — DONE (verify)
- [ ] AI 브리핑 (Pro, server-gated) — DONE (live Gemini)
- [ ] demo/sample preview when no shared key — DONE (MonitorDemo)
- [ ] US SEC filings (8-K/10-Q/…) + item-code KO translation + Form 4 + EDGAR link — DONE

### G. Journal
- [ ] 캘린더 grid + day panel + chips (event/memo/schedule/impulse/ledger/weight/glucose/workout) — DONE
- [ ] summary bars + 🎯 goals (weight/glucose) — DONE
- [ ] ledger (income/expense categories, memo, delete, monthly totals) — DONE
- [ ] weight (±0.1 stepper, monthly goal, weekly overrides, chart) — DONE
- [ ] glucose (5 slots, ±1, status labels, reference ranges, disclaimer) — DONE
- [ ] workout done/off — DONE
- [ ] personal schedules (time optional, title/memo limits) — DONE
- [ ] memos (tags, ☆중요, notify per-time, inline compose) — DONE
- [ ] archive (tag filter, card/list, search, ⭐) — DONE
- [ ] philosophy (must/never, ↑↓, delete, impulse auto-list, sort) — DONE
- [ ] report (KPI, monthly budget + weekly allocation, 4 SVG charts, weekly weight input) — DONE
- [ ] 전체 알림 ON/OFF master toggle — DONE (verify)
- [x] live earnings markers — **DONE 2026-08-07** (`/api/market/earnings` + `lib/queries/useEarnings.ts`, merged into journal calendar; Finnhub US only, KR pending)
- [ ] glucose Phase 2 (charts, HbA1c) — PLANNED (was never built in legacy either)

### H. Security / admin
- [ ] events dashboard (stats, table, per-row delete, full clear) — DONE
- [ ] member management (stats, search, type convert, approve, delete w/ email confirm) — DONE
- [ ] service notice + poll (2–9 options, results, 내 표) — DONE
- [ ] market events admin + world-readable — DONE
- [ ] VoC list + status pills + CSV(BOM) export — DONE
- [ ] shared DART/Finnhub key mgmt (masked) — DONE
- [ ] account delete (email-type confirm → `admin-delete-user`) — DONE

### I. Auth & global
- [ ] login/signup/verify + 60s resend cooldown + rate-limit errors — DONE
- [ ] forgot/reset (web adds in-app reset) — DONE
- [x] onboarding wizard (4-step) — **DONE 2026-08-07** (`components/onboarding/OnboardingWizard.tsx` + `OnboardingGate.tsx`, shown to brand-new users only)
- [x] profile/settings page (+ admin keys section lives in /security) — **DONE 2026-08-07** (`app/(app)/settings/page.tsx`)
- [x] biz-pending overlay — **DONE 2026-08-07** (`components/onboarding/BizPendingOverlay.tsx`)
- [x] guest CTA / attach-email prompt (Phase A) — **DONE 2026-08-07** (login `guest.cta.*`, `AttachEmailBanner` for anonymous users)
- [x] dismissible disclaimer banner — **DONE 2026-08-07** (`components/layout/DisclaimerBanner.tsx`)
- [x] help FAB + VoC submit — **DONE 2026-08-07** (`components/layout/HelpFab.tsx` → `voc_requests`)
- [ ] theme toggle — DONE (next-themes)
- [ ] KO/EN — legacy KO-only; web has i18n — DONE+ (translate legacy strings)
- [ ] keyboard shortcuts, focus rings, 44px targets, reduced-motion — DONE (verify coverage)
- [ ] `data_owner` isolation — still open (anon sessions make this less urgent)
- [x] daily auto close-price fetch — **DONE 2026-08-07** (`lib/queries/useAutoFetchPrices.ts`, 04:30/15:30 KST dedup)

### J. i18n copy parity (text-by-text from legacy audit §8)
- [ ] title/logo 투자 대시보드 / 📊 투자 허브
- [ ] nav labels (기업 모니터링/투자 종목 관리/지수·환율/뉴스/💰 수급/리서치·규제/투자 일지/🛡️ 보안)
- [ ] hero labels (총 평가금액/총 손익/수익률/보유 종목/현금 (원화)/현금 (달러))
- [ ] filters (전체/보유/매수/관심/숨김 · 미장/국장 · 단타/장타) + columns
- [ ] guest CTA copy + login-gate copy
- [ ] section titles for all widgets/views
- [ ] journal labels (⭐중요/아카이브 저장/전체 알림/✏️ 이 날 일지 쓰기/💰 가계부/⚖️ 몸무게/🩸 혈당/🧨 뇌동매매/✅ 지켜야 할 것/❌ 절대 하면 안 되는 것)
- [ ] footer + disclaimer + data sources line
- [ ] auth strings (로그인/회원가입/비밀번호를 잊으셨나요?/…)
- [ ] AI dev banner (🚧 AI 기능은 현재 개발 중)
- [ ] biz pending copy (기업 계정 승인 대기 중 / 영업일 기준 1~2일)

---

## 5. Backend / RLS / migration work (new)

1. **Supabase:** enable Anonymous Sign-ins (JWT expiry), confirm RLS per table for anonymous
   uid (esp. `user_data`, `user_profiles`, `voc_requests`, `notice_votes`).
2. **Migrations (supabase/migrations/):**
   - (if needed) columns for anonymous/sample state or dedup keys — prefer reuse of
     existing `user_data` JSON + `api_cache` to avoid schema churn.
   - live-earnings cache keys in `api_cache` (US 6h / KR 24h TTL).
3. **New API routes:** `/api/market/technical` (signal scanner data), `/api/portfolio/news`
   (per-ticker news bundle), possibly `/api/market/earnings`. Reuse `lib/market/*`,
   `lib/news/server.ts` (already Finnhub-cached).
4. **Config/env:** `ANONYMOUS_ENABLED` guard, `OWNER_GEMINI_KEY` (already), Vercel env parity.

---

## 6. Risks & decisions

| Risk / decision | Notes |
|---|---|
| Anonymous sign-in availability | Requires Supabase plan support for Anonymous Sign-ins; verify project plan. Fallback = localStorage hybrid (§2.3). |
| RLS on anonymous users | `auth.uid()` policies already apply to anon users; audit `user_profiles` (one row per anon user → profile bloat). Consider pruning anonymous profiles after TTL expiry. |
| Admin under no-login | Real account required; keep `is_admin` server checks. |
| Pro gating vs "everything free" | Decide whether to keep Pro locks; default = keep on the 2 AI features. |
| Per-user Google AI key | Dropped in favor of server `OWNER_GEMINI_KEY` (documented deviation). |
| Live earnings via `proxy-api` | Legacy route had 503s; web can call Finnhub directly (already cached). Monitor as you port. |
| OneDrive/`-_-` path + local dev env | `.env.local` vars don't reach the Turbopack proxy bundle on this machine — export env at launch (see repo memory). |
| `index.html` must stay live | Never edit during migration; only cut over in Phase H. |
| Stale docs | PROJECT_MAP §13 wrong — fix in Phase H (or earlier). |

---

## 7. Suggested execution order (sprint-sized)

1. **Sprint 1 — Phase A:** anonymous sign-ins + middleware + RLS + guest sample + attach-email
   CTA + guest E2E. *(Everything else becomes testable without login.)*
2. **Sprint 2 — Phase B:** home widgets (flow bar → competitor brief → tech scanner →
   portfolio news) + `home` i18n.
3. **Sprint 3 — Phase C:** onboarding, profile modal, biz-pending, disclaimer, help FAB/VoC.
4. **Sprint 4 — Phase D:** auto close-price fetch, live earnings markers, news watchlist tab,
   dedup/isolation behaviors, misc small features.
5. **Sprint 5 — Phase E:** text-by-text i18n/copy parity sweep.
6. **Sprint 6 — Phase F+G:** backend parity + E2E feature tests + empty/loading/error/a11y.
7. **Sprint 7 — Phase H:** Vercel deploy, domain cutover, SMTP, decommission legacy, doc
   refresh, final parity sign-off against `index.html`.

---

## 8. Verification per phase

- `cd web && npm run build` (must pass — matches CI)
- `npm run lint` and `npx tsc --noEmit`
- `npm run e2e` (Playwright) for the relevant specs
- Manual parity check against live `index.html` (GitHub Pages) side-by-side for the features
  touched in the phase
- For the no-login phase: verify a brand-new browser profile (no cookies) reaches every page,
  keeps data across reloads, and can attach an email.
