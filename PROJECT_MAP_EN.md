# Investment Hub (RichHub) — Project Map

> **Purpose:** A single reference for quickly understanding the whole project in your next session.  
> **Last updated:** 2026-07-29  
> **Core code:** `index.html` (9,279 LOC), `supabase/functions/market-data/index.ts` (1,186 LOC)  
> **Live site:** https://jinhoo111.github.io/-_-/  
> **Backend:** Supabase (`yijkwuiqnviapztqskak`)

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
index.html                          # Entire frontend (HTML + CSS + JS)
corp_map.json                       # KR ticker (6 digits) → DART corp_code mapping
designsystem_richbuild_v2.md        # Currently applied design token reference
web/                                 # Next.js rewrite (rewrite/next branch)
supabase/
  functions/market-data/index.ts    # Single Edge Function (canonical)
  migrations/0001_*.sql ~ 0010_*.sql # DB migrations
```

---

## 4. Key document quick guide

| You want to know… | Read this first |
|-------------------|-----------------|
| Colors/fonts/tokens | `designsystem_richbuild_v2.md` |
| What has been built and what bugs were hit | `git log` |
| Rewrite progress/plan | `web/` (rewrite/next branch) |

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

*This is `PROJECT_MAP_EN.md`. Update it whenever major structure changes.*
