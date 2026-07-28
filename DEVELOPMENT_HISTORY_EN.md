# InvestmentHub (RichHub) — Development History

> English engineering summary of the Git history for onboarding.
> Repository: `jinhoo111/-_-` · Live: https://jinhoo111.github.io/-_-/
> Period covered: **2026-06-16 → 2026-07-23** · **171 commits** on `main`.

---

## 1. What the product is

A web service for **multi-account portfolio management + market news/disclosure monitoring**, aimed at Korean retail investors and (in a business tier) at companies tracking competitors.

Main feature areas:

| Area | Description |
|---|---|
| **Home** | Total-asset hero block, competitor briefing card (Pro), technical signal scanner, supply/flow summary bar |
| **Portfolio** | Multi-account holdings, KR + US tickers, P&L, sorting, KRW/USD toggle |
| **Indices** | KOSPI/KOSDAQ/US indices, FX rates, 10Y–2Y yield-curve recession indicator |
| **News** | Per-holding news feeds (Finnhub / Naver), one-click "news → journal entry" |
| **Research** | Regulator monitoring (KR/US financial authorities), keyword search, disclosure radar |
| **Corporate Monitor** | DART (KR) + SEC EDGAR (US) filings for tracked companies, ownership-change tracking (5% rule / insider) |
| **Supply & Flow** | KR institutional/foreign net-buy rankings, US insider trades (Form 4), 13F institutional holdings |
| **Journal** | Calendar-centric investment journal, investment philosophy, personal ledger, weight/exercise/glucose tracking, earnings-call markers, personal schedules |
| **Admin** | Member management, service notices with polls, VoC inbox, security dashboard, shared market calendar |

---

## 2. Tech stack & architecture

```
┌────────────────────────────────────────────────┐
│  Frontend: single-file  index.html (~9,100 LOC)│
│  Vanilla JS, no build step, no framework       │
│  Hosted on GitHub Pages                        │
└───────────────┬────────────────────────────────┘
                │ HTTPS
┌───────────────▼────────────────────────────────┐
│  Supabase                                      │
│   • Auth (email/password, email confirmation)  │
│   • Postgres + RLS (user_data, profiles, …)    │
│   • Edge Function: market-data (Deno, ~1.2k LOC)│
└───────────────┬────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────┐
│  External APIs                                 │
│  Finnhub · Yahoo Finance · Naver · DART (KR)   │
│  SEC EDGAR · KRX (on hold) · Gemini (removed)  │
└────────────────────────────────────────────────┘
```

**Key architectural decisions**

- **No build tooling.** The entire client is one `index.html`. This was a deliberate choice for deployment simplicity on GitHub Pages, and it is the single biggest constraint on the codebase (see §6).
- **All secret-bearing / CORS-blocked / TLS-broken upstream calls go through one Edge Function** (`supabase/functions/market-data/index.ts`), routed by an `action` string. It handles ~30 actions: `fh-call`, `flow-kr-rank`, `sec-13f`, `sec-filings`, `dart-corp-search`, `dart-disclosures`, admin key management, etc.
- **Server-side shared cache** in Postgres (`api_cache` table) rather than in-memory — Edge Function memory is not shared between requests.
- **Shared API keys.** As of 2026-07-11 all users transparently use the administrator's DART/Finnhub keys; per-user key entry was removed. `get-fh-key` / `get-dart-key` are deliberately blocked so keys never reach the browser.
- **Offline/guest mode.** The app works without login using localStorage; cloud sync layers on top for logged-in users.

**Database migrations** (`supabase/migrations/`)

| File | Purpose |
|---|---|
| `0001_security_events.sql` | Security event log table |
| `0002_user_data_impulse_trades.sql` | `impulse_trades` column |
| `0003_voc_requests.sql` | VoC (feature request / inquiry) inbox |
| `0004_admin_accounts.sql` | Admin member-management views |
| `0005_last_seen.sql` | Last-login tracking |
| `0006_service_notice.sql` | Service notice (jsonb) + `get_service_notice()` RPC |
| `0007_notice_poll.sql` | Multiple-choice poll on notices |
| `0008_api_cache.sql` | Server-side shared API cache |
| `0009_user_data_schedules.sql` | Personal schedules array |

---

## 3. Repository layout

```
index.html                     # the entire frontend
corp_map.json                  # KR ticker → DART corp_code mapping
supabase/
  functions/market-data/       # the single Edge Function
  migrations/                  # 0001–0009 SQL
개발내역.md                     # Korean dev log (session-by-session)
기획_*.md                       # Korean planning docs per feature
designsystem_*.md / bx_richhub.md  # design system docs
ss_*.png                       # UI screenshots
```

---

## 4. Development timeline

The project ran in **12 working sessions**. Below is what each accomplished.

### Session 1 — Foundation (2026-06-16)
Initial `index.html`, Supabase connection, anon key wiring. Immediately followed by a **design-system pass**: all colors/fonts tokenized into CSS custom properties, accessibility hooks and dark-mode stubs added. This tokenization decision paid off a month later during the RichHub rebrand (§ Session 10).

### Session 2 — Korean market support (2026-06-17 → 06-18)
- Auto-detection of KR vs US market from ticker shape (6 digits → KRX).
- Korean ticker search via Naver autocomplete API, proxied through a Supabase Edge Function (CORS).
- Regulator-monitoring feature built out and refined.
- Refresh no longer loses the current tab.

### Session 3 — Accounts & sync (2026-06-18)
- Account-based cross-device sync.
- Guest mode: full app usage without login, backed by localStorage.
- Fixed onboarding checkbox double-toggle; stopped new users from uploading sample data to the cloud on first login.

### Session 4–6 — Security, UX, and the AI experiment (2026-06-19 → 06-20)
- **Phase 1 (security/UX):** XSS holes removed, page-state restoration improved.
- **Phase 2 (UX):** keyboard navigation in autocomplete, one-click news → journal, mobile layout.
- **Phase 3 (AI):** AI news briefing, AI regulatory summaries, weekly/monthly investment reports via Gemini.
- **AI features were then reverted** (`332344c`) — cost/quality did not justify them at that stage. AI later returns in a gated Pro form (Session 9).
- Modal UX polish (click-outside-to-close), archive tag filter, **Investment Philosophy** tab (two-column "rules to keep" / "never do"), quick-add philosophy from an active journal entry.
- Bug sweep: XSS, news→journal, archive dates, uncaught sync errors.

### Session 7 — KRX experiment (2026-06-21 → 06-25)
- Built an institutional/options page against KRX data, then **removed it** three days later (`a23f7ca`) — see §6 on the KRX licensing issue.
- Archive gained list view + calendar view; journal UX reworked.
- Business-tier features introduced, plus a pre-API-key preview mode.

### Session 8 — The API plumbing war (2026-06-25 → 06-30)
The hardest stretch of the project. Roughly 20 commits fighting third-party API access:
- Finnhub moved off the opaque `proxy-api` onto the owned `market-data` function.
- CORS proxies wholesale replaced; three separate key-persistence bugs fixed.
- **DART required three simultaneous workarounds**: TLS interception, CORS blocking, and a mandatory ticker→`corp_code` conversion. Solved with a multi-proxy race (`Promise.any`) plus a prebuilt `corp_map.json`.
- **`supabase-js` deadlock** discovered and resolved: calling `_sb.from()` inside an `onAuthStateChange` callback waits on `initializePromise`, which never resolves — freezing the whole app. Worked around with raw REST helpers on the init path.
- KOSDAQ price accuracy fixed (the DART price route hardcoded `.KS`); Wall Street ratings restored.
- Toss-style design system + mobile bottom tab bar.

### Session 9 — Calendar, security hardening, business tier (2026-07-01 → 07-02)
- Earnings-call markers on the journal calendar — US (Stage 1) then KR (Stage 2).
- Journal entries creatable directly from any calendar date via an inline form.
- **Security Phase 0:** JWT signature verification, CORS whitelist, security event schema.
- **Security Phase 1:** security event logging + admin security dashboard.
- Signup email confirmation 404 fixed (`emailRedirectTo` + Supabase redirect allow-list).
- **Cross-account localStorage leak fixed** (`032a169`) — logging out did not clear local state, so switching accounts in the same browser leaked the previous user's watchlist and portfolio. Guarded with a `data_owner` check.
- **Disclosure Radar:** automatic strategic-signal classification and early warning on competitor DART filings.
- Freemium gating introduced: signals free, AI interpretation and automation gated to Pro.
- Journal pivoted from "active entry" to calendar-centric; personal ledger (income/expense), weight tracking, floating help widget, report sub-tabs with SVG line charts.

### Session 10 — RichHub rebrand (2026-07-03 → 07-09)
A full dark-first visual redesign, executed in phases. **The strategy was not to rewrite classNames but to remap the values of the existing `--color-*` tokens** — possible only because of the Session 1 tokenization.

- P1–P4 (07-04): type scale raised to 12–24px, unified radii, button size system (sm/md/lg), responsive metric grid. One attempt to swap emoji for SVG line icons was reverted.
- Phase 2–3 (07-08): design tokens injected, dark theme via structural token remap, component library, numeric alignment.
- Phase 4 (07-08/09): Korean convention for up/down colors (red = up), portfolio table as RichHub cards, home total-asset hero, news list hierarchy.
- Phase 5 (07-09): journal "Day One" recording mood with teal accent, immersive reflection composer.
- Phase 6-1 (07-09): dark/light theme toggle, pre-release QA, home two-column layout (competitor briefing | technical scanner).
- **States & a11y (07-09/10):** loading skeleton system, empty states with icon+CTA, per-card error + unified retry, icon-button labels and keyboard focus rings.

Interleaved feature work: technical signal scanner with RSI+MFI grading and leverage thresholds, exercise/weight tracking, VoC collection and admin triage, member management with cumulative stats and last-seen, service notices as a global banner.

### Session 11 — Supply & Flow, API consolidation (2026-07-11)
- **Personal/business API keys unified** — every user now runs on the shared admin key; key-entry UI removed. Guest preview added as a signup funnel.
- **Server-side shared cache** for quotes/news/ratings, decoupling the Finnhub quota from user count.
- **Supply & Flow page**, three phases in one day:
  - Phase 1: KR institutional/foreign net-buy rankings, computed directly from Naver across the top-300 by market cap, public to guests.
  - Phase 2: US insider trades (SEC Form 4).
  - Phase 3: 13F institutional holdings — quarterly position changes of well-known investors.
- Corporate Monitor Phase 4: US coverage via SEC + Finnhub, 8-K item codes localized.
- Home supply summary bar + alerts when a held stock sees consecutive institutional net selling, wired into the journal.
- Service notices gained multiple-choice polls (one vote per user).

### Session 12 — Compliance, health tracking, auth repair (2026-07-13 → 07-23)
- Retry on transient cloud-save rejection; fixed double HTML-entity escaping in SEC raw text.
- **Global investment disclaimer** — dismissible top banner after login plus a permanent footer notice. Corrected misleading "real-time" labels: Yahoo/Naver/FX relabeled as *delayed*; Finnhub and crypto genuinely real-time, so left as-is.
- **Glucose tracking Phase 1** in the journal calendar (one entry/day, timing label, reference range, medical disclaimer), stored nested under `health.glucose` so no migration was needed.
- Regulator link chips refactored from repeated inline styles into a `.reg-link` class.
- **Signup/login error handling repaired** and raw English provider errors stopped leaking to users.
- **Personal schedules** (time + title) on the journal calendar — stored in a *separate array* from `memoArchive` so they cannot pollute investment statistics.
- KR index fetching: removed the `corsproxy` path that was returning 403; Naver is now only reached server-side.

### Session 13 — Live QA sweep, data-correctness fixes, fixed-height lists (2026-07-28 → 07-29)

A full end-to-end pass over the deployed site (signup → login → every page) driven through a
real browser. Findings and the fixes that came out of it:

**🔴 Domestic index change rates were sign-flipped — down days rendered as rallies.**
The single most serious defect found. Naver's index API returns `fluctuationsRatio` *with its
sign* (`"-10.84"`) alongside a separate direction code, but `loadNaverIndex` re-applied the
direction (`rising ? ratio : -ratio`), negating an already-negative number. On 2026-07-28 the
page showed **KOSPI ▲10.84%** in the "up" colour while the index had actually **fallen 10.84%**
(Yahoo's independent previousClose confirms it, and Samsung −13.39% / SK Hynix −17.16% the same
day made the contradiction obvious).

Why it survived three months and a previous investigation: **on up days the bug is invisible.**
`ratio` is positive and `rising` is true, so the expression returns the correct value. It only
manifests on down days, and the 2026-07-23 verification happened to run on an up day and
concluded the code was correct. If you touch this area, test on a falling market.

**🟠 A brand-new user's whole first session ran without API keys.**
`_restoreApiKeyState()` — which asks the server whether the shared Finnhub/DART keys are
available — was called only inside the `onboarding_done === true` branch. A user who had just
signed up therefore spent the entire session with `FKEY=''` and `dartKeyStored=false`, so
realtime quotes and analyst ratings showed "log in to view" *while logged in*, holdings news
showed "Finnhub key required", and the corporate monitor showed sample cards. Only a manual
reload fixed it. The server was healthy throughout (`keys-ready` → `{dart:true,finnhub:true}`).
The restore now starts outside the branch on both entry paths, and again after onboarding
completes.

**🟠 Journal earnings markers were dead.** One call site still used the legacy `proxy-api`
Finnhub route, which returns 401 `fh_auth` for every path since the shared-key migration. Moved
to `proxyApiCall` (→ `market-data` `fh-call`), and `calendar/earnings` had to be added to the
Edge whitelist as well, since it was missing there too — both ends were broken independently.

**Fixed-height, scrollable lists.** The holdings table grew without bound, so every stock added
pushed the ticker search, FX note and news feed further down the page. It now shows exactly ten
rows with a pinned header and scrolls internally; everything below it stays put no matter how
many holdings exist. The row height is *measured* after render rather than assumed in CSS,
because rows vary with content and theme. The same treatment was applied to the security event
log via a reusable `.tbl-scroll` class.

**Insider-trade date sorting.** The Form 4 list was amount-ordered only, which answers "what was
big" but not "what happened recently". Added 금액순 / 최신순 ↓ / 오래된순 ↑.

**Security event deletion (admin).** QA and test traffic was inflating the dashboard counters,
making real incidents impossible to spot. Added per-row delete and a double-confirmed "clear
all", backed by migration `0010` which grants admins a DELETE policy. Writes remain
`service_role`-only, so events still cannot be forged — only removed by an admin.

**Admin-only gating on the security page.** Non-admins were shown the shared market-events list
with live delete buttons. RLS correctly rejected the writes (403/42501), so nothing was ever
exposed or modifiable, but the UI was offering an action that could only fail.

**Auth error messages.** `_authErrText` fell through to the raw provider string, so an invalid
email format surfaced as "Unable to validate email address: invalid format" to Korean users. It
now maps that case and, importantly, never falls through to English again — unmapped errors show
a generic Korean message and log the original to the console.

**Still open after this pass** (see §7): email confirmation is disabled server-side, so signup
issues a session immediately and any address can be registered; Google News RSS returns 503
through the Edge proxy, leaving the Korean regulatory feed empty; Yahoo's batch quote endpoint
401s on every page load and only survives via fallback.

---

## 5. Full commit log (English)

Chronological, oldest first.

### 2026-06-16 — Session 1
| Hash | Message |
|---|---|
| `94b6fd0` | Create index.html |
| `bfa9f8e` | Connect Supabase |
| `c23d65a` | Add anon key |
| `011d7c5` | Design system: tokenize all colors/fonts, add accessibility + dark mode stubs |
| `0336ba3` | docs: add 개발내역.md with full session history |

### 2026-06-17 — Session 2
| Hash | Message |
|---|---|
| `20c99ad` | fix: auto-detect KR/US market and auto-correct wrong market selection |
| `b81c771` | Optimize Korean market news loading |
| `26c64a6` | Auto-recognize 6-digit numeric tickers as Korean market |
| `6ba9c65` | feat: Korean stock search — proxy Naver AC API through a Supabase Edge Function |
| `274ad8d` | Distinguish US/KR market automatically, in Korean |

### 2026-06-18 — Sessions 2–3
| Hash | Message |
|---|---|
| `2a8074c` | Enhance research/regulatory monitoring |
| `17bb123` | chore: add 메모용.txt to gitignore |
| `0dd7478` | Reissue token |
| `f44cbdc` | Improve data loading |
| `fcb404e` | Improve regulatory monitoring |
| `52a775d` | Update index.html |
| `cdbe0e9` | Fix refresh bug (stay on current page after reload) |
| `3fe277a` | Move regulatory-monitoring agency site section |
| `fa45610` | feat: account-based cross-device sync |
| `840f3a1` | fix: onboarding service-purpose checkbox double-toggle bug |
| `75f854f` | fix: prevent sample data upload to cloud on a new user's first login |
| `4d2125d` | feat: allow guest mode — use the app with local data, no login |

### 2026-06-19 → 06-20 — Sessions 4–6
| Hash | Message |
|---|---|
| `d2a2f31` | security/ux: Phase 1 — remove XSS vulnerabilities, improve page-state restoration |
| `569802b` | ux: Phase 2 — autocomplete keyboard navigation, one-click news→journal, mobile layout |
| `84e4b03` | feat: Phase 3 — AI news briefing · AI regulatory summaries · weekly/monthly investment reports |
| `f0375e5` | docs: update 개발내역.md for sessions 4–6 (full Phase 1–3 record) |
| `f0e14c5` | fix: swap Gemini model, implement per-account API key auto-save |
| `f306b00` | fix: Korean stock news CORS error, change Gemini model |
| `2a05571` | fix: Finnhub call timing — load portfolio news only after session check |
| `332344c` | revert: remove AI features (weekly/monthly reports, AI regulatory summaries, AI news briefing labels) |
| `5fcf437` | fix: news tab API error, news not refreshing after login, guest error messages |
| `00cbc7b` | feat: close login/signup modal on outside click |
| `b71596e` | feat: close profile-settings modal on outside click |
| `41109b6` | feat: close onboarding modal on outside click |
| `fb5c359` | refactor: journal layout — pin composer to top, remove list height cap |
| `949cb70` | feat: add archive tag filter |
| `58a0735` | feat: add Investment Philosophy tab (two columns: rules to keep / never do) |
| `6469422` | feat: register investment philosophy directly from an active journal entry |
| `c49f112` | docs: write up sessions 7–8 |
| `a81bd35` | fix: four bugs (XSS, news→journal, archive date, uncaught sync error) |

### 2026-06-21 → 06-25 — Session 7
| Hash | Message |
|---|---|
| `b8816c9` | feat: add institutional/options page — KRX integration for Korean investors |
| `1300ee4` | Delete index.ts |
| `2225df1` | Verify Korean institutional/options trading volume |
| `a23f7ca` | feat: remove institutional/options page, add stock sorting |
| `72ec094` | feat: add archive list view + calendar view |
| `f26e226` | refactor: three journal UX improvements |
| `f9345b9` | Add business-only features |
| `a7ff011` | Pre-API preview |
| `7fd64c9` | fix: API key error |
| `aade2d1` | fix: API error |
| `b489d00` | Optimize API usage |
| `fe00a14` | Update index.html |
| `e1804e1` | Update index.html |

### 2026-06-25 → 06-30 — Session 8
| Hash | Message |
|---|---|
| `218fdea` | fix: fully migrate Finnhub from proxy-api (black box) to market-data |
| `6196882` | fix: add proxyApiCall Finnhub proxy-api fallback (compatibility with previously stored keys) |
| `b08e63a` | fix: replace CORS proxies wholesale + three Finnhub/DART key-persistence bugs |
| `0630a71` | fix: simplify yahoo-finance User-Agent (deployment parse error) |
| `9a5de17` | fix: portfolio news auto-refresh + better DART key registration error handling |
| `1e66902` | fix: DART TLS workaround + switch Finnhub to direct browser calls |
| `596038f` | fix: two root causes of DART company lookup failure (CORS + missing ticker-code conversion) |
| `690c386` | fix: overhaul corporate-monitor holdings/changes/price data errors |
| `bb7b654` | fix: drop single-proxy dependency (allorigins) for DART → multi-proxy race |
| `651bf44` | design: corporate-monitor card readability + holdings as-of date / ownership % display |
| `6b92724` | design: Toss-style design system + mobile bottom tab bar (Phase 1-2) |
| `4900076` | design: auth modal null-guard + design system doc refresh (Phase 3-4) |
| `5d68a2a` | fix: business users' Finnhub news/quotes not loading (fall back to personal key when admin key unset) |
| `6198a87` | fix: resolve supabase-js deadlock (restores corporate monitor/admin) + full admin tabs + dual profile load |
| `fb0ac92` | fix+feat: root-cause fix for supabase-js deadlock + signup UX + business onboarding + monitor memo auto-save to journal |
| `a77e648` | fix: Korean quote accuracy (KOSDAQ) + missing Wall Street ratings |

### 2026-07-01 → 07-02 — Session 9
| Hash | Message |
|---|---|
| `62ed39c` | feat: show holdings' earnings calls on the journal calendar (Stage 1: US) |
| `7672521` | feat: earnings calls for Korean stocks on the journal calendar (Stage 2: KR) |
| `105f069` | docs: add session 9 (deadlock fix / signup UX / quote+news maintenance / calendar earnings) |
| `e038afd` | feat: add journal entries directly from the calendar (click any date, inline composer) |
| `9da2570` | test |
| `c007b18` | fix: signup email confirmation link 404 (emailRedirectTo) |
| `d97e633` | feat(security): Phase 0 — JWT signature verification · CORS whitelist · event log |
| `86139cc` | fix: harden auth email resend (remove silent failures + rate-limit notice + cooldown) |
| `939ef6e` | feat(security): Phase 1 — security event logging + admin security dashboard |
| `bba943c` | fix(security): hide admin-only UI (security tab) immediately on logout |
| `8e627aa` | feat(biz): hide Finnhub/DART key inputs for approved business accounts, auto-connect shared key |
| `032a169` | fix(account): block cross-account localStorage data leak (data_owner guard) |
| `5bab8c5` | feat(monitor): Disclosure Radar — auto-classify strategic signals in competitor DART filings, early warning |
| `59e068d` | feat(bm): home competitor briefing card (Pro) + freemium gating + total value KRW/USD toggle |
| `7ffe16d` | feat(research): regulatory monitoring keyword search (hybrid) + v1.1 backlog doc |
| `3f9967e` | feat(journal): drop active-entry model → calendar-centric + personal ledger (income/expense) in calendar |
| `50ac8aa` | feat: calendar entry editing · expanded earnings info · admin shared market calendar · AI-in-development notice |
| `56e95e9` | feat: weight tracking (target + change rate) + floating help widget |
| `d2b3895` | feat: report sub-tabs (ledger, weight SVG line chart) + faster refresh |
| `f6f3b78` | docs: 2026-07-02 dev log (today's work + next steps) |
| `2685c7f` | Change help widget colors |

### 2026-07-03 → 07-09 — Session 10 (RichHub redesign)
| Hash | Message |
|---|---|
| `99764dd` | Testing and minor fixes |
| `3180adc` | chore: trigger GitHub Pages redeploy (empty commit) |
| `5da6fe2` | Create IR service plan doc |
| `608fa4e` | chore: remove 6 dead functions + add user_data.impulse_trades migration |
| `10f7026` | chore: force Pages redeploy (site recovery after source reset) |
| `a44c988` | fix: radar "view all" loading failure + Korean-convention P&L colors + exclude security items from help |
| `41720a2` | chore: force Pages redeploy (recover unapplied a44c988) |
| `9184fbc` | feat: technical signal scanner (Phase 1-A) — card at top of portfolio management |
| `c1918b0` | fix: show minus sign on total loss (previously losses rendered unsigned) |
| `8bd3122` | feat: add calculation basis/measured values to the scanner + stronger "not a recommendation" wording |
| `2b96496` | feat: journal report — weekly budget allocation (user-set) + weekly actual weight input |
| `38ddf1c` | chore: force Pages redeploy (recover unapplied 2b96496) |
| `d000529` | design(P1): type scale up to 12–24px + unified radii (control10/card14/pill) + 2× component gaps |
| `d3a608f` | chore: trigger Pages redeploy (P1 design tokens) |
| `46148a0` | design(P2): button size system (sm/md/lg) + unified filter/tag heights, radii, larger padding |
| `01f30e6` | design(P4): responsive metric grid (no label clipping) + calendar weight UX |
| `86d4eaa` | chore: trigger Pages redeploy (P4) |
| `5875a50` | chore: retry Pages redeploy (intermittent deploy-step failure) |
| `7dac418` | design(P3): emoji → SVG line icons (UI skeleton) + gear as cog |
| `f84cea9` | Revert "design(P3): emoji → SVG line icons" |
| `100fd25` | feat(indices): 10Y–2Y yield-curve recession indicator section — US market |
| `467d112` | feat(calendar): add IPO/listing event type + SK Hynix Nasdaq listing (7/10) |
| `2e4373d` | feat(memo): polish archive as a calendar list view |
| `abfb7ac` | feat(monitor): ownership-change section on competitor cards (5% rule / executives) + radar integration |
| `89eb514` | fix(monitor): remove duplicate `_ymd` declaration in ownership changes (renamed to `_ownYmd`) |
| `3395423` | merge: apply archive list view (plan A) |
| `14ab3ae` | perf(monitor): compute ownership-change summary chip counts once at load and cache |
| `07df52d` | feat(voc): remove "replay onboarding", collect feature requests & inquiries (VoC) |
| `e402869` | feat(memo): add exercise tracking (did/didn't) to the journal calendar |
| `4beba08` | feat(admin): search + creation-order sort for shared market calendar |
| `543a337` | feat(voc): admin VoC delete (button + RLS delete policy) |
| `00dc5c8` | feat(voc): VoC status labels (done / in progress / on hold) |
| `ff488fe` | feat(admin): member management — cumulative stats + type/approval changes |
| `b11b33b` | style(portfolio): six summary cards on one row (no USD cash line wrap) |
| `5bf8399` | feat(scanner): RSI+MFI grading and leverage thresholds in the technical scanner |
| `8e5a28a` | fix(scanner): crash on stale cache holding removed signal keys (e.g. rsi_os) |
| `1885f10` | feat(admin): show last-seen date in member management |
| `91675bb` | fix(memo): store target weight per month (independent per month) |
| `7f88e15` | feat(richhub): Phase 2 — inject design tokens (colors, fonts, dark tokens) |
| `bf64b3b` | feat(richhub): Phase 3 — switch to dark theme (structural token remap) |
| `f71466d` | fix(richhub): calendar "today" number readability (dark) |
| `454a9ff` | feat(richhub): Phase 3 wrap-up — component library + numeric alignment |
| `1c3511e` | feat(richhub): Phase 4-1 — unify up/down colors to Korean convention (indices, FX) |
| `5bcb383` | feat(richhub): Phase 4-2 — holdings table as RichHub cards |
| `744a370` | feat(richhub): Phase 4-3 — home total-asset hero block |
| `52050fd` | feat(richhub): Phase 4-4 — news list `.list-item` hierarchy |
| `999f09e` | feat(richhub): Phase 5-1 — journal recording mood (Day One, teal accent) |
| `3e0349d` | feat(richhub): Phase 5-2 — immersive Reflection mood for the journal composer |
| `9f4a5ed` | feat(richhub): Phase 6-1 — dark/light theme toggle |
| `9352e2a` | fix(richhub): pre-release QA — corporate monitor dark readability |
| `a191f0c` | feat(richhub): home top — competitor briefing + technical scanner in a 2-column layout |
| `741a16d` | feat(states): Phase 6 inc. 1 — loading skeleton system + applied to news |
| `999806f` | feat(states): Phase 6 inc. 2 — loading skeletons for indices, regulatory, corporate monitor |
| `cce7cb7` | feat(states): Phase 6 inc. 3 — empty states with icon + guidance + CTA |

### 2026-07-10 → 07-11 — Sessions 10–11
| Hash | Message |
|---|---|
| `1d9988b` | feat(states): Phase 6 inc. 4 — per-card errors + unified retry |
| `8e7bcc4` | feat(a11y): Phase 6 inc. 5 — accessibility (icon button labels + keyboard focus ring) |
| `1e2dad2` | feat(notice): service notice — admin publishes → top banner for all users |
| `c98bc9f` | fix(indices): regression, index skeleton stuck (`cards` undefined) |
| `63a92ac` | fix(monitor): corporate quotes stuck on "loading price" (re-fetch price only) |
| `b097944` | fix(ui): dark-mode input readability + admin account deletion + stock edit toggle |
| `edb8d5f` | feat(notice): multiple-choice poll on service notices — admin publishes → one vote per user in banner |
| `a7dbbc3` | feat(api): unify personal/business API keys + guest preview (signup funnel) |
| `14501e9` | perf(api): server-side shared cache for quotes/news/ratings — decouple Finnhub quota from user count |
| `e70ed5c` | feat(flow): Supply & Flow page Phase 1 — KR institutional/foreign net-buy rankings (public to guests) |
| `dd7f71b` | feat(flow): Phase 2 — US insider trades (SEC Form 4) tab |
| `eb2e5df` | feat(monitor): Phase 4 — corporate monitor extended to US stocks (SEC + Finnhub) |
| `1719534` | fix(monitor): improve perceived speed of US cards — render filings immediately + localize 8-K item codes |
| `2305acb` | feat(flow): Phase 3 — institutional holdings (13F) tab, quarterly position changes of major investors |
| `5cc9ea5` | fix(notice): visually separate the poll area from notice body |
| `1e0a575` | fix(flow): remove 13F ambiguity — label as smart money + show as-of date, period, market value |
| `bc5d4fd` | feat(flow): home supply summary bar + warning/alert/journal link on consecutive institutional net selling of held stocks |
| `2b785e7` | docs: KRX indicator planning doc v3 |
| `cb97a42` | docs: add session 11 (notice polls, API unification, Supply & Flow page, 13F, KRX pending) |

### 2026-07-13 → 07-23 — Session 12
| Hash | Message |
|---|---|
| `ef56289` | fix: retry on transient cloud-save rejection + double entity escaping in SEC raw text |
| `e37dca0` | feat: global investment disclaimer + correct misleading "real-time" labels |
| `97f4b31` | feat(memo): glucose tracking in the journal calendar (Phase 1) |
| `b2c1d10` | refactor: consolidate repeated inline styles on regulator link chips into a `.reg-link` class |
| `d7082dd` | fix(auth): repair signup/login error handling + stop leaking raw English messages |
| `1a4d7b2` | feat(journal): add personal schedules (time + title) to the journal calendar |
| `93f49b4` | docs: add session 12 (signup outage, personal schedules, sync guard) |
| `490a46d` | fix(indices): remove corsproxy 403 on KR indices (Naver only via server path) |

---

## 6. Engineering notes for new contributors

These are hard-won constraints. Reading this section will save you days.

### 6.1 The single-file frontend is fragile
`index.html` is ~9,100 lines with one giant `<script>` block. A single duplicate identifier or typo takes the **entire app** down — this has happened (`89eb514`: a redeclared `_ymd`). Rules:
- Prefix short/generic variable names with a scope marker.
- **Always verify the page parses in a browser before pushing.** There is no compiler and no CI to catch it.

### 6.2 `supabase-js` init deadlock
Calling `_sb.from(...)` inside an `onAuthStateChange` callback creates a circular wait on `initializePromise` and freezes the app permanently. Use the raw REST helpers (`_restSelectRow`, `_restUpsert`, `_safeGetSession`) on any init-path code. Never call `_sb` directly from an init path.

### 6.3 Adding a field to cloud sync requires a migration
`_syncToCloud` sends a payload to `user_data`. If you add a field without creating the matching column, **every cloud save 400s** — silently, with data surviving only in localStorage. This actually happened with `impulse_trades` in July. Migration `0002` was written after the fact and must be run manually.

### 6.4 Edge Function caching must hit the DB
In-memory `Map` caches inside the Edge Function are **not shared between requests** — every request misses. Use the `api_cache` table (migration `0008`). Also: cache writes must be `await`ed; fire-and-forget writes get truncated when the request ends. The `x-cache` response header exists for measuring this.

### 6.5 DART has three separate blockers
TLS interception, CORS, and a mandatory ticker→`corp_code` conversion. The solution is a **multi-proxy race (`Promise.any`) plus `corp_map.json`**. Do not reintroduce a single-proxy dependency (the earlier `allorigins`-only version failed constantly). Also note `rcept_dt` in the ownership APIs is `YYYY-MM-DD`, unlike the disclosure APIs, and responses come oldest-first.

### 6.6 Shared API key is a single point of failure
All users run on the administrator's DART/Finnhub keys. If those are deleted, quotes and filings stop for everyone. `get-fh-key` / `get-dart-key` are deliberately blocked so keys never reach the browser — keep it that way.

### 6.7 KRX integration is built but frozen
KRX API access was approved and the integration implemented, but their **terms § 6(2) restrict use to non-commercial purposes**, which conflicts with the paid tier. Migration `0009` is effectively the switch — **do not run it** for this purpose. If revived: the put/call ratio must be computed on open interest, not volume.

### 6.8 GitHub Pages deploys are flaky
The build succeeds but the deploy step intermittently fails with "try again later." If a push does not appear live, it is usually **not a code problem** — re-run the failed deploy or reset Settings → Pages source (None ↔ main). Several `chore: trigger redeploy` commits in the log exist purely for this. **Always verify with a cache-busting query string** (`?cb=<timestamp>`).

### 6.9 Auth email delivery
Supabase's built-in SMTP is rate-limited to a few messages per hour project-wide (429 observed) and drops mail to non-team addresses. Connecting a custom SMTP provider is the only real fix. Duplicate-signup detection is done by checking for an empty `identities: []` in the response.

### 6.10 Data separation in the journal
Personal schedules are stored in a **separate array** from `memoArchive` specifically so they never contaminate investment statistics. Health data (glucose, weight, exercise) is nested under `health.*` for the same reason. Preserve this separation when extending the calendar.

---

## 7. Known open items

| Item | Status |
|---|---|
| Custom SMTP (Gmail) + email confirmation restore | **Urgent** — confirmed disabled in production (2026-07-28): signup returns an `access_token` immediately with `email_verified:true`, so anyone can register an address they do not own. The client still shows the "check your inbox" screen, so code and server config disagree. |
| Cleanup of `qa-` test accounts | Pending — `jinhoo9915+qa0728@gmail.com` added during the 07-28 QA sweep |
| Korean regulatory feed empty | **Open** — `proxy-api` `rss-proxy` gets 503 from Google News, so 금융위/금감원/한국은행/DOJ return nothing. Only direct RSS sources (FTC, Fed) render. |
| Yahoo batch quote 401 | **Open** — `corsproxy.io` and the server-side `yahoo-finance` action both 401 on `v7/finance/quote`. Values still render through the `v8/chart` fallback, but every page load logs errors and wastes a round trip. |
| Run migration `0010_security_events_admin_delete.sql` | Pending — required before the security dashboard's delete buttons work |
| Investigation of 46 `fh-call` auth rejections | Pending |
| Glucose tracking Phase 2 (report charts, HbA1c) | Planned |
| ~~Suspicious index change rates~~ | **Resolved 2026-07-29** — sign inversion in `loadNaverIndex`, see Session 13. Reproduces only on down days. |
| KRX indicators | Frozen on licensing (see §6.7) |
| Empty/Loading/Error state + accessibility QA sweep | Not started |
| Pro-tier payment integration (currently proxied by "approved business account") | Not started |

---

*Generated 2026-07-24 from `git log` on `main`. Korean-language equivalents live in `개발내역.md` and the `기획_*.md` planning documents.*
