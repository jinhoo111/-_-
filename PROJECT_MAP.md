# 투자 허브 (Investment Hub / RichHub) — Project Map

> **이 문서의 목적:** 다음 세션에서 전체 프로젝트를 빠르게 파악하기 위한 단일 레퍼런스.  
> **최신화 날짜:** 2026-07-29  
> **핵심 코드 (레거시, 라이브):** `index.html` (9,279 LOC), `supabase/functions/market-data/index.ts` (1,186 LOC)  
> **핵심 코드 (재작성, 진행 중):** `web/` — Next.js + TypeScript, `rewrite/next` 브랜치 (§13 참고)  
> **라이브:** https://jinhoo111.github.io/-_-/  
> **백엔드:** Supabase (`yijkwuiqnviapztqskak`)
>
> **두 구현체가 의도적으로 공존한다.** `main`/`index.html`은 그대로 라이브 유지하고,
> `rewrite/next`/`web/`은 단계별로 완전 기능 동등성까지 빌드 중. 재작성 작업 중에는
> `index.html`을 수정하지 말 것 — 동작 동등성 확인용 레퍼런스이다. §13 참고.

---

## 1. 이 프로젝트가 뭔가?

**한 줄:** 한국 개인·기업 투자자를 위한 "흩어진 투자 정보 통합 브리핑 대시보드" 웹 서비스.

- **개인:** 다계좌 포트폴리오 + 실시간 시세 + 뉴스 + 지수/환율 + 투자일지를 한 화면에서.
- **기업(B2B 수익 핵심):** 경쟁사 공시·지분변동·규제 동향을 자동으로 모니터링하고 AI로 요약(Pro).
- **핵심 차별점:** "종목 관리 앱"이 아니라 "투자 판단에 필요한 외부 정보를 먼저 찾아와 정리해주는 브리핑 레이어".

### 주요 기능 영역

| 페이지 | 설명 | 데이터 소스 |
|--------|------|-------------|
| **Home** | 총자산 히어로, 경쟁사 브리핑(Pro), 기술적 신호 스캐너, 수급 요약 바 | 날것 + 합성 |
| **Portfolio** | 다계좌 보유 종목, KR/US 티커, 손익, 정렬, KRW/USD 토글 | Finnhub, Naver, Yahoo |
| **Indices** | KOSPI/KOSDAQ/US 지수, FX, VIX, 가상화폐, 10Y-2Y 장단기 금리 | Yahoo, CoinGecko |
| **News** | 시장/종목별 뉴스, 월가 레이팅, 실시간 시세, 뉴스→일지 원클릭 | Finnhub, Naver |
| **Research** | 韓/美 규제기관 모니터링, 키워드 검색 | RSS/공식 피드 |
| **Corporate Monitor** | DART(韓) + SEC(美) 공시, 지분변동(5%·납세) 추적 | DART, SEC EDGAR |
| **Supply & Flow** | 국내 기관/외국인 순매수 랭킹, Form 4, 13F | Naver, SEC |
| **Journal** | 캘린더 중심 투자 일지, 가계부, 몸무게/욕동/혈당, 투자 철학 | 자체 DB |
| **Admin** | 회원 관리, 공지/투표, VoC, 보안 대시보드, 공용 시장 일정 | 자체 DB |

---

## 2. 아키텍처 (간단히)

```
[Browser: index.html (single-file SPA, vanilla JS)]  ← GitHub Pages
        │ HTTPS
        ▼
[Supabase]
  ├─ Auth (JWT, 이메일/비밀번호 — 현재 email confirmation OFF)
  ├─ Postgres (user_data, user_profiles, security_events, api_cache, ...)
  └─ Edge Function: market-data (Deno, 1,186 LOC)
        ▼
[External APIs] Finnhub · Yahoo Finance · Naver · DART · SEC EDGAR · CoinGecko
```

### 가장 중요한 아키텍처 결정

- **빌드 없는 단일 파일 SPA.** 전체 클라이언트가 `index.html` 하나. GitHub Pages 배포 단순성을 위해 선택했고, 이것이 가장 큰 제약 (파싱 오류 시 전체 앱 다운).
- **모든 민감/차단된 호출은 `market-data` Edge Function 경유.** `action` 문자열로 분기. (~30개 액션)
- **관리자 공용 API 키.** 2026-07-11 이후 모든 사용자가 관리자의 Finnhub/DART 키를 공유 사용. 개인 키 입력 UI는 제거됨.
- **서버 쪽 공유 캐시.** Edge Function 메모리 캐시는 요청 간 공유 안 됨 → `api_cache` Postgres 테이블 사용.

---

## 3. 파일/디렉터리 지도

```
index.html                          # 전체 레거시 프론트엔드 (HTML + CSS + JS) — 레퍼런스, 재작성 작업 중 수정 금지
corp_map.json                       # KR 티커(6자리) → DART corp_code 매핑
designsystem_richbuild_v2.md        # 실제 적용 중인 디자인 토큰 문서
web/                                 # Next.js 재작성 (rewrite/next 브랜치) — 내부 구조는 §13 참고
supabase/
  functions/market-data/index.ts    # 단일 Edge Function (정본, 레거시)
  migrations/0001_*.sql ~ 0010_*.sql # DB 마이그레이션 (두 구현체가 공유)
```

---

## 4. 핵심 문서 빠른 가이드

| 궁금한 것 | 먼저 볼 파일 |
|-----------|--------------|
| "색상/폰트/토큰 값" | `designsystem_richbuild_v2.md` |
| "지금까지 뭘 개발했고, 어떤 버그를 겪었나?" | `git log` |
| "재작성 진행 상황/계획/구조" | 아래 §13, 그리고 저장소 루트의 `CLAUDE.md` |

---

## 5. `index.html` 난독화 방지 가이드

`index.html`은 9,279줄짜리 단일 파일이다. 함수/변수가 매우 많으므로 **이름 패턴**을 알면 탐색이 빠르다.

### 네이밍 규칙

| 접두사/패턴 | 의미 | 예시 |
|-------------|------|------|
| `_` (underscore) | 전역 헬퍼/난감 방지용 날것 함수/변수 | `_restSelectRow`, `_syncToCloud`, `_sb` |
| `pf_` | localStorage 키 prefix | `pf_stocks`, `pf_ma`, `pf_phil` |
| `renderXxx()` | 화면 그리기 함수 | `renderStocks()`, `renderMemos()` |
| `loadXxx()` | 데이터 불러오기 | `loadMarketNews()`, `loadNaverIndex()` |
| `goPage(page)` | 상단 탭/페이지 전환 | `goPage('portfolio')` |
| `proxyApiCall()` | Edge Function 호출 (FH/AI) | `proxyApiCall('finnhub', ...)` |
| `_callMarketData(action, body)` | `market-data` Edge Function 직접 호출 | `_callMarketData('fh-call', {...})` |

### 주요 전역 상태 변수 (추정, 실제 이름 확인 필요)

- `stocks` — 보유 종목 배열
- `accounts` — 계좌 목록
- `memos` / `memoArchive` — 활성 일지 / 아카이브
- `investPhilosophy` — 투자 철학
- `watchlist` / `monitoredCorps` — 관심 종목 / 기업 모니터링
- `_currentUser`, `_currentSession` — 현재 로그인 세션
- `_isPro` — Pro(승인 기업/관리자) 여부

### CSS 클래스 패턴

| 클래스 | 의미 |
|--------|------|
| `.page` | 각 탭 페이지 컨테이너 |
| `.page.on` | 현재 활성 페이지 |
| `.nav-tab` / `.nav-tab.on` | 상단 탭 |
| `.itab` / `.ipanel` | 남 탭/패널 |
| `.card` | 토스풍 카드 기본 |
| `.btn`, `.btn-primary`, `.btn-sm`, `.btn-lg` | 버튼 규격 |
| `.fbtn` | 필터/칩 버튼 |
| `.pill` | 뱃지/태그 |
| `.tbl-wrap` | 고정 10행 스크롤 테이블 |
| `.metrics` | 지표 카드 그리드 |
| `.sk-*` | 로딩 스켈레톤 |
| `.empty-*` | 빈 상태 |
| `.err-box` | 에러 박스 |

---

## 6. `market-data` Edge Function 액션 요약

| 액션 | 용도 | 인증 |
|------|------|------|
| `fh-call` | Finnhub 프록시 (quote, news, recommendation, calendar/earnings 등) | 필요 |
| `public-news` | 비회원용 시장 뉴스 | 불필요 |
| `flow-kr-rank` | 국내 기관/외국인 순매수 랭킹 | 불필요 |
| `flow-kr-stock` | 종목별 수급 추이 | 필요 |
| `flow-kr-refresh` | 랭킹 배치 재계산 (secret) | 시크릿 |
| `sec-insider-latest` | 최신 SEC Form 4 피드 | 불필요 |
| `sec-insider-stock` | 종목별 Form 4 | 필요 |
| `sec-13f` / `sec-13f-list` | 기관 보유 변화 | 필요 |
| `sec-company` / `sec-filings` | 미국 기업 조회/공시 | 필요 |
| `dart-*` | DART 검색/공시/보유주식/프록시/시세 | 필요 |
| `yahoo-finance` | Yahoo/Naver CORS 프록시 | 필요/일부 |
| `admin-*` | 관리자 키 관리/회원 삭제/보안 | 관리자 |
| `keys-ready` / `biz-keys-ready` | 공용 키 상태 | 필요 |
| `krx-probe` | KRX API 진단 | 관리자 |

### 보안/캐시 핵심

- `authenticate()`에서 JWT 서명 검증 (fail-closed). 위조 토큰은 `security_events`에 기록.
- `api_cache` 테이블은 `service_role`만 접근. TTL은 데이터 성격에 따라 다름.
- DART는 TLS/CORS 문제로 **다중 프록시 경쟁 (`Promise.any`)** 사용.

---

## 7. DB 마이그레이션 요약

| 파일 | 목적 | 상태 |
|------|------|------|
| `0001_security_events.sql` | 보안 이벤트 로그 | ✅ |
| `0002_user_data_impulse_trades.sql` | 충동매매 컬럼 | ✅ |
| `0003_voc_requests.sql` | VoC(의견/문의) | ✅ |
| `0004_admin_accounts.sql` | 관리자 회원 관리 뷰 | ✅ |
| `0005_last_seen.sql` | 최근 접속일 | ✅ |
| `0006_service_notice.sql` | 서비스 공지 | ✅ |
| `0007_notice_poll.sql` | 공지 객관식 투표 | ✅ |
| `0008_api_cache.sql` | 외부 API 공유 캐시 | ✅ |
| `0009_user_data_schedules.sql` | 개인 일정 컬럼 | ✅ |
| `0010_security_events_admin_delete.sql` | 관리자 보안 이벤트 삭제 | ✅ (적용 필요) |

---

## 8. 개발 시 꼭 지켜야 할 제약/교훈

### 8.1 단일 파일 SPA의 취약성
- `index.html`에 중복 선언/오타 하나면 **전체 앱이 안 켜짐**.
- 짧은 변수명에는 스코프 prefix를 붙일 것. (예: `_ownYmd`로 `_ymd` 중복 회피)
- **항상 브라우저에서 파싱 확인 후 푸시.** 컴파일러/CI가 없다.

### 8.2 `supabase-js` 초기화 교착
- `onAuthStateChange` 콜백 안에서 `_sb.from()` 호출 시 `initializePromise` 순환 대기 → **앱 영구 정지**.
- init 경로에서는 **반드시 raw REST 헬퍼 사용**: `_restSelectRow`, `_restUpsert`, `_safeGetSession`.

### 8.3 클라우드 동기화 마이그레이션
- `_syncToCloud`는 `user_data`에 upsert. 새 필드 추가 시 반드시 컬럼 마이그레이션 필요.
- 없으면 **전체 클라우드 저장이 400** 되고 데이터는 localStorage에만 남음.
- 최근 `_syncSkipCols` 가드 추가로 일부 미적용 시에도 나머지는 저장됨.

### 8.4 Edge Function 캐시
- **메모리 `Map` 캐시는 요청 간 공유 안 됨.** 반드시 `api_cache` 테이블 사용.
- 캐시 저장은 `await` 필수. fire-and-forget이면 응답 반환 시 잘림.

### 8.5 DART 3대 제약
- TLS interception, CORS 차단, 티커→`corp_code` 변환.
- 해결: 다중 프록시 레이스 + `corp_map.json`. 단일 프록시 의존 금지.

### 8.6 공용 API 키 = 단일 장애점
- 관리자가 `shared_finnhub_key`/`dart_api_key`를 지우면 전 사용자 시세·공시 중단.
- `get-fh-key`/`get-dart-key`는 의도적으로 차단 → 브라우저에 키 노출 금지.

### 8.7 KRX 통합 보류
- KRX 키는 발급받았으나 **이용약관 §6(2) 비영리 제한**으로 상업적 유료 티어와 충돌.
- `0009` 마이그레이션은 개인 일정용. KRX 상용화는 **하지 말 것**.

### 8.8 GitHub Pages 배포 불안정
- 가끔 deploy step 실패. 코드 문제 아님.
- 확인은 캐시 버스터 쿼리: `?cb=<timestamp>`.

---

## 9. 현재 상태 및 알려진 이슈

### 최근 커밋 (main)

```
2752b4c docs: add English development history for onboarding
bb44e4a fix(indices): correct sign-inverted KR index rate, plus live QA sweep fixes
490a46d fix(indices): 국내 지수 corsproxy 403 제거 (네이버는 서버 경로만 사용)
93f49b4 docs: 개발내역에 세션 12 기록 (회원가입 장애·개인 일정·동기화 가드)
1a4d7b2 feat(journal): 투자 일지 캘린더에 개인 일정(시간+제목) 추가
```

### 해결된 주요 결함 (2026-07-28 QA sweep)

- **국내 지수 등락률 부호 반전** (`loadNaverIndex`): Naver가 이미 부호 있는 `fluctuationsRatio`를 주는데 direction을 다시 곱해서 음수가 양수로 뒤집힘. 하락장에만 발견됨. 해결.
- **신규 가입자 API 키 미복원**: `_restoreApiKeyState()`가 `onboarding_done` 분기 안에서만 호출돼 가입 직후 세션 낂. 해결.
- **일지 어닝 마커 dead**: 레거시 `proxy-api` 경로 + Edge 화이트리스트 누락이 겹침. `proxyApiCall`로 이전 + `calendar/earnings` 추가.
- **보유 종목 표 고정 높이 스크롤**: 10행 고정 + 헤더 pin. 뉴스/FX 위치가 밀리지 않음.

### 아직 열린 이슈

| 이슈 | 상태 | 비고 |
|------|------|------|
| Custom SMTP + email confirmation 복구 | **긴급** | 현재 Confirm email OFF → 누구나 가입 가능, 비밀번호 재설정 메일 불가 |
| `qa-*` 테스트 계정 정리 | 대기 | Authentication → Users에서 검색 |
| 한국 규제 피드 (Google News RSS) 503 | **열림** | `proxy-api rss-proxy` 503. FTC/Fed 직접 RSS는 정상 |
| Yahoo batch quote 401 | **열림** | `v7/finance/quote` 401, `v8/chart` 폴팩으로 살아있음 |
| 46건 `fh-call` auth 거부 조사 | 대기 | 2026-07-22 15:20 집중 발생 |
| 혈당 트래킹 Phase 2 | 계획 | 차트, HbA1c |
| Empty/Loading/Error + 접근성 QA | 미시작 | |
| Pro 결제 연동 | 미시작 | 현재는 "승인 기업 계정"으로 프록시 |
| KRX 지표 | **보류** | 라이선스 충돌 |

---

## 10. 다음 세션 시작 시 추천 루틴

1. **최신 상태 확인:** `git status`, `git log --oneline -10`.
2. **이 파일 먼저 읽기.** (지금 이 문서)
3. **변경 영역 파악:**
   - 프론트만 → `index.html`.
   - 서버/API → `supabase/functions/market-data/index.ts` + 필요시 마이그레이션.
   - 기획/문서 → 해당 `.md`.
4. **빌드/테스트:** 브라우저에서 `index.html` 직접 열어 파싱 확인. GitHub Pages 라이브 확인 시 `?cb=<timestamp>`.
5. **Edge Function 배포 필요 시:**
   ```bash
   npx supabase functions deploy market-data --project-ref yijkwuiqnviapztqskak
   ```
6. **DB 마이그레이션 필요 시:** Supabase SQL Editor에 붙여넣기.

---

## 11. 용어 사전

| 용어 | 의미 |
|------|------|
| **DART** | 한국 금융감독원 전자공시 시스템 |
| **corp_code** | DART용 기업 고유 코드 (티커와 별도) |
| **FH / Finnhub** | 미국 주식 시세/뉴스 API |
| **Form 4** | SEC 납세 공시 (미국 기업 납세자 거래) |
| **13F** | 미국 기관투자자 분기 보유 공시 |
| **CUSIP** | 미국 증권 식별번호 |
| **CIK** | SEC 기업 식별번호 |
| **RLS** | Postgres Row Level Security |
| **Pro** | 유료 기업 승인 계정 (현재 `_isPro` 프록시) |
| **VoC** | Voice of Customer (사용자 의견/문의) |
| **NSM** | North Star Metric (주간 활성 포트폴리오 업데이트 수) |

---

## 12. 외부 링크/환경

| 항목 | 값 |
|------|-----|
| GitHub Pages | https://jinhoo111.github.io/-_-/ |
| Supabase Project | `yijkwuiqnviapztqskak` |
| Edge Function | `https://yijkwuiqnviapztqskak.supabase.co/functions/v1/market-data` |
| Legacy Edge Function | `.../functions/v1/proxy-api` (GoogleAI 키 등 일부 잔존) |

---

## 13. `web/` — Next.js 재작성 (`rewrite/next` 브랜치)

전체 재작성 계획과 단계 순서는 저장소 루트의 `CLAUDE.md`가 참조하는 계획 문서 참고
(커밋된 파일은 아니며, 필요 시 요청). 아래는 계획의 의도가 아니라 **실제 코드와 동기화된
현재 상태**의 맵이다.

### 현재 상태

**7개 앱 섹션 + 전체 관리자 콘솔 모두 구현됨.** 2026-08-07 검증: 인증(Phase 0), Portfolio,
Indices, Journal, News, Research, Flow, Monitor, Security admin 모두 `rewrite/next`에
배포됨(git log: Phases 1–6 + Playwright E2E). 레거시 Home 대시보드 위젯(수급 요약 바,
경쟁사 브리핑, 기술 신호 스캐너, 보유 종목 최신 소식)은 2026-08-07 `/portfolio`에 복원됨.
뉴스 실시간 시세 탭, 설정 페이지, 온보딩/프로필, 기업 승인 대기, 도움말 FAB + VoC,
면책 배너, 자동 장마감 가격 갱신, 미국 실적 마커도 같은 날 추가됨. EN/KO 언어 토글 완료.

남은 패리티 갭: 게스트 샘플 데이터, KR 실적 마커, 알림/중복 방지 폴리시, `data_owner`
격리, 심층 E2E 인터랙션 테스트, 컷오버(Vercel 배포 + 레거시 폐기) — `MIGRATION_PLAN.md` 참고.

### 스택

Next.js (App Router) + TypeScript + Tailwind CSS v4, TanStack React Query, `@supabase/ssr`.
i18n 라이브러리 없음(커스텀 Context, 아래 참고), 컴포넌트 라이브러리 없음(`designsystem_richbuild_v2.md`의
디자인 토큰 위에 직접 만든 프리미티브).

### 디렉터리 지도 (실제 구현 기준)

```
web/src/
  app/
    layout.tsx                    # 루트 서버 레이아웃 — lang="ko" 고정, <Providers> 래핑
    providers.tsx                 # "use client" — LanguageProvider > ThemeProvider > QueryClientProvider > ToastProvider
    page.tsx                      # "/" — 세션 여부로 /portfolio 또는 /login 리다이렉트
    (auth)/layout.tsx             # 서버 컴포넌트 — 인증 카드 셸 + LanguageToggle 아일랜드
    (auth)/login/page.tsx
    (auth)/signup/page.tsx        # 폼 + 이메일 인증 대기 뷰, 재발송 쿨다운
    (auth)/forgot-password/page.tsx
    (auth)/reset-password/page.tsx
    (app)/layout.tsx              # 서버 컴포넌트 — 인증 후 셸, <AppNav/> 렌더
    (app)/portfolio/page.tsx      # 보유종목, 손익, 추가/수정/숨김, 실시간 시세
    api/market/quote/route.ts     # GET — Naver(KR) / Yahoo v8(US, 프리/포스트 포함) 시세 프록시
    auth/callback/route.ts        # Supabase 이메일 링크 콜백 (가입 인증, 비밀번호 재설정)
    auth/signout/route.ts
  components/
    layout/AppNav.tsx             # "use client" 아일랜드 — 네비 링크 + LanguageToggle + 로그아웃, (app)/layout.tsx에서 사용
    ui/                           # Button, Card, Input, EmptyState, Skeleton, Toast (ToastProvider/useToast), LanguageToggle
  lib/
    supabase/{browser,server,admin,middleware}.ts   # @supabase/ssr 클라이언트 팩토리
    auth/errors.ts                 # authErrText() → i18n 메시지 키(텍스트 아님), authErrIsRateLimit, passwordStrength
    auth/useResendCooldown.ts
    portfolio/constants.ts         # ACCOUNT_LIST (한글 증권사명, 데이터), STATUS_LABEL_KEY/STYLE_LABEL_KEY/STYLE_ABBR_KEY, KR_TICKER_MAP/US_TICKER_MAP, resolveTickerFromName()
    queries/useUserData.ts         # useUserData() + useUpdateUserData() — 1.2초 디바운스 후 user_data upsert, 레거시 _syncToCloud 미러
    queries/useQuotes.ts           # /api/market/quote용 React Query 훅
    types/userData.ts              # UserData, Stock, EMPTY_USER_DATA, isKrTicker()
    i18n/messages.ts               # Lang, messages.{ko,en}, t(lang, key, params?)
    i18n/LanguageProvider.tsx      # "use client" — Context + localStorage("rh_lang") + useLang()/useT()
  proxy.ts                         # Next의 "proxy" export (미들웨어) — updateSession()으로 세션 갱신, matcher는 _next/static/image + 이미지 확장자 제외
```

### EN/KO 언어 토글 (크로스커팅, 완료)

- **패턴:** 가벼운 커스텀 React Context (`lib/i18n/LanguageProvider.tsx`), `next-intl` 아님 —
  기존 `ToastProvider`, `next-themes`(`storageKey="rh_theme"`) 패턴을 그대로 미러링. URL locale
  세그먼트 없음.
- **기본값:** 한국어이지만 첫 마운트 시 `navigator.language`를 자동 감지(영어 브라우저 →
  영어로 시작). 토글 선택은 `localStorage`의 `rh_lang`에 저장되어 이후 방문 시 자동감지를
  덮어씀.
- **상승/하락 색상은 두 언어 모두 한국식 관례(빨강=상승/파랑=하락) 유지** — 언어에 따라
  절대 반전하지 않음.
- **고유명사는 두 언어 모두 한국어 유지:** `ACCOUNT_LIST`의 증권사명, `lib/portfolio/constants.ts`의
  `KR_TICKER_MAP`/`US_TICKER_MAP` 조회 키 — 이것들은 UI 텍스트가 아니라 데이터다. 저장/조회
  값 `"기타"`는 절대 번역하지 않고, *표시*되는 라벨만 `t("portfolio.account.other")`로 해석.
- **로케일 무관 API 계약:** `/api/market/quote`는 마켓 `state` 코드만 반환하고
  (`PRE`/`POST`/`REGULAR`/`CLOSED`) 지역화된 라벨은 절대 반환하지 않음. 클라이언트가
  `portfolio/page.tsx`에서 `MARKET_STATE_KEY` + `t()`로 라벨을 해석. 앞으로 추가되는 서버
  라우트도 이 방식으로 로케일 무관을 유지할 것.
- **메시지 키 간접화:** 클라이언트 컴포넌트가 아닌 일반 모듈(`lib/auth/errors.ts`,
  `lib/portfolio/constants.ts`)은 리터럴 문자열이 아니라 **메시지 키**를 반환/보관한다
  (예: `"authError.invalidCredentials"`, `"portfolio.status.buy"`) — `useT()`가 스코프에
  있는 UI 레이어만 `t(key)`를 호출.
- 새 UI 문자열 추가 방법: `lib/i18n/messages.ts`의 `ko`와 `en` **양쪽 모두**에 키를 추가한 뒤,
  클라이언트 컴포넌트에서 `t("your.key")` (또는 `{param}` 보간이 필요하면
  `t("your.key", { param })`)를 호출. `useT()`의 `t`는 엄격한 키 유니온이 아니라 일반
  `string`을 받음 — `` `auth.signup.strength.${strength}` `` 같은 동적으로 만들어지는 키와의
  마찰을 피하기 위한 의도적 선택.

### 명령어 (`web/`에서 실행)

```bash
npm run dev      # localhost:3000
npm run build    # CI와 동일 — 작업 완료로 간주하기 전에 반드시 통과해야 함
npm run lint     # eslint (react-hooks v7 규칙 포함 — 아래 set-state-in-effect 참고)
npx tsc --noEmit
```

CI(`.github/workflows/web-ci.yml`)는 `web/**`를 건드리는 모든 push/PR에서 `main`과
`rewrite/next` 양쪽에 대해 `tsc --noEmit`, `lint`, `build`(secrets:
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`)를 실행한다.

### 알려진 lint 함정

`eslint-plugin-react-hooks` v7의 `set-state-in-effect` 규칙은 `useEffect` 안의 `setState`
호출을 잡아낸다. `LanguageProvider.tsx`의 마운트 이펙트(클라이언트에서만 `localStorage`를
읽어 `lang`을 하이드레이션 — SSR은 반드시 정적 `"ko"` 기본값으로 시작해야 하므로)는 이
패턴의 의도적이고 올바른 사용이다 — 구조를 바꿔 회피하지 않고, 이유를 설명하는 주석과
함께 인라인으로 비활성화했다.

### 자동 QA (Playwright, headless)

`web/e2e/`에는 실제 headless Chromium 브라우저로 실행 중인 앱을 구동하는 Playwright E2E
스위트가 있다 — 인증 우회/모킹 없이, 실제 Supabase 테스트 계정으로 진짜 `/login` 폼을
통해 로그인한다.

```text
web/
  playwright.config.ts     # E2E_BASE_URL이 없으면 webServer가 포트 3100에서
                            # `npm run dev`를 자동 실행 (Vercel 프리뷰 URL을 가리키게 할 수도 있음)
  e2e/
    auth.setup.ts          # "setup" 프로젝트 — 실제 로그인 폼으로 테스트 유저/관리자
                            # 로그인 후 Playwright storageState를 e2e/.auth/{user,admin}.json에
                            # 저장해 다른 스펙들이 재사용
    public/*.spec.ts        # "public" 프로젝트 — 비인증: 로그인/가입/비번찾기 렌더링,
                            # i18n 토글, 미인증 라우트 리다이렉트 검증
    authed/*.spec.ts        # "authenticated" 프로젝트 — user.json storageState 재사용
    admin/*.spec.ts         # "admin" 프로젝트 — admin.json storageState 재사용
```

**설정(개발자별 최초 1회):** Supabase에 일반 사용자 하나, (선택) `user_profiles.is_admin
= true`인 관리자 사용자 하나를 만든 뒤 `web/.env.local`에 `E2E_TEST_EMAIL`/
`E2E_TEST_PASSWORD`, `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`를 채운다. 관리자 자격증명이
비어 있으면 admin 전용 스펙은 실패가 아니라 자동으로 skip된다. `E2E_BASE_URL`은
선택사항 — 비워두면 Playwright가 자체 dev 서버를 띄운다.

**명령 (`web/`에서 실행):**

```bash
npm run e2e          # headless 전체 프로젝트 실행
npm run e2e:ui       # Playwright 대화형 UI 모드
npm run e2e:report   # 마지막 HTML 리포트 열기
```

**CI:** `.github/workflows/web-ci.yml`의 별도 `e2e` job이 메인 `ci` job 이후 실행되지만,
저장소 변수 `E2E_ENABLED`가 `"true"`일 때만 동작한다(기본은 off — 실제 `E2E_TEST_*`/
`E2E_ADMIN_*` secrets 설정이 먼저 필요). 성공/실패 관계없이 매 실행마다 HTML 리포트를
아티팩트로 업로드한다.

### 아직 시작 안 함 (전체 단계 순서는 계획 문서 참고)

Indices, Journal, News+Research, Flow, Monitor, Security admin, 그리고 cutover(도메인
이전, SMTP, GitHub Pages/Edge Functions 단계적 폐기)는 `web/`에서 아직 미구현. 각각은
별도의 향후 Phase이며, 관련 없는 작업에서 범위를 넘겨짚지 말 것.

---

*이 문서는 `PROJECT_MAP.md`이며, 향후 주요 구조 변경 시 반드시 갱신할 것.*
