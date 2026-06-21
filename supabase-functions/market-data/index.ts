// Supabase Edge Function: market-data
// 국장(KRX) 투자자별 순매수 TOP15

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// KST 기준 영업일 계산 (YYYYMMDD)
// - 장마감(15:30) 이후 → 당일 기준
// - 08:00 이전 → 전전 영업일 (당일 데이터 미업로드 상태)
// - 주말 자동 건너뜀
function getPrevTradingDay(extraDaysBack = 0): string {
  const now = new Date();
  now.setTime(now.getTime() + 9 * 60 * 60 * 1000); // UTC → KST

  const kstHour = now.getUTCHours();

  // 8시 이전이면 KRX 데이터가 아직 전날 것도 미업로드일 수 있어 하루 더 뺌
  let daysBack = kstHour < 8 ? 2 : 1;
  daysBack += extraDaysBack;

  now.setUTCDate(now.getUTCDate() - daysBack);

  // 주말 건너뜀 (일=0, 토=6)
  while (now.getUTCDay() === 0 || now.getUTCDay() === 6) {
    now.setUTCDate(now.getUTCDate() - 1);
  }

  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
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

    const raw: any[] = json.OutBlock_1 || json.block1 || json.items || [];
    return raw.slice(0, 15).map((item: any, i: number) => ({
      rank: i + 1,
      code: item.ISU_CD || item.ISU_CD_KRN || "",
      name: item.ISU_ABBRV || item.ISU_NM || item.ISU_SRT_CD || "—",
      netBuyQty: item.NETBUY_QTY  || item.순매수거래량   || 0,
      netBuyAmt: item.NETBUY_AMT  || item.순매수거래대금  || 0,
      buyAmt:    item.BUY_AMT     || item.매수거래대금   || 0,
      sellAmt:   item.SEL_AMT     || item.매도거래대금   || 0,
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

    // krx-investor: 국장 투자자별 순매수 TOP15
    if (action === "krx-investor") {
      const market = body.market === "KOSDAQ" ? "KOSDAQ" : "KOSPI";

      const INVESTOR_CODES: Record<string, string> = {
        기관: "1000",
        외인: "9000",
        개인: "8000",
      };

      // 날짜 결정: 요청에 date가 없으면 자동 계산, extraDaysBack으로 재시도 지원
      const extraDaysBack = Number(body.extraDaysBack || 0);
      const date = body.date || getPrevTradingDay(extraDaysBack);

      // 기관·외인·개인 3종 병렬 호출
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

      // 데이터가 완전히 비어있으면 빈 날짜임을 클라이언트에 알림
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
