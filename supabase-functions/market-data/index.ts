// Supabase Edge Function: market-data
// 국장(KRX) 투자자별 순매수 TOP15

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// KST 기준 영업일 계산 (YYYYMMDD)
function getPrevTradingDay(extraDaysBack = 0): string {
  const now = new Date();
  now.setTime(now.getTime() + 9 * 60 * 60 * 1000); // UTC → KST

  const kstHour = now.getUTCHours();
  let daysBack = kstHour < 8 ? 2 : 1;
  daysBack += extraDaysBack;

  now.setUTCDate(now.getUTCDate() - daysBack);

  while (now.getUTCDay() === 0 || now.getUTCDay() === 6) {
    now.setUTCDate(now.getUTCDate() - 1);
  }

  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// num() : KRX가 문자열 또는 쉼표 포함 숫자로 반환할 수 있으므로 안전하게 파싱
function num(v: any): number {
  if (v == null) return 0;
  return Number(String(v).replace(/,/g, "")) || 0;
}

// KRX 투자자별 순매수 상위 종목 조회 (타임아웃 8초)
async function fetchKrxInvestor(
  market: string,
  investorCode: string,
  date: string
): Promise<any[]> {
  const mktId = market === "KOSDAQ" ? "KSQ" : "STK";

  const params = new URLSearchParams({
    bld: "dbms/MDC/STAT/standard/MDCSTAT02401",
    locale: "ko_KR",
    trdDd: date,
    mktId,
    invstTpCd: investorCode,
    secuGrpId: "ST",
    csvxls_isNo: "false",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      "https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Referer": "https://data.krx.co.kr/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: params.toString(),
        signal: controller.signal,
      }
    );

    if (!res.ok) throw new Error(`KRX HTTP ${res.status}`);
    const json = await res.json();

    // [진단] 첫 아이템의 키 목록 로그 — 필드명 확인용
    const raw: any[] = json.OutBlock_1 || json.output || json.block1 || json.items ||
      (Array.isArray(json) ? json : []);
    if (raw.length > 0) {
      console.log("[KRX debug] keys:", Object.keys(raw[0]).join(", "));
      console.log("[KRX debug] first item:", JSON.stringify(raw[0]));
    } else {
      console.log("[KRX debug] empty raw. top-level keys:", Object.keys(json).join(", "));
    }

    return raw.slice(0, 15).map((item: any, i: number) => ({
      rank: i + 1,
      code: item.ISU_CD || item.ISU_SRT_CD || item.ISU_CD_KRN || "",
      name: item.ISU_ABBRV || item.ISU_NM || "—",
      // TRDVOL = 거래량(주), TRDVAL = 거래대금(천원)
      // 기존 QTY/AMT 스타일도 폴백으로 유지
      netBuyQty: num(item.NETBUY_TRDVOL ?? item.NETBUY_QTY),
      netBuyAmt: num(item.NETBUY_TRDVAL ?? item.NETBUY_AMT),
      buyAmt:    num(item.BUY_TRDVAL    ?? item.BUY_AMT),
      sellAmt:   num(item.SEL_TRDVAL    ?? item.SEL_AMT),
    }));
  } finally {
    clearTimeout(timer);
  }
}

// 메인 핸들러
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "krx-investor") {
      const market = body.market === "KOSDAQ" ? "KOSDAQ" : "KOSPI";

      const INVESTOR_CODES: Record<string, string> = {
        기관: "1000",
        외인: "9000",
        개인: "8000",
      };

      const extraDaysBack = Number(body.extraDaysBack || 0);
      const date = body.date || getPrevTradingDay(extraDaysBack);

      const results = await Promise.allSettled(
        Object.entries(INVESTOR_CODES).map(async ([label, code]) => {
          const data = await fetchKrxInvestor(market, code, date);
          return { label, data };
        })
      );

      const output: Record<string, any[]> = {};
      let totalRows = 0;
      for (const r of results) {
        if (r.status === "fulfilled") {
          output[r.value.label] = r.value.data;
          totalRows += r.value.data.length;
        } else {
          console.error("KRX fetch error:", r.reason);
        }
      }

      if (totalRows === 0) {
        return new Response(
          JSON.stringify({ empty: true, date, market }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ date, market, ...output }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `unknown action: ${action}` }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("market-data error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
