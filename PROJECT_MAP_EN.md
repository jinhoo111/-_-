# Investment Hub (RichHub) — Project Map

> **Purpose:** A single reference for quickly understanding the whole project in your next session.  
> **Last updated:** 2026-07-29  
> **Core code (legacy, live):** `index.html` (9,279 LOC), `supabase/functions/market-data/index.ts` (1,186 LOC)  
> **Core code (rewrite, in progress):** `web/` — Next.js + TypeScript, branch `rewrite/next` (see §13)  
> **Live site:** https://jinhoo111.github.io/-_-/  
> **Backend:** Supabase (`yijkwuiqnviapztqskak`)
>
> **Two implementations coexist on purpose.** `main`/`index.html` stays untouched and live
> while `rewrite/next`/`web/` is built phase-by-phase to full parity. Do not edit `index.html`
> as part of rewrite work — it's the reference for behavior parity. See §13.

---

## 1. What is this project?

**In one line:** A web dashboard that consolidates scattered investment information for Korean retail and corporate investors.

- **Retail users:** multi-account portfolio, real-time quotes, news, indices/FX, and investment journal in one screen.
- **Corporate users (B2B revenue core):** automated competitor disclosure, ownership-change, and regulatory monitoring with AI summaries (Pro).
- **Key differentiator:** Not just a "stock tracking app," but a **"briefing layer" that fetches and organizes external information needed for investment decisions**.

### Main feature areas

| Page | Description | Data sources |
|------|-------------|--------------|
| **Home** | Total-asset hero, competitor briefing (Pro), technical signal scanner, supply/flow summary bar | Raw + synthesized |
| **Portfolio** | Multi-account holdings, KR/US tickers, P&L, sorting, KRW/USD toggle | Finnhub, Naver, Yahoo |
| **Indices** | KOSPI/KOSDAQ/US indices, FX, VIX, crypto, 10Y–2Y yield curve | Yahoo, CoinGecko |
| **News** | Market/company news, Wall Street ratings, real-time quotes, one-click news→journal | Finnhub, Naver |
| **Research** | KR/US regulator monitoring, keyword search | RSS/official feeds |
| **Corporate Monitor** | DART (KR) + SEC (US) filings, ownership-change tracking (5% / insider) | DART, SEC EDGAR |
| **Supply & Flow** | KR institutional/foreign net-buy rankings, Form 4, 13F | Naver, SEC |
| **Journal** | Calendar-centric investment journal, ledger, weight/exercise/glucose, investment philosophy | Own DB |
| **Admin** | Member management, notices/polls, VoC, security dashboard, shared market calendar | Own DB |

---

## 2. Architecture (brief)

```
[Browser: index.html (single-file SPA, vanilla JS)]  ← GitHub Pages
        │ HTTPS
        ▼
[Supabase]
  ├─ Auth (JWT, email/password — currently email confirmation OFF)
  ├─ Postgres (user_data, user_profiles, security_events, api_cache, ...)
  └─ Edge Function: market-data (Deno, 1,186 LOC)
        ▼
[External APIs] Finnhub · Yahoo Finance · Naver · DART · SEC EDGAR · CoinGecko
```

### Most important architectural decisions

- **Build-less single-file SPA.** The entire client is one `index.html`. Chosen for simple GitHub Pages deployment; this is the biggest constraint (one parse error kills the whole app).
- **All sensitive/blocked calls go through the `market-data` Edge Function.** Routed by an `action` string (~30 actions).
- **Admin-shared API keys.** Since 2026-07-11 all users share the admin Finnhub/DART keys. Personal key input UI was removed.
- **Server-side shared cache.** Edge Function memory caches are not shared between requests, so `api_cache` Postgres table is used.

---

## 3. File/directory map

```
index.html                          # Entire legacy frontend (HTML + CSS + JS) — reference, do not edit for rewrite work
corp_map.json                       # KR ticker (6 digits) → DART corp_code mapping
designsystem_richbuild_v2.md        # Currently applied design token reference
web/                                 # Next.js rewrite (rewrite/next branch) — see §13 for internal layout
supabase/
  functions/market-data/index.ts    # Single Edge Function (canonical, legacy)
  migrations/0001_*.sql ~ 0010_*.sql # DB migrations (shared by both implementations)
```

---

## 4. Key document quick guide

| You want to know… | Read this first |
|-------------------|-----------------|
| Colors/fonts/tokens | `designsystem_richbuild_v2.md` |
| What has been built and what bugs were hit | `git log` |
| Rewrite progress/plan/structure | §13 below, and `CLAUDE.md` at the repo root |

---

## 5. How to navigate `index.html`

`index.html` is a 9,279-line single file. Learning the naming patterns makes it searchable.

### Naming patterns

| Prefix/pattern | Meaning | Examples |
|----------------|---------|----------|
| `_` (underscore) | Global helper / raw guard functions | `_restSelectRow`, `_syncToCloud`, `_sb` |
| `pf_` | localStorage key prefix | `pf_stocks`, `pf_ma`, `pf_phil` |
| `renderXxx()` | Render UI | `renderStocks()`, `renderMemos()` |
| `loadXxx()` | Load data | `loadMarketNews()`, `loadNaverIndex()` |
| `goPage(page)` | Switch top tab/page | `goPage('portfolio')` |
| `proxyApiCall()` | Call Edge Function (FH/AI) | `proxyApiCall('finnhub', ...)` |
| `_callMarketData(action, body)` | Direct `market-data` Edge call | `_callMarketData('fh-call', {...})` |

### Major CSS class patterns

| Class | Meaning |
|-------|---------|
| `.page` / `.page.on` | Tab page container / active page |
| `.nav-tab` / `.nav-tab.on` | Top navigation tabs |
| `.itab` / `.ipanel` | Inner tabs/panels |
| `.card` | Toss-style card base |
| `.btn`, `.btn-primary`, `.btn-sm`, `.btn-lg` | Button sizes |
| `.fbtn` | Filter/chip button |
| `.pill` | Badge/tag |
| `.tbl-wrap` | Fixed 10-row scrollable table |
| `.metrics` | Metric card grid |
| `.sk-*` | Loading skeleton |
| `.empty-*` | Empty states |
| `.err-box` | Error box |

---

## 6. `market-data` Edge Function actions

| Action | Purpose | Auth |
|--------|---------|------|
| `fh-call` | Finnhub proxy (quote, news, recommendation, calendar/earnings, etc.) | Required |
| `public-news` | Public market news for guests | Not required |
| `flow-kr-rank` | KR institutional/foreign net-buy rankings | Not required |
| `flow-kr-stock` | Per-stock supply/flow trend | Required |
| `flow-kr-refresh` | Ranking batch refresh (secret) | Secret |
| `sec-insider-latest` | Latest SEC Form 4 feed | Not required |
| `sec-insider-stock` | Per-ticker Form 4 | Required |
| `sec-13f` / `sec-13f-list` | Institutional holdings changes | Required |
| `sec-company` / `sec-filings` | US company lookup / filings | Required |
| `dart-*` | DART search / disclosures / holdings / proxy / price | Required |
| `yahoo-finance` | Yahoo/Naver CORS proxy | Required/partly |
| `admin-*` | Admin key management / user deletion / security | Admin |
| `keys-ready` / `biz-keys-ready` | Shared key status | Required |
| `krx-probe` | KRX API diagnostics | Admin |

### Security/cache highlights

- `authenticate()` verifies JWT signature (fail-closed). Forged tokens are logged to `security_events`.
- `api_cache` is `service_role` only. TTLs vary by data type.
- DART uses **multi-proxy race (`Promise.any`)** due to TLS/CORS issues.

---

## 7. DB migrations summary

| File | Purpose | Status |
|------|---------|--------|
| `0001_security_events.sql` | Security event log | ✅ |
| `0002_user_data_impulse_trades.sql` | Impulse-trade column | ✅ |
| `0003_voc_requests.sql` | VoC (feedback/inquiry) | ✅ |
| `0004_admin_accounts.sql` | Admin member management views | ✅ |
| `0005_last_seen.sql` | Last-seen tracking | ✅ |
| `0006_service_notice.sql` | Service notices | ✅ |
| `0007_notice_poll.sql` | Notice polls | ✅ |
| `0008_api_cache.sql` | External API shared cache | ✅ |
| `0009_user_data_schedules.sql` | Personal schedules column | ✅ |
| `0010_security_events_admin_delete.sql` | Admin security-event deletion | ✅ (apply needed) |

---

## 8. Critical constraints / lessons learned

### 8.1 Single-file SPA fragility
- One duplicate declaration or typo in `index.html` can **kill the entire app**.
- Prefix short names with scope markers (e.g., `_ownYmd` instead of `_ymd`).
- **Always verify parsing in a browser before pushing.** No compiler or CI.

### 8.2 `supabase-js` init deadlock
- Calling `_sb.from()` inside `onAuthStateChange` creates a circular wait on `initializePromise` and **freezes the app permanently**.
- On init paths, **always use raw REST helpers**: `_restSelectRow`, `_restUpsert`, `_safeGetSession`.

### 8.3 Cloud-sync migrations
- `_syncToCloud` upserts into `user_data`. Any new field needs a matching column migration.
- Without it, **all cloud saves return 400** and data lives only in localStorage.
- Recent `_syncSkipCols` guard mitigates this.

### 8.4 Edge Function caching
- **In-memory `Map` caches are not shared between requests.** Always use the `api_cache` table.
- Cache writes must be `await`ed; fire-and-forget gets truncated when the response returns.

### 8.5 DART has three blockers
- TLS interception, CORS blocking, and mandatory ticker→`corp_code` conversion.
- Solution: multi-proxy race + `corp_map.json`. Never depend on a single proxy.

### 8.6 Shared API key is a single point of failure
- If the admin deletes `shared_finnhub_key`/`dart_api_key`, quotes and filings stop for everyone.
- `get-fh-key`/`get-dart-key` are intentionally blocked so keys never reach the browser.

### 8.7 KRX integration is frozen
- KRX key was approved, but **terms §6(2) restrict use to non-commercial purposes**, conflicting with the paid tier.
- Do **not** enable KRX for commercial use.

### 8.8 GitHub Pages deploys can be flaky
- Deploy step occasionally fails for no code reason. Verify with cache-busting query: `?cb=<timestamp>`.

---

## 9. Current status and known issues

### Recent commits (main)

```
2752b4c docs: add English development history for onboarding
bb44e4a fix(indices): correct sign-inverted KR index rate, plus live QA sweep fixes
490a46d fix(indices): remove corsproxy 403 on KR indices (Naver only via server path)
93f49b4 docs: add session 12 to dev log (signup outage, personal schedules, sync guard)
1a4d7b2 feat(journal): add personal schedules (time + title) to journal calendar
```

### Major bugs fixed in 2026-07-28 QA sweep

- **Domestic index change rates were sign-flipped** (`loadNaverIndex`): Naver already returns signed `fluctuationsRatio`, but the code reapplied direction, flipping negatives to positives. Only visible on down days. Fixed.
- **New users started with no API keys**: `_restoreApiKeyState()` was only called inside the `onboarding_done` branch. Fixed.
- **Journal earnings markers dead**: legacy `proxy-api` route + missing `calendar/earnings` whitelist. Moved to `proxyApiCall` and whitelisted.
- **Holdings table grew unbounded**: now fixed 10 rows with pinned header and internal scroll.

### Still open

| Issue | Status | Note |
|-------|--------|------|
| Custom SMTP + restore email confirmation | **Urgent** | Currently Confirm email OFF → anyone can register, password reset emails broken |
| Clean up `qa-*` test accounts | Pending | Search Authentication → Users |
| Korean regulatory feed (Google News RSS) 503 | **Open** | `proxy-api rss-proxy` 503; FTC/Fed direct RSS works |
| Yahoo batch quote 401 | **Open** | `v7/finance/quote` 401; `v8/chart` fallback works |
| Investigate 46 `fh-call` auth rejections | Pending | Clustered at 2026-07-22 15:20 |
| Glucose tracking Phase 2 | Planned | Charts, HbA1c |
| Empty/Loading/Error + accessibility QA | Not started | |
| Pro payment integration | Not started | Currently proxied by "approved business account" |
| KRX indicators | **Frozen** | License conflict |

---

## 10. Recommended routine when starting a new session

1. Check latest state: `git status`, `git log --oneline -10`.
2. Read this file first.
3. Identify the change area:
   - Frontend only → `index.html`.
   - Server/API → `supabase/functions/market-data/index.ts` + migrations if needed.
   - Planning/docs → relevant `.md`.
4. Test: open `index.html` in a browser to verify parsing. For live GitHub Pages, use `?cb=<timestamp>`.
5. To deploy Edge Function changes:
   ```bash
   npx supabase functions deploy market-data --project-ref yijkwuiqnviapztqskak
   ```
6. To apply DB migrations: paste into Supabase SQL Editor.

---

## 11. Glossary

| Term | Meaning |
|------|---------|
| **DART** | Korean FSS electronic disclosure system |
| **corp_code** | DART company unique code (separate from stock ticker) |
| **FH / Finnhub** | US stock quotes/news API |
| **Form 4** | SEC insider trading filing |
| **13F** | US institutional quarterly holdings filing |
| **CUSIP** | US security identifier |
| **CIK** | SEC company identifier |
| **RLS** | Postgres Row Level Security |
| **Pro** | Paid/approved business account (currently `_isPro` proxy) |
| **VoC** | Voice of Customer (feedback/inquiry) |
| **NSM** | North Star Metric (weekly active portfolio updates) |

---

## 12. External links / environment

| Item | Value |
|------|-------|
| GitHub Pages | https://jinhoo111.github.io/-_-/ |
| Supabase Project | `yijkwuiqnviapztqskak` |
| Edge Function | `https://yijkwuiqnviapztqskak.supabase.co/functions/v1/market-data` |
| Legacy Edge Function | `.../functions/v1/proxy-api` (some GoogleAI paths remain) |

---

## 13. `web/` — Next.js rewrite (branch `rewrite/next`)

Full rewrite plan and phase order: see the plan doc referenced from `CLAUDE.md` at the repo
root (or ask for it — it isn't checked in as a committed file). Below is the as-built map of
what exists today, kept in sync with actual code rather than the plan's intent.

### Status

**Feature-complete for all seven app sections plus the full admin console.** Verified
2026-08-07: auth (Phase 0), Portfolio, Indices, Journal, News, Research, Flow, Monitor, and
Security admin are all built on `rewrite/next` (git log: Phases 1–6 + Playwright E2E). The
legacy Home dashboard widgets (flow bar, competitor brief, tech signal scanner, portfolio
news) were restored 2026-08-07 on `/portfolio`; the news real-time-quotes watchlist tab,
settings page, onboarding/profile, biz-pending overlay, help FAB + VoC form, dismissible
disclaimer banner, auto close-price fetch, and live US earnings markers were added the same
day. Cross-cutting EN/KO language toggle is done.

Remaining parity gaps: guest sample-data mode, KR live-earnings markers, notification/
dedup polish, `data_owner` isolation, deeper E2E interaction coverage, and cutover (Vercel
deploy + decommission legacy) — see `MIGRATION_PLAN.md`.

### Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4, TanStack React Query, `@supabase/ssr`.
No i18n library (custom Context, see below), no component library (hand-built primitives on
design tokens from `designsystem_richbuild_v2.md`).

### Directory map (as built)

```
web/src/
  app/
    layout.tsx                    # root server layout — static lang="ko", wraps <Providers>
    providers.tsx                 # "use client" — LanguageProvider > ThemeProvider > QueryClientProvider > ToastProvider
    page.tsx                      # "/" — redirects to /portfolio or /login based on session
    (auth)/layout.tsx             # server component — auth card shell + LanguageToggle island
    (auth)/login/page.tsx
    (auth)/signup/page.tsx        # form + email-verify views, resend cooldown
    (auth)/forgot-password/page.tsx
    (auth)/reset-password/page.tsx
    (app)/layout.tsx              # server component — authed shell, renders <AppNav/>
    (app)/portfolio/page.tsx      # holdings, P&L, add/edit/hide, live quotes
    api/market/quote/route.ts     # GET — Naver (KR) / Yahoo v8 (US, w/ pre/post) quote proxy
    auth/callback/route.ts        # Supabase email-link callback (signup verify, password reset)
    auth/signout/route.ts
  components/
    layout/AppNav.tsx             # "use client" island — nav links + LanguageToggle + logout, imported into (app)/layout.tsx
    ui/                           # Button, Card, Input, EmptyState, Skeleton, Toast (ToastProvider/useToast), LanguageToggle
  lib/
    supabase/{browser,server,admin,middleware}.ts   # @supabase/ssr client factories
    auth/errors.ts                 # authErrText() → i18n message KEY (not text), authErrIsRateLimit, passwordStrength
    auth/useResendCooldown.ts
    portfolio/constants.ts         # ACCOUNT_LIST (Korean broker names, DATA), STATUS_LABEL_KEY/STYLE_LABEL_KEY/STYLE_ABBR_KEY, KR_TICKER_MAP/US_TICKER_MAP, resolveTickerFromName()
    queries/useUserData.ts         # useUserData() + useUpdateUserData() — debounced (1.2s) upsert into user_data, mirrors legacy _syncToCloud
    queries/useQuotes.ts           # React Query hook over /api/market/quote
    types/userData.ts              # UserData, Stock, EMPTY_USER_DATA, isKrTicker()
    i18n/messages.ts               # Lang, messages.{ko,en}, t(lang, key, params?)
    i18n/LanguageProvider.tsx      # "use client" — Context + localStorage("rh_lang") + useLang()/useT()
  proxy.ts                         # Next "proxy" export (middleware) — session refresh via updateSession(), matcher excludes _next/static/image + image exts
```

### EN/KO language toggle (cross-cutting, done)

- **Pattern:** lightweight custom React Context (`lib/i18n/LanguageProvider.tsx`), not
  `next-intl` — mirrors the existing `ToastProvider` and `next-themes` (`storageKey="rh_theme"`)
  patterns. No URL locale segments.
- **Default:** Korean, but auto-detects `navigator.language` on first mount (English browser →
  starts in English). Toggle choice persists to `localStorage` under `rh_lang` and overrides
  auto-detection on every later visit.
- **Up/down colors stay Korean convention (red=up/blue=down) in both languages** — never
  flipped by language.
- **Proper nouns stay Korean in both languages:** broker names in `ACCOUNT_LIST`, and the
  `KR_TICKER_MAP`/`US_TICKER_MAP` lookup keys in `lib/portfolio/constants.ts` — these are data,
  not UI copy. The stored/lookup value `"기타"` (Other) is never translated; only its
  *displayed* label resolves through `t("portfolio.account.other")`.
- **Locale-free API contract:** `/api/market/quote` returns only a market `state` code
  (`PRE`/`POST`/`REGULAR`/`CLOSED`) — no localized label. The client resolves the label via
  `MARKET_STATE_KEY` + `t()` in `portfolio/page.tsx`. Keep future server routes locale-agnostic
  the same way.
- **Message-key indirection:** plain modules that aren't client components (`lib/auth/errors.ts`,
  `lib/portfolio/constants.ts`) return/hold **message keys** (e.g. `"authError.invalidCredentials"`,
  `"portfolio.status.buy"`), never literal strings — only the UI layer (which has `useT()` in
  scope) calls `t(key)`.
- To add a new UI string: add the key to **both** `ko` and `en` in `lib/i18n/messages.ts`, then
  call `t("your.key")` (or `t("your.key", { param })` for `{param}`-style interpolation) from a
  client component. `useT()`'s `t` takes a plain `string`, not a strict key union — intentional,
  to avoid friction with dynamically-built keys like `` `auth.signup.strength.${strength}` ``.

### Commands (run from `web/`)

```bash
npm run dev      # localhost:3000
npm run build    # matches CI — must pass before considering a change done
npm run lint     # eslint (react-hooks v7 rules included — see set-state-in-effect note below)
npx tsc --noEmit
```

CI (`.github/workflows/web-ci.yml`) runs `tsc --noEmit`, `lint`, and `build` (with
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` secrets) on every push/PR touching
`web/**`, on both `main` and `rewrite/next`.

### Known lint gotcha

`eslint-plugin-react-hooks` v7's `set-state-in-effect` rule flags `setState` calls inside
`useEffect` bodies. `LanguageProvider.tsx`'s mount effect (reading `localStorage` to hydrate
`lang` client-side, since SSR must start from a static `"ko"` default) is an intentional,
correct use of this pattern — disabled inline with a comment explaining why, not worked around
by restructuring.

### Automated QA (Playwright, headless)

`web/e2e/` holds a Playwright E2E suite that drives a real headless Chromium browser
against a running instance of the app — no auth mocking or bypass, it logs in through
the actual `/login` form using real Supabase test accounts.

```text
web/
  playwright.config.ts     # webServer auto-starts `npm run dev` on port 3100 unless
                            # E2E_BASE_URL is set (e.g. to point at a Vercel preview URL)
  e2e/
    auth.setup.ts          # "setup" project — logs in as the test user / admin user via
                            # the real login form, saves Playwright storageState to
                            # e2e/.auth/{user,admin}.json for reuse by other specs
    public/*.spec.ts        # "public" project — no auth: login/signup/forgot-password
                            # rendering, i18n toggle, unauthenticated route-redirect checks
    authed/*.spec.ts        # "authenticated" project — reuses user.json storageState
    admin/*.spec.ts         # "admin" project — reuses admin.json storageState
```

**Setup (one-time, per developer):** create a normal Supabase user and (optionally) a
second user with `user_profiles.is_admin = true`, then fill in `web/.env.local`:
`E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`, `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`. Admin-only
specs are skipped automatically (not failed) when the admin credentials are blank.
`E2E_BASE_URL` is optional — omit it to let Playwright manage its own dev server.

**Commands (from `web/`):**

```bash
npm run e2e          # headless run, all projects
npm run e2e:ui       # Playwright's interactive UI mode
npm run e2e:report   # open the last HTML report
```

**CI:** a separate `e2e` job in `.github/workflows/web-ci.yml` runs after the main `ci`
job, but only when the repo variable `E2E_ENABLED` is `"true"` (off by default — it
needs real `E2E_TEST_*`/`E2E_ADMIN_*` secrets configured first). Uploads the HTML report
as an artifact on every run, pass or fail.

### Not yet started / remaining (see MIGRATION_PLAN.md for ordered phases)

- **Cutover:** Vercel deploy, domain repoint, SMTP, decommissioning GitHub Pages/Edge Functions.
- **No-login "free" switch:** Supabase dashboard Anonymous Sign-ins toggle + `ALLOW_ANON=true`
  (code is in place and guarded; see `supabase/ANONYMOUS_SETUP.md`).
- **Small parity items:** guest sample-data mode, KR live-earnings markers, notification/dedup
  polish, `data_owner` isolation, per-feature E2E interaction tests.

---

*This is `PROJECT_MAP_EN.md`. Update it whenever major structure changes.*
