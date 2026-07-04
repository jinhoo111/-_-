# nabakai.com 개발 리버스 엔지니어링

> 개발/구현 단계 분석 | 기준일: 2026-07-04  
> URL: https://nabakai.com/ | sw.js · flow.json · prerender/* 기반 역분석

---

## 목차

1. [기술 스택 추정](#1-기술-스택-추정)
2. [아키텍처 구조](#2-아키텍처-구조)
3. [데이터 파이프라인 상세](#3-데이터-파이프라인-상세)
4. [API 연동 구현 상세](#4-api-연동-구현-상세)
5. [내부 계산 로직 구현](#5-내부-계산-로직-구현)
6. [프론트엔드 구현](#6-프론트엔드-구현)
7. [서비스워커 & PWA 구현](#7-서비스워커--pwa-구현)
8. [AI 콘텐츠 생성 파이프라인](#8-ai-콘텐츠-생성-파이프라인)
9. [프리렌더 시스템](#9-프리렌더-시스템)
10. [알림 & 커뮤니티 시스템](#10-알림--커뮤니티-시스템)
11. [규제 컴플라이언스 구현](#11-규제-컴플라이언스-구현)
12. [배포 & 인프라 추정](#12-배포--인프라-추정)
13. [구현 재현 로드맵](#13-구현-재현-로드맵)

---

## 1. 기술 스택 추정

### 프론트엔드

| 계층 | 추정 기술 | 근거 |
|------|----------|------|
| 프레임워크 | **SPA (React or Svelte 추정)** | 탭 전환이 페이지 리로드 없이 동작, `sw.js`에서 `/` HTML 캐시 제외 패턴 |
| 번들러 | **Vite** | `?v=` 쿼리 파라미터 버전 해시 패턴, Cache-First 전략으로 immutable 처리 |
| 스타일링 | **Tailwind CSS** | 다크모드 토글, 색상/간격 일관성, 별도 CSS 파일 미노출 |
| 상태관리 | 자체 fetch 훅 추정 | 30초 polling으로 flow.json 갱신, 복잡한 전역 상태 불필요 |
| 언어 | TypeScript 추정 | 필드 구조 일관성, 타입 안전 JSON 파싱 패턴 |

### 백엔드

| 계층 | 추정 기술 | 근거 |
|------|----------|------|
| 런타임 | **Python** | KIS OpenAPI Python SDK, DART OpenAPI Python 라이브러리 존재, `fetched_at` ISO 포맷 (Python datetime) |
| 스케줄러 | **APScheduler 또는 cron** | `봇 일 1회 갱신` 명시, 5초·30분·18시 등 복수 주기 |
| 데이터 처리 | **pandas + numpy** | 벡터화 유사 패턴(프렉탈), 이동평균, CCI 계산 |
| AI 생성 | **OpenAI API 또는 Anthropic Claude API** | 자연어 시황 해설, 리포트 생성 |
| 웹 프레임워크 | **FastAPI 또는 Flask** | `/flow.json` 정적 서빙 or `/api/*` 동적 엔드포인트 |
| 데이터 저장 | **JSON 파일 캐시 + SQLite/PostgreSQL** | flow.json 단일 파일 서빙, 히스토리 저장 필요 |

### 인프라

| 항목 | 추정 | 근거 |
|------|------|------|
| 호스팅 | **Cloudflare Pages 또는 Vercel** | `nb-static-v1` SW 캐시명, 정적 자산 버전 관리 패턴 |
| CDN | Cloudflare | 정적 자산 SWR 전략, 글로벌 지연 최소화 |
| 도메인 | nabakai.com | Cloudflare DNS 추정 |
| 백엔드 서버 | **VPS (AWS EC2 / GCP / Hetzner)** | Python 상주 프로세스 필요 |

---

## 2. 아키텍처 구조

### 전체 시스템 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    외부 데이터 소스                       │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ KIS API  │DART API  │KRX 통계  │ SEC EDGAR│FDR/Binance  │
│ (5초·    │(임원 공시│(신용·    │(13F·Form │(주가·암호화  │
│  30분)   │ 일1회)   │ 공매도)  │  4 분기) │  폐 데이터) │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬──────┘
     │          │          │          │            │
     └──────────┴──────────┴──────────┴────────────┘
                           │
                    ┌──────▼──────┐
                    │ Python 수집 │
                    │  봇/스케줄러 │
                    │  (APScheduler│
                    │   또는 cron) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │ 계산 엔진  │ │AI 생성 │ │프리렌더  │
        │(나박지수,  │ │(LLM API│ │빌더      │
        │ 기술신호,  │ │ 호출)  │ │(HTML 생성│
        │ 프렉탈)   │ └───┬────┘ │ 및 저장) │
        └─────┬─────┘     │      └────┬─────┘
              │           │           │
              └─────┬─────┘           │
                    │                 │
             ┌──────▼──────┐   ┌──────▼──────┐
             │  flow.json  │   │/prerender/  │
             │ (~200KB,    │   │ *.html 파일 │
             │  30초 갱신) │   │ (정적 빌드) │
             └──────┬──────┘   └──────┬──────┘
                    │                 │
             ┌──────┴─────────────────┘
             │
     ┌───────▼──────────────────┐
     │     정적 파일 서버 / CDN  │
     │  (Cloudflare Pages 추정) │
     └───────┬──────────────────┘
             │
     ┌───────▼──────────────────┐
     │     클라이언트 SPA        │
     │  - 탭: 한눈에/테마/AI랩  │
     │  - 30초 polling          │
     │  - 서비스워커 캐시        │
     │  - PWA 설치 지원          │
     └──────────────────────────┘
```

### 데이터 갱신 주기별 분류

```
실시간 (5초):
  └─ KIS 코스피·코스닥·코스피200 지수

장중 (30분):
  └─ 투자자별 순매수 TOP (KRX 공식)

장중 (5분):
  └─ 외국계 거래원 순매수

전체 (30초):
  └─ 클라이언트 polling → flow.json 재요청

일 1회 (18시):
  └─ KRX 신용융자 잔고 확정
  └─ 대차잔고 확정 (KIS)

일 1회 (봇):
  └─ DART 공시 수집
  └─ 프리렌더 HTML 재빌드
  └─ AI 리포트 생성

분기 1회:
  └─ SEC 13F 공시 수집
  └─ 고래(Whale) 페이지 재빌드
```

---

## 3. 데이터 파이프라인 상세

### 3-1. KIS (한국투자증권) Open API 연동

**참고 라이브러리:** `kis_auth` 또는 한국투자증권 공식 Python SDK

```python
# 추정 구현 패턴
import requests

KIS_BASE = "https://openapi.koreainvestment.com:9443"
HEADERS = {
    "content-type": "application/json",
    "authorization": f"Bearer {ACCESS_TOKEN}",
    "appkey": APP_KEY,
    "appsecret": APP_SECRET,
    "tr_id": "FHKUP03500100",  # 국내주식 현재가 TR
}

# 국내 지수 실시간 (5초 주기)
def get_kospi_realtime():
    r = requests.get(
        f"{KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-index-price",
        headers={**HEADERS, "tr_id": "FHPUP02100000"},
        params={"fid_cond_mrkt_div_code": "U", "fid_input_iscd": "0001"}
    )
    return r.json()["output"]

# 투자자별 순매수 (외국인·기관·개인)
def get_investor_trading(stock_code):
    r = requests.get(
        f"{KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-investor",
        headers={**HEADERS, "tr_id": "FHKST01010900"},
        params={"fid_cond_mrkt_div_code": "J", "fid_input_iscd": stock_code}
    )
    return r.json()

# 미국 주식 거래 순위
def get_us_rank():
    r = requests.get(
        f"{KIS_BASE}/uapi/overseas-stock/v1/quotations/inquire-search",
        headers={**HEADERS, "tr_id": "HHDFS76410000"},
        params={"AUTH": "", "EXCD": "NAS", "COLN": "TVOL", "KEYB": ""}
    )
    return r.json()

# 일봉 OHLCV (기술 지표 계산용)
def get_daily_ohlcv(stock_code, days=60):
    r = requests.get(
        f"{KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-daily-price",
        headers={**HEADERS, "tr_id": "FHKST01010400"},
        params={
            "fid_cond_mrkt_div_code": "J",
            "fid_input_iscd": stock_code,
            "fid_period_div_code": "D",
            "fid_org_adj_prc": "1"
        }
    )
    return r.json()["output2"]  # 최대 30거래일, 2회 호출로 60일
```

**수집 항목 → flow.json 매핑:**

| KIS TR ID | 수집 데이터 | flow.json 키 |
|-----------|-----------|--------------|
| `FHPUP02100000` | 코스피/코스닥 지수 실시간 | `hero.kospi`, `hero.kosdaq` |
| `FHKST01010900` | 투자자별 순매수 | `supply_anomaly` |
| `HHDFS76410000` | 미국 주식 거래 순위 | `us_kis_rank` |
| `FHKST01010400` | 일봉 OHLCV | 기술 지표 계산 원본 |
| 프로그램매매 TR | 프로그램 매수 장중 누적 | UI 직접 표시 |
| 신용융자 TR | 신용잔고·반대매매 | `hero`, UI 표시 |
| 대차잔고 TR | 종목별 대차잔고 | `short_squeeze` 계산 원본 |

**FDR 폴백 구현:**
```python
def get_us_rank_with_fallback():
    try:
        data = get_us_rank()  # KIS 먼저 시도
        source = "kis_realtime"
    except Exception:
        import FinanceDataReader as fdr
        data = fdr.StockListing("NASDAQ")  # 폴백
        source = "fdr_fallback"
    return {"data": data, "_source": source, "fetched_at": datetime.utcnow().isoformat()}
```

---

### 3-2. DART (금융감독원) Open API 연동

**공식 API:** `https://opendart.fss.or.kr/api/`

```python
import requests

DART_API_KEY = "YOUR_API_KEY"
DART_BASE = "https://opendart.fss.or.kr/api"

# 임원 대주주 소유 보고 (5%룰)
def get_major_shareholder_report():
    r = requests.get(f"{DART_BASE}/majorstock.json", params={
        "crtfc_key": DART_API_KEY,
        "bgn_de": "20260701",
        "end_de": "20260704",
    })
    return r.json()["list"]

# 임원·주요주주 소유주식 변동 보고
def get_executive_trading():
    r = requests.get(f"{DART_BASE}/elestock.json", params={
        "crtfc_key": DART_API_KEY,
        "bgn_de": "20260701",
        "end_de": "20260704",
    })
    return r.json()["list"]

# 공시 원문 링크 생성
def build_dart_url(rcept_no: str) -> str:
    return f"https://dart.fss.or.kr/dsaf001/main.do?rcpNo={rcept_no}"
```

**DART → flow.json 변환 로직:**
```python
def transform_insider_buy(raw: dict) -> dict:
    return {
        "code": raw["stock_cd"],          # 종목코드
        "name": raw["corp_name"],          # 회사명
        "exec": raw["repror"],             # 보고자명
        "report_nm": raw["report_nm"],     # 보고서명
        "shares": int(raw["trmend_posesn_stock_co"]),  # 보유 주식수
        "price": calc_avg_price(raw),      # 평균 단가 (계산)
        "amount_eok": round(int(raw["trmend_posesn_stock_co"]) * calc_avg_price(raw) / 1e8, 1),
        "hold_rate": float(raw["trmend_posesn_stock_qota_rt"]),  # 지분율
        "hold_rate_delta": float(raw["trmend_posesn_stock_qota_rt"]) - float(raw["bfbss_posesn_stock_qota_rt"]),
        "time": raw["rcept_dt"],           # 접수일
        "trade_first": raw["trd_de"][:8] if raw.get("trd_de") else raw["rcept_dt"],
        "trade_last": raw["rcept_dt"],
        "rcept_no": raw["rcept_no"],
        "dart_url": build_dart_url(raw["rcept_no"]),
        "cap_ratio_pct": None,  # 시가총액 대비 (KIS에서 시가총액 조회 후 계산)
    }
```

---

### 3-3. SEC EDGAR 연동

**Form4 수집 (임원 거래):**
```python
# SEC EDGAR RSS 피드 또는 API
SEC_FORM4_RSS = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&dateb=&owner=include&count=40&search_text=&output=atom"

# 또는 EDGAR XBRL API
SEC_EDGAR_API = "https://efts.sec.gov/LATEST/search-index?q=%22form+4%22&dateRange=custom&startdt=2026-07-01"

def parse_form4(filing_url: str) -> dict:
    # XML 파싱
    import xml.etree.ElementTree as ET
    r = requests.get(filing_url, headers={"User-Agent": "nabakai research@nabakai.com"})
    root = ET.fromstring(r.content)
    return {
        "ticker": root.find(".//issuerTradingSymbol").text,
        "company": root.find(".//issuerName").text,
        "owner": root.find(".//rptOwnerName").text,
        "title": root.find(".//officerTitle").text,
        "action": "BUY" if int(root.find(".//transactionShares/value").text) > 0 else "SELL",
        "shares": abs(int(root.find(".//transactionShares/value").text)),
        "price": float(root.find(".//transactionPricePerShare/value").text or 0),
        "date": root.find(".//transactionDate/value").text,
    }
```

**13F 수집 (기관 포트폴리오):**
```python
# SEC EDGAR 13F 검색
EDGAR_SEARCH = "https://efts.sec.gov/LATEST/search-index?q=%2213F%22&dateRange=custom&startdt=2026-04-01&enddt=2026-05-15&forms=13F-HR"

# 특정 기관 CIK 매핑 (예시)
GURU_CIK_MAP = {
    "buffett": "0001067983",    # Berkshire Hathaway
    "ark": "0001616459",        # ARK Investment Management
    "dalio": "0001350694",      # Bridgewater Associates
    "burry": "0001649339",      # Scion Asset Management
    "ackman": "0001336528",     # Pershing Square Capital
}

def get_guru_portfolio(cik: str) -> list:
    url = f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"
    r = requests.get(url, headers={"User-Agent": "nabakai research@nabakai.com"})
    filings = r.json()
    # 최근 13F-HR 파일링 찾기
    for i, form in enumerate(filings["filings"]["recent"]["form"]):
        if form == "13F-HR":
            accession = filings["filings"]["recent"]["accessionNumber"][i].replace("-", "")
            return fetch_13f_holdings(cik, accession)
```

---

### 3-4. 글로벌 시장 데이터 연동

**선물/지수 (Yahoo Finance 또는 직접 거래소 API 추정):**
```python
import yfinance as yf

# _ticker 필드 기반 매핑
TICKER_MAP = {
    "NDX": "NQ=F",     # 나스닥 선물
    "SPX": "ES=F",     # S&P 선물
    "DJI": "YM=F",     # 다우 선물
    "NIKKEI": "^N225",
    "ASX": "^AXJO",
    "VIX": "^VIX",
    "GOLD": "GC=F",
    "KOSPI": "^KS11",
    "KOSDAQ": "^KQ11",
    "USDT_KRW": "KRW=X",
}

def get_global_market():
    result = {}
    for key, ticker in TICKER_MAP.items():
        t = yf.Ticker(ticker)
        hist = t.fast_info
        result[key] = {
            "sym": key,
            "price": hist.last_price,
            "pct": (hist.last_price - hist.previous_close) / hist.previous_close * 100,
            "_ticker": ticker,
            "_source": "primary",
        }
    return result
```

**암호화폐 (Binance REST API):**
```python
BINANCE_BASE = "https://api.binance.com/api/v3"

def get_crypto_prices():
    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
    r = requests.get(f"{BINANCE_BASE}/ticker/24hr", params={"symbols": str(symbols)})
    return [{
        "sym": item["symbol"].replace("USDT", ""),
        "price": float(item["lastPrice"]),
        "pct": float(item["priceChangePercent"]),
        "_source": "primary",
    } for item in r.json()]
```

---

## 4. API 연동 구현 상세

### flow.json 빌더 (전체 조립)

```python
import asyncio
from datetime import datetime, timezone

async def build_flow_json() -> dict:
    """30초마다 실행되는 flow.json 빌더"""

    # 병렬 데이터 수집
    tasks = await asyncio.gather(
        get_kospi_realtime(),
        get_kosdaq_realtime(),
        get_insider_buys(),         # DART
        get_short_squeeze_data(),   # KRX
        get_supply_anomaly(),       # KIS
        get_technicals(),           # KIS 일봉 계산
        get_global_market(),        # Yahoo/Binance
        get_us_market(),            # 선물 데이터
        get_us_kis_rank_with_fallback(),
        get_us_owner(),             # SEC Form4 + 13F
        get_news(),                 # 텔레그램 + AI 생성
        generate_ai_commentary(),   # LLM 호출
        return_exceptions=True
    )

    (kospi, kosdaq, insider, short, supply, tech,
     global_mkt, us_mkt, us_rank, us_owner, news, ai_cmnt) = tasks

    meta = {
        "insider_buys": "live" if not isinstance(insider, Exception) else "stale",
        "short_squeeze": "live" if not isinstance(short, Exception) else "stale",
        "global_market": "live" if not isinstance(global_mkt, Exception) else "stale",
        "hero": "live",
        "ai_commentary": "live" if not isinstance(ai_cmnt, Exception) else "stale",
        "supply_anomaly": "live" if not isinstance(supply, Exception) else "stale",
        "theme_flow": "stale",  # 별도 스케줄
        "monday_forecast": "demo",
    }

    return {
        "ts": datetime.now(timezone.utc).isoformat(),
        "session": detect_session(),
        "session_phase": get_session_phase(),
        "hero": build_hero(kospi, kosdaq, insider, short),
        "news": news,
        "ai_commentary": ai_cmnt,
        "insider_buys": insider,
        "short_squeeze": short,
        "supply_anomaly": supply,
        "technicals": tech,
        "global_market": global_mkt,
        "us_market": us_mkt,
        "us_kis_rank": us_rank,
        "us_owner": us_owner,
        "_meta": meta,
        "_status": "live",
    }
```

### 세션 감지 로직

```python
import pytz
from datetime import time as dtime

KST = pytz.timezone("Asia/Seoul")

def detect_session() -> str:
    now = datetime.now(KST)
    t = now.time()
    weekday = now.weekday()  # 0=월 ~ 6=일

    if weekday >= 5:  # 주말
        return "WEEKEND"
    if dtime(8, 30) <= t < dtime(9, 0):
        return "PRE"
    if dtime(9, 0) <= t < dtime(15, 30):
        return "OPEN"
    if dtime(15, 30) <= t < dtime(16, 0):
        return "CLOSING"
    if dtime(16, 0) <= t < dtime(18, 0):
        return "POST"
    return "CLOSED"

def get_session_phase() -> dict:
    now_kst = datetime.now(KST)
    now_et = datetime.now(pytz.timezone("America/New_York"))
    session = detect_session()

    us_market_hours = dtime(9, 30) <= now_et.time() <= dtime(16, 0) and now_et.weekday() < 5

    return {
        "phase": session.lower(),
        "label": SESSION_LABELS[session],
        "weekday": now_kst.weekday(),
        "hour": now_kst.hour,
        "us_open": us_market_hours,
        "et_hm": now_et.strftime("%H:%M"),
        "dst": bool(now_et.dst()),
    }
```

---

## 5. 내부 계산 로직 구현

### 5-1. 나박지수 계산

```python
import numpy as np
from scipy.stats import rankdata

def calc_nabak_score(universe: list[dict]) -> list[dict]:
    """
    5개 축 합산 → 0~100 정규화
    절대 임계값 아님 — 당일 리스트 내 순위 기반
    """
    n = len(universe)
    scores = np.zeros((n, 5))

    for i, stock in enumerate(universe):
        # 축 1: 외국인 순매수 (KIS)
        scores[i, 0] = clip_score(stock.get("frgn_net_buy_eok", 0))
        # 축 2: 기관 순매수 (KIS)
        scores[i, 1] = clip_score(stock.get("inst_net_buy_eok", 0))
        # 축 3: 오너·임원 매수 (DART 당일 공시)
        scores[i, 2] = 2 if stock.get("has_insider_buy") else (
                       -2 if stock.get("has_insider_sell") else 0)
        # 축 4: 공매도 비중 역수 (KRX) — 낮을수록 좋음
        short_ratio = stock.get("short_ratio", 5.0)
        scores[i, 3] = -2 if short_ratio > 10 else (
                        2 if short_ratio < 1 else 0)
        # 축 5: 테마 자금 유입 (KIS 테마 순매수)
        scores[i, 4] = clip_score(stock.get("theme_net_buy_eok", 0))

    raw_total = scores.sum(axis=1)

    # 순위 기반 0~100 정규화
    ranks = rankdata(raw_total, method="average")
    normalized = (ranks - 1) / (n - 1) * 100 if n > 1 else np.array([50.0] * n)

    for i, stock in enumerate(universe):
        stock["nabak_score"] = round(float(normalized[i]), 1)

    return universe

def clip_score(value: float, threshold: float = 50) -> float:
    """억원 단위 순매수를 -2~+2 점수로 변환"""
    if value > threshold: return 2
    if value > 0: return 1
    if value == 0: return 0
    if value > -threshold: return -1
    return -2
```

### 5-2. 기술적 신호 스캐너

```python
import pandas as pd
import numpy as np

def calc_technicals(ohlcv_map: dict[str, pd.DataFrame]) -> dict:
    """
    ohlcv_map: {stock_code: DataFrame with columns [date, open, high, low, close, volume]}
    """
    golden_day = []
    golden_soon = []
    golden_week = []
    cci_oversold = []
    high_52w = []
    above_w20 = []

    for code, df in ohlcv_map.items():
        if len(df) < 20:
            continue

        df = df.sort_values("date").reset_index(drop=True)
        close = df["close"]
        name = df["name"].iloc[-1] if "name" in df.columns else code
        price = close.iloc[-1]
        pct = (price - close.iloc[-2]) / close.iloc[-2] * 100

        # 이동평균
        ma5  = close.rolling(5).mean()
        ma20 = close.rolling(20).mean()

        # 골든크로스 감지
        gap_pct = (ma5.iloc[-1] - ma20.iloc[-1]) / ma20.iloc[-1] * 100
        prev_gap = (ma5.iloc[-2] - ma20.iloc[-2]) / ma20.iloc[-2] * 100

        if gap_pct > 0 and prev_gap <= 0:  # 오늘 교차 완성
            golden_day.append({"code": code, "name": name, "price": price,
                                "pct": round(pct, 2), "gap_pct": round(gap_pct, 2),
                                "value_eok": round(df["volume"].iloc[-1] * price / 1e8, 1)})
        elif -1 <= gap_pct <= 0:  # 임박
            golden_soon.append({"code": code, "name": name, "price": price,
                                 "pct": round(pct, 2), "gap_pct": round(gap_pct, 2),
                                 "value_eok": round(df["volume"].iloc[-1] * price / 1e8, 1)})

        # CCI 계산
        cci = calc_cci(df, period=14)
        if cci <= -100:
            cci_oversold.append({"code": code, "name": name, "price": price,
                                  "pct": round(pct, 2), "cci": round(cci, 0),
                                  "value_eok": round(df["volume"].iloc[-1] * price / 1e8, 1)})

        # 52주 신고가
        high_52 = close.tail(252).max()
        from_high = (price - high_52) / high_52 * 100
        if from_high >= -1.0:
            high_52w.append({"code": code, "name": name, "price": price,
                              "pct": round(pct, 2), "from_high": round(from_high, 2)})

    return {
        "golden_day": sorted(golden_day, key=lambda x: x["value_eok"], reverse=True),
        "golden_soon": sorted(golden_soon, key=lambda x: abs(x["gap_pct"])),
        "golden_week": golden_week,
        "cci_oversold": sorted(cci_oversold, key=lambda x: x["cci"]),
        "high_52w": high_52w,
        "above_w20": above_w20,
        "_status": "live",
    }

def calc_cci(df: pd.DataFrame, period: int = 14) -> float:
    tp = (df["high"] + df["low"] + df["close"]) / 3
    sma = tp.rolling(period).mean()
    mad = tp.rolling(period).apply(lambda x: np.mean(np.abs(x - x.mean())))
    cci = (tp - sma) / (0.015 * mad)
    return float(cci.iloc[-1])
```

### 5-3. 공매도 스퀴즈 감지

```python
def detect_short_squeeze(short_data: list[dict], price_data: dict) -> list[dict]:
    """
    short_data: KRX 공매도 비중 데이터
    price_data: 종목별 5일 주가 변화
    """
    result = []
    for item in short_data:
        code = item["code"]
        current_ratio = item["short_ratio_today"]
        prev_ratio = item["short_ratio_5d_ago"]
        short_change_pct = (current_ratio - prev_ratio) / prev_ratio * 100 if prev_ratio else 0
        price_pct = price_data.get(code, {}).get("pct_5d", 0)

        # 스퀴즈 조건: 공매도 비중 감소 + 주가 상승
        squeeze = short_change_pct < -5 and price_pct > 0 and current_ratio > 3

        result.append({
            "code": code,
            "name": item["name"],
            "short_change_pct": round(short_change_pct, 1),
            "price_pct": round(price_pct, 2),
            "short_ratio": round(current_ratio, 2),
            "squeeze": squeeze,
            "note": "숏커버 반등" if squeeze else ("공매도 증가" if short_change_pct > 0 else "공매도 감소"),
            "hist_change_pct": round(short_change_pct, 1),
            "hist_trend": "up" if short_change_pct > 0 else "down",
            "hist_days": item.get("trend_days", 5),
        })
    return sorted(result, key=lambda x: abs(x["short_change_pct"]), reverse=True)
```

### 5-4. 프렉탈 유사 패턴 검색

```python
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def find_fractal_similar(
    current_vector: np.ndarray,
    history_db: list[dict],
    top_k: int = 10
) -> list[dict]:
    """
    current_vector: 오늘 종목의 [수급, 과열, 추세, 테마] 특성 벡터
    history_db: 과거 3년 날짜별 벡터 기록
    top_k: 유사 구간 상위 K개
    """
    hist_vectors = np.array([h["vector"] for h in history_db])
    similarities = cosine_similarity([current_vector], hist_vectors)[0]

    top_indices = similarities.argsort()[-top_k:][::-1]

    results = []
    for idx in top_indices:
        h = history_db[idx]
        # 해당 시점 이후 15거래일(3주) 실제 수익률
        future_returns = h.get("future_15d_returns", [])
        results.append({
            "date": h["date"],
            "similarity": round(float(similarities[idx]), 3),
            "avg_return_15d": round(np.mean(future_returns), 2) if future_returns else None,
            "win_rate": round(np.mean([r > 0 for r in future_returns]), 2) if future_returns else None,
            "n_cases": len(future_returns),
        })

    return results
```

### 5-5. 장세 나침반 6축 계산

```python
def calc_market_compass(data: dict) -> dict:
    """
    6개 축 각 0~100 → 가중 평균으로 종합 점수 산출
    """
    scores = {}

    # 축 1: 추세 (이동평균 배열) — KIS
    kospi_above_ma20 = data["kospi_price"] > data["kospi_ma20"]
    kospi_above_ma60 = data["kospi_price"] > data["kospi_ma60"]
    scores["trend"] = (50
        + (20 if kospi_above_ma20 else -20)
        + (20 if kospi_above_ma60 else -20)
        + data.get("ma_alignment_bonus", 0))

    # 축 2: 시장폭 (상승 종목 / 전체 종목) — KRX
    advance_ratio = data["advance_count"] / max(data["total_count"], 1)
    scores["breadth"] = advance_ratio * 100

    # 축 3: 심리 (공포탐욕 합성) — 자체 계산
    scores["sentiment"] = data.get("fear_greed_score", 50)

    # 축 4: 신용·과열 (RSI 반전 + 신용잔고 역수)
    rsi = data.get("kospi_rsi14", 50)
    credit_ratio = data.get("credit_to_market_ratio", 1.0)
    scores["credit"] = max(0, min(100,
        50 - (rsi - 50) * 0.5          # RSI 과열 = 감점
        - (credit_ratio - 1.0) * 20    # 신용 과열 = 감점
    ))

    # 축 5: 수급 (외인+기관 방향) — KIS
    frgn_net = data.get("frgn_net_5d", 0)
    inst_net = data.get("inst_net_5d", 0)
    scores["supply"] = min(100, max(0, 50 + (frgn_net + inst_net) / 1e11 * 50))

    # 축 6: 거시 (미국 지수 + VIX 역수) — 선물 데이터
    vix = data.get("vix", 20)
    spx_pct = data.get("spx_5d_pct", 0)
    scores["macro"] = min(100, max(0,
        50 + spx_pct * 5 - (vix - 20) * 1.5
    ))

    WEIGHTS = {"trend": 0.25, "breadth": 0.20, "sentiment": 0.15,
               "credit": 0.15, "supply": 0.15, "macro": 0.10}

    total = sum(scores[k] * WEIGHTS[k] for k in scores)

    verdict = ("강세" if total >= 70 else
               "견조" if total >= 55 else
               "보통" if total >= 45 else
               "주의" if total >= 30 else "약세")

    return {
        "score": round(total),
        "verdict": verdict,
        "axes": {k: round(v) for k, v in scores.items()},
    }
```

---

## 6. 프론트엔드 구현

### 6-1. 30초 polling 패턴

```typescript
// hooks/useFlowData.ts
import { useState, useEffect, useRef } from 'react'

interface FlowData { /* flow.json 타입 */ }

export function useFlowData(intervalMs = 30_000) {
  const [data, setData] = useState<FlowData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  async function fetchFlow() {
    const res = await fetch('/flow.json', {
      cache: 'no-store',           // 브라우저 캐시 우회
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!res.ok) return
    const json: FlowData = await res.json()
    setData(json)
    setLastUpdated(new Date())
  }

  useEffect(() => {
    fetchFlow()                    // 최초 즉시 실행
    timerRef.current = setInterval(fetchFlow, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [intervalMs])

  return { data, lastUpdated }
}
```

### 6-2. 탭 인터페이스 구조

```typescript
// pages/Dashboard.tsx
const TABS = [
  { id: 'overview',  label: '한눈에' },
  { id: 'theme',     label: '테마' },
  { id: 'ailab',     label: 'AI 랩' },
  { id: 'more',      label: '더보기' },
] as const

type TabId = typeof TABS[number]['id']

function Dashboard() {
  const { data } = useFlowData()
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div>
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'overview' && <OverviewTab data={data} />}
      {activeTab === 'theme'    && <ThemeTab data={data} />}
      {activeTab === 'ailab'    && <AiLabTab data={data} />}
      {activeTab === 'more'     && <MoreTab data={data} />}
    </div>
  )
}
```

### 6-3. 나박지수 게이지 컴포넌트

```typescript
// components/NabakScore.tsx
function NabakScore({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e'   // 초록
              : score >= 50 ? '#eab308'   // 노랑
              : score >= 30 ? '#f97316'   // 주황
              : '#ef4444'                  // 빨강

  const label = score >= 70 ? '강세' : score >= 50 ? '중립' : score >= 30 ? '주의' : '약세'

  return (
    <div className="score-gauge">
      <svg viewBox="0 0 100 60">
        {/* 배경 아크 */}
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#374151" strokeWidth="8" />
        {/* 점수 아크 */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${score * 1.257} 125.7`}
        />
      </svg>
      <span className="score-value" style={{ color }}>{score}</span>
      <span className="score-label">{label}</span>
    </div>
  )
}
```

### 6-4. 세션 배지 컴포넌트

```typescript
// components/SessionBadge.tsx
const SESSION_CONFIG = {
  OPEN:    { label: '장 중',     color: '#22c55e', blink: true },
  PRE:     { label: '장전',      color: '#eab308', blink: false },
  CLOSING: { label: '마감 호가', color: '#f97316', blink: true },
  POST:    { label: '시간외',    color: '#6b7280', blink: false },
  CLOSED:  { label: '장마감',    color: '#6b7280', blink: false },
  WEEKEND: { label: '주말',      color: '#6b7280', blink: false },
}

function SessionBadge({ phase }: { phase: string }) {
  const cfg = SESSION_CONFIG[phase.toUpperCase()] ?? SESSION_CONFIG.CLOSED
  return (
    <span className={`session-badge ${cfg.blink ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: cfg.color }}>
      {cfg.label}
    </span>
  )
}
```

### 6-5. 다크모드 토글

```typescript
// hooks/useDarkMode.ts
export function useDarkMode() {
  const [dark, setDark] = useState(() =>
    localStorage.getItem('theme') === 'dark' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
```

---

## 7. 서비스워커 & PWA 구현

### 7-1. 서비스워커 (`sw.js`) 구현 패턴

```javascript
const CACHE_NAME = 'nb-static-v1'
const MAX_ENTRIES = 300

function classify(url) {
  const path = new URL(url).pathname

  // 절대 캐시 안 함
  if (path === '/sw.js') return null
  if (path.startsWith('/api/')) return null
  if (path === '/flow.json') return null
  if (['/', '/insight', '/battle', '/whale', '/stock']
      .some(p => path === p || path.startsWith(p + '/'))) return null

  const href = url.toString()
  // 버전 해시 정적 자산 — 영구 캐시
  if (/\.(js|css)\?v=/.test(href)) return 'immutable'
  // 이미지·폰트 — Stale-While-Revalidate
  if (/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(href)) return 'swr'

  return null
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  if (new URL(event.request.url).origin !== location.origin) return

  const strategy = classify(event.request.url)
  if (!strategy) return  // 캐시 없이 네트워크 직접

  if (strategy === 'immutable') {
    event.respondWith(cacheFirst(event.request))
  } else if (strategy === 'swr') {
    event.respondWith(staleWhileRevalidate(event.request))
  }
})

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(req)
  if (cached) return cached
  const fresh = await fetch(req)
  await cache.put(req, fresh.clone())
  await trim(cache)
  return fresh
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(req)
  const fetchPromise = fetch(req).then(async res => {
    await cache.put(req, res.clone())
    await trim(cache)
    return res
  })
  return cached ?? fetchPromise
}

async function trim(cache) {
  const keys = await cache.keys()
  if (keys.length > MAX_ENTRIES) {
    await cache.delete(keys[0])  // LRU 제거
  }
}

// 이전 버전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k.startsWith('nb-static-') && k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    )
  )
})

// Push 알림 수신
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? '나박AI', {
      body: data.body,
      icon: data.icon ?? '/icons/icon-192.png',
      badge: data.badge ?? '/icons/badge-72.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const target = event.notification.data.url
      for (const client of list) {
        if (client.url === target && 'focus' in client) return client.focus()
      }
      return clients.openWindow(target)
    })
  )
})
```

### 7-2. manifest.json 구조

```json
{
  "name": "나박AI 국장 분석",
  "short_name": "나박AI",
  "description": "외국인·기관·오너·공매도를 한 화면에서. 30초마다 자동 갱신되는 한국 증시 수급 대시보드",
  "lang": "ko-KR",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0c",
  "theme_color": "#18181b",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-192-mask.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-512-mask.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "한눈에 대시보드", "url": "/?tab=overview",  "description": "주요 지표, 픽, 배당주" },
    { "name": "시그널 라이브",   "url": "/?tab=signals",  "description": "당일 발생한 모든 시그널" }
  ],
  "categories": ["finance", "business", "productivity"]
}
```

---

## 8. AI 콘텐츠 생성 파이프라인

### 8-1. 시황 해설 (ai_commentary) 생성

```python
from anthropic import Anthropic  # 또는 openai

client = Anthropic()

def generate_ai_commentary(flow_data: dict) -> str:
    # 핵심 데이터 추출
    insider_top3 = flow_data["insider_buys"][:3]
    supply_top3 = flow_data["supply_anomaly"][:3]
    hero = flow_data["hero"]

    prompt = f"""
다음 한국 증시 수급 데이터를 바탕으로 오늘의 시황을 2~3문장으로 요약해줘.
전문적이되 읽기 쉽게, 투자 추천 없이 사실만 기술해.

코스피: {hero['kospi_value']} ({hero['kospi_pct']:+.2f}%)
코스닥: {hero['kosdaq_value']} ({hero['kosdaq_pct']:+.2f}%)
외국인 보유율: {hero['frgn_jowon']}%

주요 공시:
{chr(10).join(f"- {i['name']} {i['exec']} {i['amount_eok']}억원 {'매수' if i.get('kind') == 'buy' else '매도'}" for i in insider_top3)}

수급 이상:
{chr(10).join(f"- {s['name']} {s['main']} {'+' if s['kind']=='buy' else '-'}{s['today_eok']}억원 (평소대비 {s['ratio']:.1f}배)" for s in supply_top3)}
"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",   # 빠르고 저렴한 모델
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
```

### 8-2. AI 미국 리포트 생성 (일 1회)

```python
def generate_us_report(stock_data: dict, macro_data: dict) -> str:
    prompt = f"""
미국 주식 {stock_data['ticker']} ({stock_data['company']})에 대한 당일 분석 리포트를 작성해줘.

기술 지표:
- 종가: ${stock_data['price']}
- SPY 대비 상대강도: {stock_data['relative_strength']:+.1f}%p
- 저항: ${stock_data['resistance']} (돌파 필요: {stock_data['to_resistance_pct']:+.2f}%)
- 손절선: ${stock_data['stop_loss']} (MA20 기준)
- 거래량: 평소 대비 {stock_data['volume_ratio']:.2f}배
- RSI: {stock_data['rsi']:.1f}
- P/E: {stock_data['pe']:.2f}

매크로:
- 장단기 스프레드: {macro_data['spread']:+.2f}%p
- VIX: {macro_data['vix']:.1f}
- CPI YoY: {macro_data['cpi_yoy']:.1f}%

선정 점수: {stock_data['score']:.1f}/100

선정 이유 4가지를 번호 붙여 작성. 투자 추천 없이 사실 기반으로.
"""
    # Claude Sonnet으로 상세 리포트
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
```

---

## 9. 프리렌더 시스템

### 9-1. 종목 페이지 빌더

```python
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader("templates"))

def build_stock_page(code: str, data: dict):
    template = env.get_template("stock.html.j2")
    html = template.render(
        code=code,
        name=data["name"],
        nabak_score=data["nabak_score"],
        rsi=data["rsi"],
        trend=data["trend"],
        high_52w_pos=data["high_52w_pos"],
        momentum_1m=data["momentum_1m"],
        per=data["per"],
        pbr=data["pbr"],
        dividend_yield=data["dividend_yield"],
        financials=data["financials"],  # 분기별 재무
        news=data["news"][:5],
        whale_holdings=data["whale_holdings"][:5],
        related_stocks=data["related_stocks"][:6],
        ai_summary=data["ai_summary"],
        updated_at=datetime.now(KST).strftime("%Y년 %m월 %d일"),
    )
    path = f"dist/prerender/stock/{code}.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
```

### 9-2. 고래 페이지 빌더

```python
def build_whale_pages(gurus: list[dict]):
    template = env.get_template("whale.html.j2")
    for guru in gurus:
        html = template.render(
            guru_id=guru["guru_id"],
            name=guru["name"],
            total_aum=format_aum(guru["total_aum"]),
            filed=guru["filed"],
            holdings=guru["top10"],
            disclaimer=DISCLAIMER_TEXT,
        )
        path = f"dist/prerender/whale/{guru['guru_id']}.html"
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
```

---

## 10. 알림 & 커뮤니티 시스템

### 텔레그램 연동

```python
import telegram  # python-telegram-bot

TELEGRAM_TOKEN = "BOT_TOKEN"
CHANNEL_ID = "@coinaiai_report"

bot = telegram.Bot(token=TELEGRAM_TOKEN)

async def publish_news_brief(brief: str, category: str):
    """뉴스 브리핑 텔레그램 발행"""
    message = await bot.send_message(
        chat_id=CHANNEL_ID,
        text=brief,
        parse_mode="HTML",
        disable_web_page_preview=True
    )
    # flow.json 뉴스에 msg_id 저장
    return {
        "source": "NabakAI",
        "url": f"https://t.me/{CHANNEL_ID.lstrip('@')}/{message.message_id}",
        "msg_id": message.message_id,
        "title": brief[:60],
        "time": datetime.now().strftime("%H:%M"),
    }

async def publish_battle_result(date: str, ai_pred: str, actual: str):
    """배틀 결과 발행"""
    hit = (ai_pred[0] == actual[0])  # 방향 일치 여부
    text = f"📊 {date} 코스피 예측\n AI: {ai_pred} | 실제: {actual}\n {'✅ 적중' if hit else '❌ 빗나감'}"
    await bot.send_message(chat_id=CHANNEL_ID, text=text)
```

---

## 11. 규제 컴플라이언스 구현

### 법적 경고문 강제 삽입

```typescript
// constants/disclaimer.ts
export const DISCLAIMER = {
  short: "정보 제공용이며 매수·매도 추천이 아닙니다.",
  full: `본 서비스는 나박AI(nabakai.com)가 공개 시장 데이터를 정리한 정보 제공용 자료이며,
특정 종목의 매수·매도 권유나 투자 자문이 아닙니다.
나박AI는 투자자문업자·투자일임업자가 아닙니다.
표시되는 정보의 정확성·완전성을 보증하지 않으며,
이용자의 투자 판단·결과에 대한 책임은 전적으로 이용자 본인에게 있습니다.`,
  krx_note: "KRX 공식 데이터 기준 (30분 캐시, 지연 가능)",
  dart_note: "DART 공시 기준 · 지연·누락 가능",
}

// 모든 섹션 하단에 자동 삽입
function SectionWrapper({ children, source }: { children: React.ReactNode; source?: string }) {
  return (
    <section>
      {children}
      <p className="disclaimer-text text-xs text-gray-400 mt-2">
        {DISCLAIMER.short}
        {source && ` · 출처: ${source}`}
      </p>
    </section>
  )
}
```

---

## 12. 배포 & 인프라 추정

```
┌─────────────────────────────────────────┐
│            배포 아키텍처                │
├────────────────┬────────────────────────┤
│ 정적 자산      │ Cloudflare Pages       │
│ (SPA 빌드)     │ - dist/ 폴더 자동 배포 │
│                │ - CDN 캐시 적용        │
├────────────────┼────────────────────────┤
│ flow.json      │ VPS 백엔드 서버        │
│ (동적 데이터)  │ - Python 봇 상주       │
│                │ - 30초 재생성          │
│                │ - Nginx 서빙           │
├────────────────┼────────────────────────┤
│ prerender/     │ 빌드 시 또는           │
│ *.html         │ 일 1회 재생성 후       │
│                │ Cloudflare Pages 배포  │
├────────────────┼────────────────────────┤
│ 텔레그램 봇    │ VPS 동일 서버          │
│                │ - 뉴스 자동 발행       │
│                │ - 배틀 결과 발행       │
└────────────────┴────────────────────────┘
```

---

## 13. 구현 재현 로드맵

### Phase 1 — 데이터 파이프라인 (4~6주)

```
Week 1-2: KIS API 연동
  □ OAuth 토큰 발급 자동화
  □ 코스피/코스닥 실시간 수집
  □ 투자자별 순매수 수집
  □ flow.json 기본 구조 생성

Week 3: DART + KRX 연동
  □ DART 임원 공시 수집
  □ KRX 공매도 데이터 수집
  □ 신용융자 잔고 수집

Week 4: 글로벌 데이터 연동
  □ Yahoo Finance 지수/선물
  □ Binance 암호화폐
  □ SEC Form4/13F 파싱

Week 5-6: 계산 엔진
  □ 나박지수 구현
  □ 기술 신호 스캐너 (골든크로스, CCI)
  □ 공매도 스퀴즈 감지
  □ 장세 나침반 6축
```

### Phase 2 — 프론트엔드 (4~6주)

```
Week 7-8: 기본 SPA 구조
  □ Vite + React + TypeScript 셋업
  □ Tailwind CSS 다크모드
  □ 4탭 레이아웃
  □ flow.json 30초 polling 훅

Week 9-10: 핵심 컴포넌트
  □ 나박지수 게이지
  □ 장세 나침반 방사형 차트
  □ 수급 테이블 (정렬/탭)
  □ 기술 신호 카드

Week 11-12: PWA + 고래 페이지
  □ 서비스워커 구현
  □ manifest.json + 아이콘
  □ 프리렌더 빌드 스크립트
  □ 고래 페이지 250개+ 자동 생성
```

### Phase 3 — AI + 검증 시스템 (3~4주)

```
Week 13-14: AI 파이프라인
  □ LLM API 연동 (시황 해설)
  □ 일일 리포트 자동 생성
  □ Battle 예측 AI 모델

Week 15-16: 프렉탈 + 검증
  □ 과거 3년 데이터 수집
  □ 벡터화 + 유사도 검색
  □ results 페이지 자동 업데이트
  □ OOS 백테스트 파이프라인
```
