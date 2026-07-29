import type { StockStatus, StockStyle } from "@/lib/types/userData";

export const ACCOUNT_LIST = [
  "토스증권",
  "카카오페이증권",
  "키움증권",
  "미래에셋증권",
  "삼성증권",
  "NH투자증권",
  "KB증권",
  "신한투자증권",
  "한화투자증권",
  "대신증권",
  "하나증권",
  "유안타증권",
  "기타",
] as const;

export const STATUS_LABEL: Record<StockStatus, string> = {
  buy: "매수",
  hold: "보유",
  watch: "관심",
};

export const STYLE_LABEL: Record<StockStyle, string> = {
  "": "미설정",
  short: "단타",
  long: "장타",
};

const ACCOUNT_COLOR: Record<string, { bg: string; c: string }> = {
  토스증권: { bg: "var(--color-info-bg)", c: "var(--color-info)" },
  카카오페이증권: { bg: "var(--color-broker-kakao-bg)", c: "var(--color-broker-kakao-text)" },
  키움증권: { bg: "var(--color-error-bg)", c: "var(--color-error-text)" },
  미래에셋증권: { bg: "var(--color-broker-mirae-bg)", c: "var(--color-broker-mirae-text)" },
  삼성증권: { bg: "var(--color-info-border)", c: "var(--color-info-text)" },
  NH투자증권: { bg: "var(--color-success-bg)", c: "var(--color-success-text)" },
  KB증권: { bg: "var(--color-warning-bg)", c: "var(--color-warning-text)" },
  신한투자증권: { bg: "var(--color-broker-shinhan-bg)", c: "var(--color-info-deep)" },
  한화투자증권: { bg: "var(--color-broker-hanhwa-bg)", c: "var(--color-broker-hanhwa-text)" },
  대신증권: { bg: "var(--color-broker-daesin-bg)", c: "var(--color-broker-daesin-text)" },
  하나증권: { bg: "var(--color-success-bg-soft)", c: "var(--color-success-deep)" },
  유안타증권: { bg: "var(--color-accent-bg)", c: "var(--color-accent)" },
  기타: { bg: "var(--color-bg-badge)", c: "var(--color-text-secondary-alt)" },
};

export function acctColor(acct: string) {
  return ACCOUNT_COLOR[acct] || ACCOUNT_COLOR["기타"];
}

const KR_TICKER_MAP: Record<string, string> = {
  삼성전자: "005930.KS",
  삼성전자우: "005935.KS",
  sk하이닉스: "000660.KS",
  "SK하이닉스": "000660.KS",
  lg에너지솔루션: "373220.KS",
  "LG에너지솔루션": "373220.KS",
  삼성바이오로직스: "207940.KS",
  현대차: "005380.KS",
  현대자동차: "005380.KS",
  기아: "000270.KS",
  기아차: "000270.KS",
  셀트리온: "068270.KS",
  "POSCO홀딩스": "005490.KS",
  포스코홀딩스: "005490.KS",
  포스코: "005490.KS",
  "LG화학": "051910.KS",
  lg화학: "051910.KS",
  삼성SDI: "006400.KS",
  삼성sdi: "006400.KS",
  KB금융: "105560.KS",
  kb금융: "105560.KS",
  신한지주: "055550.KS",
  하나금융지주: "086790.KS",
  카카오: "035720.KS",
  카카오뱅크: "323410.KS",
  카카오페이: "377300.KS",
  네이버: "035420.KS",
  NAVER: "035420.KS",
  "LG전자": "066570.KS",
  lg전자: "066570.KS",
  현대모비스: "012330.KS",
  삼성물산: "028260.KS",
  한국전력: "015760.KS",
  KT: "030200.KS",
  kt: "030200.KS",
  SK텔레콤: "017670.KS",
  sk텔레콤: "017670.KS",
  "LG디스플레이": "034220.KS",
  SK이노베이션: "096770.KS",
  두산에너빌리티: "034020.KS",
  한화에어로스페이스: "012450.KS",
  크래프톤: "259960.KS",
  엔씨소프트: "036570.KS",
  넷마블: "251270.KS",
  카카오게임즈: "293490.KS",
  펄어비스: "263750.KS",
  삼성전기: "009150.KS",
  SK스퀘어: "402340.KS",
  현대건설: "000720.KS",
  GS건설: "006360.KS",
  롯데케미칼: "011170.KS",
  금호석유: "011780.KS",
  아모레퍼시픽: "090430.KS",
  "LG생활건강": "051900.KS",
  코스맥스: "192820.KS",
  한미약품: "128940.KS",
  유한양행: "000100.KS",
  녹십자: "006280.KS",
};

const US_TICKER_MAP: Record<string, string> = {
  엔비디아: "NVDA",
  nvidia: "NVDA",
  NVIDIA: "NVDA",
  애플: "AAPL",
  apple: "AAPL",
  마이크로소프트: "MSFT",
  microsoft: "MSFT",
  구글: "GOOGL",
  알파벳: "GOOGL",
  google: "GOOGL",
  아마존: "AMZN",
  amazon: "AMZN",
  메타: "META",
  meta: "META",
  페이스북: "META",
  테슬라: "TSLA",
  tesla: "TSLA",
  AMD: "AMD",
  amd: "AMD",
  TSMC: "TSM",
  tsmc: "TSM",
  브로드컴: "AVGO",
  broadcom: "AVGO",
  퀄컴: "QCOM",
  qualcomm: "QCOM",
  인텔: "INTC",
  intel: "INTC",
  넷플릭스: "NFLX",
  netflix: "NFLX",
  팔란티어: "PLTR",
  palantir: "PLTR",
  코인베이스: "COIN",
  coinbase: "COIN",
  마이크론: "MU",
  micron: "MU",
  "JP모건": "JPM",
  jpmorgan: "JPM",
  골드만삭스: "GS",
  goldman: "GS",
  버크셔해서웨이: "BRK-B",
  존슨앤존슨: "JNJ",
  비자: "V",
  visa: "V",
  마스터카드: "MA",
  mastercard: "MA",
  스타벅스: "SBUX",
  나이키: "NKE",
  nike: "NKE",
  월마트: "WMT",
  walmart: "WMT",
};

export function resolveTickerFromName(name: string): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (/^[A-Z]{1,5}(-[A-Z])?$/.test(trimmed)) return trimmed;
  if (/^\d{6}(\.KS|\.KQ)?$/.test(trimmed)) return trimmed.includes(".") ? trimmed : trimmed + ".KS";
  const lower = trimmed.toLowerCase();
  for (const [k, v] of Object.entries(KR_TICKER_MAP)) {
    if (k.toLowerCase() === lower) return v;
  }
  for (const [k, v] of Object.entries(US_TICKER_MAP)) {
    if (k.toLowerCase() === lower) return v;
  }
  return null;
}
