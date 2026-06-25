import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const DART_BASE = "https://opendart.fss.or.kr/api";
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const MAX_DAILY_CALLS = 300; // per user per day

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const ok = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });
  const err = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    const getUser = async () => {
      if (!jwt) return null;
      const { data: { user } } = await supabase.auth.getUser(jwt);
      return user || null;
    };

    const getProfile = async (userId: string) => {
      const { data } = await supabase
        .from("user_profiles")
        .select("dart_api_key, dart_daily_count, dart_count_date, business_approved, user_type")
        .eq("user_id", userId)
        .single();
      return data;
    };

    const incrementCount = async (userId: string, count: number, today: string) => {
      await supabase.from("user_profiles").update({
        dart_daily_count: count + 1,
        dart_count_date: today,
      }).eq("user_id", userId);
    };

    // ── 공유 키 (환경변수) ────────────────────────────────
    const ownerDartKey = Deno.env.get("OWNER_DART_KEY") || "";
    const ownerFinnhubKey = Deno.env.get("OWNER_FINNHUB_KEY") || "";

    // 승인된 기업 사용자 여부 확인
    const isApprovedBiz = (profile: any) =>
      profile?.user_type === "business" && profile?.business_approved === true;

    // ── DART 키 관리 ──────────────────────────────────────

    if (action === "dart-key-exists") {
      const user = await getUser();
      if (!user) return ok({ exists: false });
      const profile = await getProfile(user.id);
      // 승인된 기업 사용자 → 관리자 키 자동 사용
      if (isApprovedBiz(profile) && ownerDartKey) {
        return ok({ exists: true, masked: "관리자 키", isShared: true });
      }
      if (!profile?.dart_api_key) return ok({ exists: false });
      return ok({ exists: true, masked: "···" + profile.dart_api_key.slice(-4) });
    }

    if (action === "store-dart-key") {
      const user = await getUser();
      if (!user) return err("auth_required", 401);
      const { key } = body;
      if (!key || typeof key !== "string" || key.length < 10) return err("invalid_key");
      const testRes = await fetch(`${DART_BASE}/company.json?crtfc_key=${key}&corp_name=삼성전자`);
      const testData = await testRes.json();
      if (testData.status === "020") return err("dart_key_invalid");
      await supabase.from("user_profiles").update({ dart_api_key: key }).eq("user_id", user.id);
      return ok({ ok: true, masked: "···" + key.slice(-4) });
    }

    if (action === "delete-dart-key") {
      const user = await getUser();
      if (!user) return err("auth_required", 401);
      await supabase.from("user_profiles").update({ dart_api_key: null }).eq("user_id", user.id);
      return ok({ ok: true });
    }

    // ── DART API Proxy ────────────────────────────────────

    const callDart = async (endpoint: string, params: Record<string, string>) => {
      const user = await getUser();
      if (!user) return { _err: "auth_required" };

      const profile = await getProfile(user.id);
      const today = new Date().toISOString().slice(0, 10);
      const count = profile?.dart_count_date === today ? (profile?.dart_daily_count || 0) : 0;
      if (count >= MAX_DAILY_CALLS) return { _err: "rate_limit_exceeded" };
      await incrementCount(user.id, count, today);

      // 승인된 기업 사용자 → 관리자 키 사용 (개인 키 불필요)
      let dartKey = "";
      if (isApprovedBiz(profile) && ownerDartKey) {
        dartKey = ownerDartKey;
      } else if (profile?.dart_api_key) {
        dartKey = profile.dart_api_key;
      } else {
        return { _err: "dart_key_required" };
      }

      const qs = new URLSearchParams({ crtfc_key: dartKey, ...params });
      const res = await fetch(`${DART_BASE}/${endpoint}?${qs}`);
      return await res.json();
    };

    if (action === "dart-corp-search") {
      const { query } = body;
      const isCode = /^\d{6}$/.test(query);
      const data = await callDart("company.json", isCode ? { stock_code: query } : { corp_name: query });
      if (data._err) return err(data._err, data._err === "auth_required" ? 401 : 400);
      return ok(data);
    }

    if (action === "dart-disclosures") {
      const { corpCode, startDate, endDate, pageCount = "10" } = body;
      const data = await callDart("list.json", {
        corp_code: corpCode,
        bgn_de: startDate,
        end_de: endDate,
        page_count: String(pageCount),
      });
      if (data._err) return err(data._err, data._err === "auth_required" ? 401 : 400);
      return ok(data);
    }

    if (action === "dart-holdings") {
      const { corpCode, year } = body;
      const data = await callDart("otrCprInvstmntSttus.json", {
        corp_code: corpCode,
        bsns_year: year,
        reprt_code: "11014",
      });
      if (data._err) return err(data._err, data._err === "auth_required" ? 401 : 400);
      return ok(data);
    }

    if (action === "dart-stock-price") {
      const { stockCode } = body;
      if (!stockCode) return err("stock_code_required");
      const symbol = encodeURIComponent(stockCode + ".KS");
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; InvestHub/1.0)" },
      });
      if (!res.ok) return ok({ error: "price_unavailable" });
      return ok(await res.json());
    }

    // ── Finnhub Proxy (기업 사용자용 — 관리자 키) ─────────

    if (action === "finnhub-proxy") {
      const user = await getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getProfile(user.id);
      if (!isApprovedBiz(profile)) return err("biz_only", 403);
      if (!ownerFinnhubKey) return err("finnhub_key_not_configured", 503);

      const { path, params = {} } = body;
      if (!path || typeof path !== "string") return err("path_required");

      // 허용된 경로만 프록시 (보안)
      const allowedPaths = ["quote", "company-news", "news", "stock/candle", "search"];
      const basePath = path.split("?")[0].replace(/^\/+/, "");
      if (!allowedPaths.some(p => basePath.startsWith(p))) return err("path_not_allowed");

      const qs = new URLSearchParams({ ...params, token: ownerFinnhubKey });
      const url = `${FINNHUB_BASE}/${basePath}?${qs}`;
      const res = await fetch(url);
      if (!res.ok) return ok({ error: "finnhub_error", status: res.status });
      return ok(await res.json());
    }

    // ── 기업 사용자 키 상태 확인 (일괄 초기화용) ──────────

    if (action === "biz-keys-ready") {
      const user = await getUser();
      if (!user) return ok({ dart: false, finnhub: false });
      const profile = await getProfile(user.id);
      if (!isApprovedBiz(profile)) return ok({ dart: false, finnhub: false });
      return ok({
        dart: !!ownerDartKey,
        finnhub: !!ownerFinnhubKey,
        isShared: true,
      });
    }

    return err(`unknown action: ${action}`);
  } catch (e: any) {
    console.error("market-data error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
