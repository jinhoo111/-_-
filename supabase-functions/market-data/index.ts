import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const DART_BASE = "https://opendart.fss.or.kr/api";
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const MAX_DAILY_CALLS = 300;

// JWT payload decode (sync, no network — works even with --no-verify-jwt)
const decodeJwt = (token: string): Record<string, any> | null => {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch { return null; }
};

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
    const jwt = authHeader.replace("Bearer ", "").trim();

    // Sync auth: decode JWT locally — reliable regardless of env vars
    const getUser = (): { id: string; email: string } | null => {
      const p = decodeJwt(jwt);
      if (!p) return null;
      if (p.role === "anon" || p.role === "service_role") return null;
      if (p.exp && p.exp * 1000 < Date.now()) return null;
      if (!p.sub) return null;
      return { id: p.sub as string, email: (p.email || "") as string };
    };

    // ── DB helpers ───────────────────────────────────────

    const getProfile = async (userId: string) => {
      const { data } = await supabase
        .from("user_profiles")
        .select("dart_api_key, dart_daily_count, dart_count_date, business_approved, user_type")
        .eq("user_id", userId)
        .single();
      return data;
    };

    // finnhub_api_key in separate query — graceful if column missing
    const getFhKey = async (userId: string): Promise<string> => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("finnhub_api_key")
          .eq("user_id", userId)
          .single();
        if (error) return "";
        return (data as any)?.finnhub_api_key || "";
      } catch { return ""; }
    };

    const getAdminProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("is_admin, shared_finnhub_key, dart_api_key")
        .eq("user_id", userId)
        .single();
      if (error) return null;
      return data;
    };

    const isApprovedBiz = (profile: any) =>
      profile?.user_type === "business" && profile?.business_approved === true;

    const getAdminKeys = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("dart_api_key, shared_finnhub_key")
        .eq("is_admin", true)
        .single();
      return {
        dart: (error ? null : data?.dart_api_key) || Deno.env.get("OWNER_DART_KEY") || "",
        finnhub: (error ? null : data?.shared_finnhub_key) || Deno.env.get("OWNER_FINNHUB_KEY") || "",
      };
    };

    const incrementCount = async (userId: string, count: number, today: string) => {
      await supabase.from("user_profiles").update({
        dart_daily_count: count + 1,
        dart_count_date: today,
      }).eq("user_id", userId);
    };

    // ── Admin key management ──────────────────────────────

    if (action === "admin-save-finnhub-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getAdminProfile(user.id);
      if (!profile?.is_admin) return err("admin_only", 403);
      const { key } = body;
      if (!key || typeof key !== "string" || key.length < 10) return err("invalid_key");
      const testRes = await fetch(`${FINNHUB_BASE}/quote?symbol=AAPL&token=${key}`);
      if (!testRes.ok) return err("finnhub_key_invalid");
      const testData = await testRes.json();
      if (testData.error) return err("finnhub_key_invalid");
      await supabase.from("user_profiles").update({ shared_finnhub_key: key }).eq("user_id", user.id);
      return ok({ ok: true, masked: "···" + key.slice(-4) });
    }

    if (action === "admin-delete-finnhub-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getAdminProfile(user.id);
      if (!profile?.is_admin) return err("admin_only", 403);
      await supabase.from("user_profiles").update({ shared_finnhub_key: null }).eq("user_id", user.id);
      return ok({ ok: true });
    }

    if (action === "admin-keys-status") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getAdminProfile(user.id);
      if (!profile?.is_admin) return err("admin_only", 403);
      return ok({
        dart: profile.dart_api_key
          ? { exists: true, masked: "···" + profile.dart_api_key.slice(-4) }
          : { exists: false },
        finnhub: profile.shared_finnhub_key
          ? { exists: true, masked: "···" + profile.shared_finnhub_key.slice(-4) }
          : { exists: false },
      });
    }

    // ── DART key management ───────────────────────────────

    if (action === "dart-key-exists") {
      const user = getUser();
      if (!user) return ok({ exists: false });
      const profile = await getProfile(user.id);
      if (isApprovedBiz(profile)) {
        const adminKeys = await getAdminKeys();
        if (adminKeys.dart) return ok({ exists: true, masked: "관리자 키", isShared: true });
      }
      if (!profile?.dart_api_key) return ok({ exists: false });
      return ok({ exists: true, masked: "···" + profile.dart_api_key.slice(-4) });
    }

    if (action === "store-dart-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const { key } = body;
      if (!key || typeof key !== "string" || key.length < 10) return err("invalid_key");

      // Validate with list.json (only needs date range + API key — no corp_code)
      let dartStatus = "";
      let validationSkipped = false;
      try {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
        const testRes = await fetch(
          `${DART_BASE}/list.json?crtfc_key=${encodeURIComponent(key)}&bgn_de=${weekAgo}&end_de=${today}&page_count=1`,
          { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) },
        );
        const testData = await testRes.json();
        dartStatus = testData.status || "";
      } catch (_fetchErr: any) {
        // DART API temporarily unreachable — save key anyway, validate on first real use
        validationSkipped = true;
      }

      if (!validationSkipped && dartStatus !== "000") {
        const msg: Record<string, string> = {
          "010": "dart_key_unregistered",
          "011": "dart_key_unregistered",
          "020": "dart_key_invalid",
        };
        return err(msg[dartStatus] || `dart_error_${dartStatus}`);
      }

      const { error: dbErr } = await supabase
        .from("user_profiles").update({ dart_api_key: key }).eq("user_id", user.id);
      if (dbErr) return err(`db_error: ${dbErr.message}`, 500);
      return ok({ ok: true, masked: "···" + key.slice(-4), ...(validationSkipped ? { warning: "dart_validation_skipped" } : {}) });
    }

    if (action === "delete-dart-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      await supabase.from("user_profiles").update({ dart_api_key: null }).eq("user_id", user.id);
      return ok({ ok: true });
    }

    if (action === "get-dart-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getProfile(user.id);
      let dartKey = "";
      if (isApprovedBiz(profile)) {
        const adminKeys = await getAdminKeys();
        dartKey = adminKeys.dart || profile?.dart_api_key || "";
      } else {
        dartKey = profile?.dart_api_key || "";
      }
      if (!dartKey) return err("dart_key_required");
      return ok({ key: dartKey });
    }

    // ── Finnhub personal key management ──────────────────
    // Stores in user_profiles.finnhub_api_key (requires SQL: ADD COLUMN finnhub_api_key TEXT)

    if (action === "store-fh-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const { key } = body;
      if (!key || typeof key !== "string" || key.length < 10) return err("invalid_key");
      const testRes = await fetch(`${FINNHUB_BASE}/quote?symbol=AAPL&token=${key}`);
      if (!testRes.ok) return err("fh_key_invalid");
      const testData = await testRes.json();
      if (testData.error) return err("fh_key_invalid");
      const { error: dbErr } = await supabase
        .from("user_profiles")
        .update({ finnhub_api_key: key } as any)
        .eq("user_id", user.id);
      if (dbErr) return err(`db_error: ${dbErr.message}`, 500);
      return ok({ ok: true, masked: "···" + key.slice(-4) });
    }

    if (action === "fh-key-exists") {
      const user = getUser();
      if (!user) return ok({ exists: false });
      const fhKey = await getFhKey(user.id);
      if (!fhKey) return ok({ exists: false });
      return ok({ exists: true, masked: "···" + fhKey.slice(-4) });
    }

    if (action === "delete-fh-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      await supabase.from("user_profiles").update({ finnhub_api_key: null } as any).eq("user_id", user.id);
      return ok({ ok: true });
    }

    if (action === "get-fh-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getProfile(user.id);
      let fhKey = "";
      if (isApprovedBiz(profile)) {
        const adminKeys = await getAdminKeys();
        fhKey = adminKeys.finnhub || "";
      } else {
        fhKey = await getFhKey(user.id);
      }
      if (!fhKey) return err("fh_key_required");
      return ok({ key: fhKey });
    }

    // Unified Finnhub proxy: personal users use their own key, biz uses admin key
    if (action === "fh-call") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getProfile(user.id);

      let fhKey = "";
      if (isApprovedBiz(profile)) {
        const adminKeys = await getAdminKeys();
        fhKey = adminKeys.finnhub;
      } else {
        fhKey = await getFhKey(user.id);
      }
      if (!fhKey) return err("fh_key_required", 400);

      const { path, params = {} } = body;
      if (!path || typeof path !== "string") return err("path_required");

      const allowedPaths = ["quote", "company-news", "news", "stock/candle", "search", "stock/recommendation", "stock/price-target"];
      const basePath = path.split("?")[0].replace(/^\/+/, "");
      if (!allowedPaths.some((p) => basePath.startsWith(p))) return err("path_not_allowed");

      const qs = new URLSearchParams({ ...params, token: fhKey });
      const res = await fetch(`${FINNHUB_BASE}/${basePath}?${qs}`);
      if (!res.ok) return ok({ error: "finnhub_error", status: res.status });
      return ok(await res.json());
    }

    // ── DART API proxy ────────────────────────────────────

    const callDart = async (endpoint: string, params: Record<string, string>) => {
      const user = getUser();
      if (!user) return { _err: "auth_required" };

      const profile = await getProfile(user.id);
      const today = new Date().toISOString().slice(0, 10);
      const count = profile?.dart_count_date === today ? (profile?.dart_daily_count || 0) : 0;
      if (count >= MAX_DAILY_CALLS) return { _err: "rate_limit_exceeded" };
      await incrementCount(user.id, count, today);

      let dartKey = "";
      if (isApprovedBiz(profile)) {
        const adminKeys = await getAdminKeys();
        dartKey = adminKeys.dart || profile?.dart_api_key || "";
      } else {
        dartKey = profile?.dart_api_key || "";
      }
      if (!dartKey) return { _err: "dart_key_required" };

      const qs = new URLSearchParams({ crtfc_key: dartKey, ...params });
      const res = await fetch(`${DART_BASE}/${endpoint}?${qs}`);
      return await res.json();
    };

    if (action === "dart-corp-search") {
      const { query } = body;
      // Only 6-digit stock codes supported — use Naver search for name→code conversion
      if (!/^\d{6}$/.test(query)) return err("stock_code_required_6digit");
      const data = await callDart("company.json", { stock_code: query });
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
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; InvestHub/1.0)" } });
      if (!res.ok) return ok({ error: "price_unavailable" });
      return ok(await res.json());
    }

    // ── Yahoo / Naver Finance CORS proxy ─────────────────
    // Public financial data — no user auth required, domain whitelist prevents abuse
    if (action === "yahoo-finance") {
      const { url } = body;
      if (!url || typeof url !== "string") return err("url_required");
      const ALLOWED_HOSTS = [
        "query1.finance.yahoo.com",
        "query2.finance.yahoo.com",
        "m.stock.naver.com",
        "finance.naver.com",
      ];
      let parsed: URL;
      try { parsed = new URL(url); } catch { return err("invalid_url"); }
      if (!ALLOWED_HOSTS.includes(parsed.hostname)) return err("domain_not_allowed");
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; InvestHub/1.0)",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "ko-KR,ko;q=0.9",
        },
      });
      if (!res.ok) return ok({ error: "fetch_failed", status: res.status });
      const text = await res.text();
      return new Response(text, { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // ── Biz user auto-provision check ─────────────────────

    if (action === "biz-keys-ready") {
      const user = getUser();
      if (!user) return ok({ dart: false, finnhub: false });
      const profile = await getProfile(user.id);
      if (!isApprovedBiz(profile)) return ok({ dart: false, finnhub: false });
      const adminKeys = await getAdminKeys();
      return ok({ dart: !!adminKeys.dart, finnhub: !!adminKeys.finnhub, isShared: true });
    }

    // Legacy: biz users routed to fh-call path now, but keep for backward compat
    if (action === "finnhub-proxy") {
      return ok(await (async () => {
        const user = getUser();
        if (!user) return { error: "auth_required" };
        const profile = await getProfile(user.id);
        if (!isApprovedBiz(profile)) return { error: "biz_only" };
        const adminKeys = await getAdminKeys();
        if (!adminKeys.finnhub) return { error: "finnhub_key_not_configured" };
        const { path, params = {} } = body;
        if (!path) return { error: "path_required" };
        const allowedPaths = ["quote", "company-news", "news", "stock/candle", "search"];
        const basePath = (path as string).split("?")[0].replace(/^\/+/, "");
        if (!allowedPaths.some((p) => basePath.startsWith(p))) return { error: "path_not_allowed" };
        const qs = new URLSearchParams({ ...params, token: adminKeys.finnhub });
        const res = await fetch(`${FINNHUB_BASE}/${basePath}?${qs}`);
        if (!res.ok) return { error: "finnhub_error", status: res.status };
        return await res.json();
      })());
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
