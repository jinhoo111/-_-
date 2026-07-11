import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS 화이트리스트. 와일드카드(*) 대신 우리 도메인만 허용해 타 사이트의
// 브라우저 교차출처 남용을 차단(CSRF 방어 심층화). 실제 인증 경계는 JWT(C1)이며
// CORS는 보조 방어선. 운영 중 도메인 추가는 ALLOWED_ORIGINS env로 코드 수정 없이 가능.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "https://jinhoo111.github.io")
  .split(",").map((s) => s.trim()).filter(Boolean);
const isAllowedOrigin = (o: string): boolean =>
  ALLOWED_ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
const corsHeaders = (origin: string): Record<string, string> => ({
  "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
});
const DART_BASE = "https://opendart.fss.or.kr/api";
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const MAX_DAILY_CALLS = 300;

// ── 비회원 공개 데이터(시장 뉴스) ────────────────────────────────
// 시장 뉴스는 전 사용자에게 동일한 공통 데이터라 서버에서 캐시 1건으로 모든 방문자를
// 커버할 수 있다 → 방문자가 아무리 늘어도 Finnhub 쿼터 소모는 카테고리당 60초에 1회.
// 덕분에 "로그인·API 키 없이 진짜 데이터 미리보기"를 안전하게 열 수 있다(가입 유입 경로).
const PUBLIC_NEWS_CATEGORIES = ["general", "forex", "crypto", "merger"];
const PUBLIC_NEWS_TTL_MS = 60_000;
const publicNewsCache = new Map<string, { at: number; data: unknown }>();

// opendart.fss.or.kr은 Deno(rustls) TLS와 호환 안 됨(HandshakeFailure).
// 공개 CORS 프록시 경유로 우회 — 프록시는 표준 TLS라 Deno에서 접근 가능.
// 단일 프록시는 자주 다운되므로(allorigins 등) 여러 프록시를 동시에 경쟁시켜
// 가장 먼저 성공한 응답을 채택. 모두 실패할 때만 throw.
// proxy.cors.sh는 Origin 헤더가 없으면 거부하므로 서버측에서 직접 부여.
// 주의: corsproxy.io는 서버측 요청을 403으로 차단(브라우저 전용)하므로 여기선 제외.
//       cors.workers.dev/proxy.cors.sh가 서버(Deno)에서 동작 확인됨.
const DART_PROXIES: ((u: string) => string)[] = [
  (u) => "https://test.cors.workers.dev/?" + u,
  (u) => "https://proxy.cors.sh/" + u,
  (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
];
const fetchDartJson = async (url: string): Promise<any> => {
  const headers = { "Origin": "https://opendart.fss.or.kr", "x-requested-with": "XMLHttpRequest" };
  const attempts = DART_PROXIES.map(async (make) => {
    const res = await fetch(make(url), { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error("proxy_" + res.status);
    const t = (await res.text()).trim();
    if (!t.startsWith("{") && !t.startsWith("[")) throw new Error("proxy_bad_json");
    return JSON.parse(t);
  });
  return await Promise.any(attempts);
};

// JWT payload decode (sync, no network — works even with --no-verify-jwt)
const decodeJwt = (token: string): Record<string, any> | null => {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch { return null; }
};

serve(async (req: Request) => {
  const CORS = corsHeaders(req.headers.get("Origin") || "");
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

    // 보안 이벤트 로깅(Phase 1 프로듀서). security_events 테이블로 적재되어 이상행위
    // 탐지·운영 대시보드의 데이터 소스가 됨. fire-and-forget — 실패(테이블 미적용 등)해도
    // 본 요청 흐름엔 절대 영향 없음.
    const clientIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim()
      || req.headers.get("cf-connecting-ip") || "";
    const clientUa = req.headers.get("user-agent") || "";
    const logSecurityEvent = (ev: {
      user_id?: string | null; email?: string | null; event_type: string;
      severity?: "info" | "warn" | "critical"; risk_score?: number;
      detail?: Record<string, unknown>;
    }) => {
      try {
        supabase.from("security_events").insert({
          user_id: ev.user_id ?? null,
          email: ev.email ?? null,
          event_type: ev.event_type,
          severity: ev.severity ?? "info",
          risk_score: ev.risk_score ?? 0,
          ip: clientIp,
          user_agent: clientUa,
          detail: ev.detail ?? {},
        }).then(() => {}, () => {});
      } catch { /* swallow */ }
    };

    // Auth (fail-closed, signature-verified). decodeJwt only pre-screens claims
    // cheaply; supabase.auth.getUser(jwt) then verifies the signature against
    // Supabase Auth so a forged token with a spoofed `sub` (user/admin 사칭) is
    // rejected even if the gateway runs with --no-verify-jwt. Verified ONCE here;
    // getUser() stays sync so the 15 downstream call sites are unchanged.
    const authenticate = async (): Promise<{ id: string; email: string } | null> => {
      if (!jwt) return null;
      const p = decodeJwt(jwt);
      if (!p) return null;
      if (p.role === "anon" || p.role === "service_role") return null;
      if (p.exp && p.exp * 1000 < Date.now()) return null;
      if (!p.sub) return null;
      const { data, error } = await supabase.auth.getUser(jwt);
      if (error || !data?.user || data.user.id !== p.sub) {
        // 서명검증 실패/sub 불일치 = 위조 토큰 시도(사칭). 만료는 위에서 이미 걸러져 로깅 안 함.
        logSecurityEvent({ user_id: (p.sub as string) ?? null, event_type: "auth_rejected",
          severity: "warn", risk_score: 40,
          detail: { reason: error ? "verify_failed" : "sub_mismatch", action: body?.action } });
        return null;
      }
      return { id: data.user.id, email: data.user.email || "" };
    };
    const _authedUser = await authenticate();
    const getUser = (): { id: string; email: string } | null => _authedUser;

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

    // 회원 계정 삭제(관리자 전용, 되돌릴 수 없음).
    // auth.users 삭제는 service_role 로만 가능 → 클라이언트에서 직접 못 하고 반드시 여기를 통한다.
    // 자기 자신·다른 관리자는 삭제 불가(운영자 계정 전멸 방지).
    if (action === "admin-delete-user") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      const profile = await getAdminProfile(user.id);
      if (!profile?.is_admin) return err("admin_only", 403);

      const targetId = body.user_id;
      if (!targetId || typeof targetId !== "string") return err("invalid_user");
      if (targetId === user.id) return err("cannot_delete_self");

      const { data: target } = await supabase
        .from("user_profiles")
        .select("is_admin, email")
        .eq("user_id", targetId)
        .maybeSingle();
      if (target?.is_admin) return err("cannot_delete_admin");

      // 앱 데이터 → 프로필 → 인증 계정 순. user_data 의 FK cascade 여부에 의존하지 않도록 명시 삭제.
      // voc_requests·security_events 는 on delete set null 이라 기록 자체는 남긴다(감사 추적).
      await supabase.from("user_data").delete().eq("user_id", targetId);
      await supabase.from("user_profiles").delete().eq("user_id", targetId);
      const { error: delErr } = await supabase.auth.admin.deleteUser(targetId);
      if (delErr) return err("delete_failed:" + delErr.message, 500);

      logSecurityEvent({
        user_id: user.id, email: user.email, event_type: "admin_delete_user",
        severity: "warn", risk_score: 30,
        detail: { target_user_id: targetId, target_email: target?.email ?? null },
      });
      return ok({ ok: true, email: target?.email ?? null });
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
      // 통합: 공용 키가 있으면 전 사용자가 "등록됨" 상태
      const adminKeys = await getAdminKeys();
      if (adminKeys.dart) return ok({ exists: true, masked: "관리자 키", isShared: true });
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
        const testData = await fetchDartJson(
          `${DART_BASE}/list.json?crtfc_key=${encodeURIComponent(key)}&bgn_de=${weekAgo}&end_de=${today}&page_count=1`,
        );
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
      logSecurityEvent({ user_id: user.id, email: user.email, event_type: "key_change",
        detail: { action: "store-dart-key", validation_skipped: validationSkipped } });
      return ok({ ok: true, masked: "···" + key.slice(-4), ...(validationSkipped ? { warning: "dart_validation_skipped" } : {}) });
    }

    if (action === "delete-dart-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      await supabase.from("user_profiles").update({ dart_api_key: null }).eq("user_id", user.id);
      logSecurityEvent({ user_id: user.id, email: user.email, event_type: "key_change",
        detail: { action: "delete-dart-key" } });
      return ok({ ok: true });
    }

    if (action === "get-dart-key") {
      const user = getUser();
      if (!user) return err("auth_required", 401);
      // 개인/기업 통합 후 모든 사용자가 관리자 공용 키를 쓴다. 공용 키를 브라우저로 내려주면
      // 전 사용자에게 키가 노출되므로, 어떤 계정에도 키를 반환하지 않고 서버 경유만 허용한다.
      return err("use_server");
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
      // get-dart-key 와 동일 — 공용 키는 브라우저에 절대 내려주지 않는다(서버 경유: fh-call).
      return err("use_server");
    }

    // 공개 시장 뉴스(로그인 불필요). 카테고리 화이트리스트 + 60초 서버 캐시.
    // 개인화 데이터가 아니므로 인증을 요구하지 않지만, 키는 서버에만 있고 경로도 news 고정이라
    // 남용해도 외부 API 호출은 캐시 TTL 이상으로 늘지 않는다.
    if (action === "public-news") {
      const cat = String(body.category || "general");
      if (!PUBLIC_NEWS_CATEGORIES.includes(cat)) return err("category_not_allowed");

      const hit = publicNewsCache.get(cat);
      if (hit && Date.now() - hit.at < PUBLIC_NEWS_TTL_MS) return ok(hit.data);

      const adminKeys = await getAdminKeys();
      if (!adminKeys.finnhub) return err("fh_key_required", 400);
      const res = await fetch(`${FINNHUB_BASE}/news?category=${cat}&token=${adminKeys.finnhub}`);
      if (!res.ok) {
        // 만료된 캐시라도 있으면 빈 화면 대신 그것을 보여준다(체감 안정성)
        if (hit) return ok(hit.data);
        return ok({ error: "finnhub_error", status: res.status });
      }
      const data = await res.json();
      publicNewsCache.set(cat, { at: Date.now(), data });
      return ok(data);
    }

    // Finnhub 프록시(개인/기업 통합): 모든 사용자가 관리자 공용 키를 사용.
    // 공용 키가 없을 때만 예전에 등록해 둔 본인 개인 키로 폴백.
    if (action === "fh-call") {
      const user = getUser();
      if (!user) return err("auth_required", 401);

      const adminKeys = await getAdminKeys();
      const fhKey = adminKeys.finnhub || await getFhKey(user.id);
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

      // 개인/기업 통합: 모든 사용자가 관리자 공용 DART 키 사용. 없을 때만 본인 개인 키 폴백.
      const adminKeys = await getAdminKeys();
      const dartKey = adminKeys.dart || profile?.dart_api_key || "";
      if (!dartKey) return { _err: "dart_key_required" };

      const qs = new URLSearchParams({ crtfc_key: dartKey, ...params });
      try {
        return await fetchDartJson(`${DART_BASE}/${endpoint}?${qs}`);
      } catch (_e) {
        return { _err: "dart_unreachable" };
      }
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
        reprt_code: "11011", // 사업보고서(타법인 출자현황이 온전히 담김). 11014(3분기보고서)는 대부분 빈값
      });
      if (data._err) return err(data._err, data._err === "auth_required" ? 401 : 400);
      return ok(data);
    }

    // 범용 DART 프록시: 브라우저가 _dartKey 없을 때(기업 사용자 등) 서버 경유로 호출
    if (action === "dart-proxy") {
      const { endpoint, params = {} } = body;
      const ALLOWED = ["company.json", "list.json", "otrCprInvstmntSttus.json", "majorstock.json", "elestock.json"];
      if (!ALLOWED.includes(endpoint)) return err("endpoint_not_allowed");
      const data = await callDart(endpoint, params as Record<string, string>);
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

    // ── 공용 키 준비 상태(전 사용자) ───────────────────────
    // 개인/기업 통합 후 모든 로그인 사용자가 대상. (action 이름은 구버전 클라 호환 위해 유지)

    if (action === "biz-keys-ready" || action === "keys-ready") {
      const user = getUser();
      if (!user) return ok({ dart: false, finnhub: false });
      const profile = await getProfile(user.id);
      const adminKeys = await getAdminKeys();
      // 관리자 공용 키 없으면 본인 개인 키 보유 여부로 판단(폴백 반영) → 상태표시 정확도
      const fhReady = !!adminKeys.finnhub || !!(await getFhKey(user.id));
      const dartReady = !!adminKeys.dart || !!profile?.dart_api_key;
      return ok({ dart: dartReady, finnhub: fhReady, isShared: !!adminKeys.finnhub });
    }

    // Legacy: biz users routed to fh-call path now, but keep for backward compat
    if (action === "finnhub-proxy") {
      return ok(await (async () => {
        const user = getUser();
        if (!user) return { error: "auth_required" };
        const profile = await getProfile(user.id);
        if (!isApprovedBiz(profile)) return { error: "biz_only" };
        const adminKeys = await getAdminKeys();
        // 관리자 공용 Finnhub 키 우선, 미설정 시 본인 개인 키로 폴백
        const fhKey = adminKeys.finnhub || await getFhKey(user.id);
        if (!fhKey) return { error: "finnhub_key_not_configured" };
        const { path, params = {} } = body;
        if (!path) return { error: "path_required" };
        const allowedPaths = ["quote", "company-news", "news", "stock/candle", "search"];
        const basePath = (path as string).split("?")[0].replace(/^\/+/, "");
        if (!allowedPaths.some((p) => basePath.startsWith(p))) return { error: "path_not_allowed" };
        const qs = new URLSearchParams({ ...params, token: fhKey });
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
