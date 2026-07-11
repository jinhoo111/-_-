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
  // 캐시 적중 여부를 클라이언트/운영에서 확인할 수 있도록 노출(진단용, 값은 HIT|MISS)
  "Access-Control-Expose-Headers": "x-cache",
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

// ── 종목 단위 공유 캐시(fh-call) ────────────────────────────────
// 시세·종목뉴스·레이팅은 "누가 요청하든 심볼이 같으면 같은 응답"이라 사용자별로 따로 부를
// 이유가 없다. 심볼 단위로 캐시해 두면 같은 종목을 보는 사용자가 늘어도 Finnhub 호출은
// TTL당 1회 → 분당 60회 한도가 사용자 수와 무관해진다.
// TTL은 데이터 성격에 맞춘다: 시세는 짧게(체감 실시간 유지), 뉴스·레이팅은 길게.
const SHARED_FH_TTL_MS: Record<string, number> = {
  "quote": 30_000,
  "company-news": 300_000,
  "stock/recommendation": 3_600_000,
  "stock/price-target": 3_600_000,
};
// 저장소는 DB(api_cache). Edge Function의 메모리는 요청마다 다른 isolate가 처리할 수 있어
// 요청 간 공유되지 않는다(실측: 모듈 레벨 Map은 연속 호출에도 전부 MISS).
// 메모리 Map은 "같은 isolate가 연속 처리하는 경우"만 아끼는 1차 캐시로 남겨둔다.
const memCache = new Map<string, { at: number; data: unknown }>();
const MEM_CACHE_MAX = 200;

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

  const ok = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json", ...extra } });
  const CACHE_HIT = { "x-cache": "HIT" };
  const CACHE_MISS = { "x-cache": "MISS" };
  const err = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 공유 캐시(api_cache 테이블) ─────────────────────────────
    // 메모리(1차) → DB(2차) 순으로 조회. DB라 어느 isolate가 처리하든 캐시가 공유된다.
    // 캐시 실패(테이블 미적용 등)는 무시하고 원본 API를 호출한다 → 기능이 죽지 않음.
    const cacheGet = async (key: string, ttlMs: number): Promise<unknown | null> => {
      const m = memCache.get(key);
      if (m && Date.now() - m.at < ttlMs) return m.data;
      try {
        const { data, error } = await supabase
          .from("api_cache").select("data, updated_at").eq("key", key).maybeSingle();
        // PGRST116(행 없음)은 정상적인 캐시 미스. 그 외 오류(테이블 없음 등)만 로깅.
        if (error) { console.error("[cache] select 실패:", error.message); return null; }
        if (!data) return null;
        const at = new Date(data.updated_at).getTime();
        if (Date.now() - at >= ttlMs) return null;
        memCache.set(key, { at, data: data.data });
        return data.data;
      } catch (e) { console.error("[cache] select 예외:", String(e)); return null; }
    };
    // 저장은 반드시 await 한다. Edge 런타임은 응답을 반환하는 순간 남은 비동기 작업을
    // 중단하므로, fire-and-forget으로 두면 upsert가 실행되기 전에 잘려 캐시가 영원히
    // 비어 있게 된다(실측: 연속 호출이 전부 MISS). 지연은 DB 왕복 수십 ms 수준.
    const cacheSet = async (key: string, data: unknown) => {
      memCache.set(key, { at: Date.now(), data });
      if (memCache.size > MEM_CACHE_MAX) {
        for (const k of [...memCache.keys()].slice(0, memCache.size - MEM_CACHE_MAX)) memCache.delete(k);
      }
      try {
        const { error } = await supabase.from("api_cache")
          .upsert({ key, data, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) console.error("[cache] upsert 실패:", error.message);
      } catch (e) {
        console.error("[cache] upsert 예외:", String(e));
      }
    };
    // 만료된 캐시라도 원본 호출이 실패(429 등)했을 때 화면 공백 대신 보여주기 위한 조회
    const cacheGetStale = async (key: string) => await cacheGet(key, Number.MAX_SAFE_INTEGER);

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

      const key = `fh:news?category=${cat}`;
      const cached = await cacheGet(key, PUBLIC_NEWS_TTL_MS);
      if (cached) return ok(cached, 200, CACHE_HIT);

      const adminKeys = await getAdminKeys();
      if (!adminKeys.finnhub) return err("fh_key_required", 400);
      const res = await fetch(`${FINNHUB_BASE}/news?category=${cat}&token=${adminKeys.finnhub}`);
      if (!res.ok) {
        // 만료된 캐시라도 있으면 빈 화면 대신 그것을 보여준다(체감 안정성)
        const stale = await cacheGetStale(key);
        if (stale) return ok(stale, 200, CACHE_HIT);
        return ok({ error: "finnhub_error", status: res.status });
      }
      const data = await res.json();
      await cacheSet(key, data);
      return ok(data, 200, CACHE_MISS);
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

      // 시세·레이팅 등은 사용자와 무관하게 심볼만 같으면 동일한 응답이므로 서버에서 캐시한다.
      // 같은 종목을 N명이 보든 외부 호출은 TTL당 1회 → Finnhub 분당 60회 한도를 사용자 수와 분리.
      const ttl = SHARED_FH_TTL_MS[Object.keys(SHARED_FH_TTL_MS).find((p) => basePath.startsWith(p)) ?? ""];
      // 파라미터 순서가 달라도 같은 키가 되도록 정렬(캐시 파편화 방지)
      const cacheKey = ttl
        ? `fh:${basePath}?${[...new URLSearchParams({ ...params }).entries()].sort()
            .map(([k, v]) => `${k}=${v}`).join("&")}`
        : "";
      if (ttl) {
        const cached = await cacheGet(cacheKey, ttl);
        if (cached) return ok(cached, 200, CACHE_HIT);
      }

      const qs = new URLSearchParams({ ...params, token: fhKey });
      const res = await fetch(`${FINNHUB_BASE}/${basePath}?${qs}`);
      if (!res.ok) {
        // 한도 초과(429) 등으로 실패해도 만료된 캐시가 있으면 그것으로 응답(화면 공백 방지)
        const stale = ttl ? await cacheGetStale(cacheKey) : null;
        if (stale) return ok(stale, 200, CACHE_HIT);
        return ok({ error: "finnhub_error", status: res.status });
      }
      const data = await res.json();
      if (ttl) await cacheSet(cacheKey, data);
      return ok(data, 200, ttl ? CACHE_MISS : {});
    }

    // ══ 국내 수급(기관·외국인 순매수) ═══════════════════════════════
    // 소스: 네이버 모바일 API. 투자자별 수급은 KRX 공식 OpenAPI에 서비스 자체가 없고
    // (지수·시세·종목정보만 제공), KRX 웹 통계는 로그인 세션을 요구해 서비스 기반으로
    // 쓸 수 없다(2026-07-11 실측). KIS 앱키 발급 시 getInvestorFlow만 교체하면 된다.
    //
    // 수급은 "일 단위 확정 데이터"라 하루 1회 배치로 랭킹을 만들어 캐시에 넣고,
    // 사용자 조회는 캐시만 읽는다 → 조회가 아무리 많아도 외부 호출 0.

    const NAVER_M = "https://m.stock.naver.com/api";
    const naverHeaders = { "User-Agent": "Mozilla/5.0", "Referer": "https://m.stock.naver.com/" };
    const toNum = (s: unknown) => Number(String(s ?? "").replace(/[+,%\s]/g, "")) || 0;

    // 소스 추상화: 종목 1개의 최근 수급(일별). KIS 전환 시 이 함수만 교체.
    const getInvestorFlow = async (code: string) => {
      const r = await fetch(`${NAVER_M}/stock/${code}/trend?page=1&pageSize=5`, { headers: naverHeaders });
      if (!r.ok) throw new Error(`naver_${r.status}`);
      const rows = await r.json();
      if (!Array.isArray(rows)) throw new Error("naver_bad_shape");
      return rows.map((d: any) => ({
        date: d.bizdate,
        foreign: toNum(d.foreignerPureBuyQuant),      // 외국인 순매수(주)
        organ: toNum(d.organPureBuyQuant),            // 기관 순매수(주)
        individual: toNum(d.individualPureBuyQuant),  // 개인 순매수(주)
        foreignHoldRatio: toNum(d.foreignerHoldRatio),
        close: toNum(d.closePrice),
        changeRate: toNum(d.compareToPreviousClosePrice) / (toNum(d.closePrice) || 1) * 100,
      }));
    };

    // 랭킹 대상 유니버스: 시총 상위 N(코스피+코스닥 통합)
    const getUniverse = async (size: number) => {
      const out: { code: string; name: string }[] = [];
      for (let page = 1; out.length < size && page <= 20; page++) {
        const r = await fetch(`${NAVER_M}/stocks/marketValue/all?page=${page}&pageSize=100`, { headers: naverHeaders });
        if (!r.ok) break;
        const d = await r.json();
        const list = d?.stocks ?? [];
        if (!list.length) break;
        for (const s of list) {
          if (s.stockEndType === "stock" && /^\d{6}$/.test(s.itemCode)) {
            out.push({ code: s.itemCode, name: s.stockName });
          }
        }
      }
      return out.slice(0, size);
    };

    const FLOW_UNIVERSE_SIZE = 300;
    const flowRankKey = () => `flow:kr:rank:v1`;

    // 랭킹 재계산(배치). 300종목을 순회하며 최신 영업일 수급을 모아 정렬.
    const buildKrFlowRank = async () => {
      const universe = await getUniverse(FLOW_UNIVERSE_SIZE);
      const rows: any[] = [];
      // 네이버에 예의를 갖춰 소량 동시성으로 순회(동시 5, 종목당 실패는 건너뜀)
      const CONC = 5;
      for (let i = 0; i < universe.length; i += CONC) {
        const chunk = universe.slice(i, i + CONC);
        const got = await Promise.all(chunk.map(async (u) => {
          try {
            const flow = await getInvestorFlow(u.code);
            const latest = flow[0];
            if (!latest) return null;
            // 연속 순매수/순매도 일수(포트폴리오 알림의 재료)
            const streak = (pick: (f: any) => number) => {
              const sign = Math.sign(pick(flow[0]));
              if (!sign) return 0;
              let n = 0;
              for (const f of flow) { if (Math.sign(pick(f)) === sign) n++; else break; }
              return sign * n;
            };
            return {
              code: u.code, name: u.name, date: latest.date,
              close: latest.close, changeRate: Number(latest.changeRate.toFixed(2)),
              organ: latest.organ, foreign: latest.foreign, individual: latest.individual,
              organStreak: streak((f) => f.organ), foreignStreak: streak((f) => f.foreign),
            };
          } catch { return null; }
        }));
        rows.push(...got.filter(Boolean));
      }
      const top = (key: "organ" | "foreign", dir: 1 | -1) =>
        [...rows].sort((a, b) => dir * (b[key] - a[key])).slice(0, 20);

      const result = {
        date: rows[0]?.date ?? "",
        universe: rows.length,
        builtAt: new Date().toISOString(),
        organBuy: top("organ", 1), organSell: top("organ", -1),
        foreignBuy: top("foreign", 1), foreignSell: top("foreign", -1),
      };
      await cacheSet(flowRankKey(), result);
      return result;
    };

    // 랭킹 조회 — 비회원에게도 공개(캐시된 공통 데이터, 외부 호출 0 → 가입 유입 자산)
    if (action === "flow-kr-rank") {
      const cached = await cacheGet(flowRankKey(), 12 * 3600_000);  // 하루 1회 갱신 + 여유
      if (cached) return ok(cached, 200, CACHE_HIT);
      // 배치가 아직 안 돌았으면 온디맨드로 계산(수십 초) → 화면이 비지 않게
      const built = await buildKrFlowRank();
      return ok(built, 200, CACHE_MISS);
    }

    // 종목별 수급 상세(일별 추이)
    if (action === "flow-kr-stock") {
      const code = String(body.code || "");
      if (!/^\d{6}$/.test(code)) return err("stock_code_required_6digit");
      const key = `flow:kr:stock:${code}`;
      const cached = await cacheGet(key, 3600_000);
      if (cached) return ok(cached, 200, CACHE_HIT);
      try {
        const flow = await getInvestorFlow(code);
        await cacheSet(key, flow);
        return ok(flow, 200, CACHE_MISS);
      } catch (e) {
        const stale = await cacheGetStale(key);
        if (stale) return ok(stale, 200, CACHE_HIT);
        return err("flow_unavailable", 502);
      }
    }

    // 배치 재계산(스케줄러 전용). FLOW_REFRESH_SECRET 헤더로 보호.
    if (action === "flow-kr-refresh") {
      const secret = Deno.env.get("FLOW_REFRESH_SECRET") || "";
      if (!secret || req.headers.get("x-refresh-secret") !== secret) return err("forbidden", 403);
      const built = await buildKrFlowRank();
      return ok({ ok: true, date: built.date, universe: built.universe });
    }

    // ══ 미국 내부자 거래(SEC Form 4) ═══════════════════════════════
    // Form 4는 거래 후 2영업일 내 신고 → 거의 실시간. "CEO가 자기 주식을 판다"가 핵심 신호.
    // SEC 요건: User-Agent 필수, 10 req/s 제한 → 캐시(TTL 10분)와 동시성 제한 필수.
    // 13F(분기·45일 지연)와 달리 즉시성이 있어 Phase 2로 먼저 구현.

    const SEC_UA = { "User-Agent": "RichHub/1.0 (jinhoo9915@gmail.com)" };
    // 거래코드: P=시장매수, S=매도가 핵심. A(RSU 무상취득)·M(옵션행사)·F(세금대납 매도)는
    // 보상 절차라 신호 가치가 낮아 기본 노출에서 제외한다(클라에서 필요 시 표시).
    const SEC_CODE_LABEL: Record<string, string> = {
      P: "매수", S: "매도", M: "옵션행사", A: "무상취득", F: "세금납부 매도", G: "증여",
    };

    const secText = (tag: string, s: string) => {
      const m = s.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : "";
    };
    // Form 4의 수치 필드는 <transactionShares><value>123</value></transactionShares> 구조.
    // 반드시 해당 태그 "블록 안"에서만 <value>를 찾아야 한다. 태그 경계를 넘어 검색하면
    // <value>가 없는 필드(transactionCode 등)가 뒤쪽 다른 필드의 <value>를 잡아채
    // 거래코드가 수량 숫자로 뒤바뀐다(실측으로 드러난 버그).
    const secValue = (tag: string, s: string) => {
      const block = secText(tag, s);
      if (!block) return "";
      const m = block.match(/<value>([\s\S]*?)<\/value>/);
      return m ? m[1].trim() : block.replace(/<[^>]+>/g, "").trim();
    };

    const parseForm4 = (xml: string) => {
      const symbol = secText("issuerTradingSymbol", xml);
      const issuer = secText("issuerName", xml);
      const owner = secText("rptOwnerName", xml);
      const rel = secText("reportingOwnerRelationship", xml);
      const title = rel ? secText("officerTitle", rel) : "";
      const isDirector = /<isDirector>\s*(1|true)\s*<\/isDirector>/.test(rel);
      const isTenPct = /<isTenPercentOwner>\s*(1|true)\s*<\/isTenPercentOwner>/.test(rel);
      const role = title || (isDirector ? "이사" : isTenPct ? "10% 주주" : "");
      // CEO/CFO 등 최고경영진 여부 — 신호 강도가 다르므로 별도 플래그
      const isTopExec = /chief exec|CEO|president|chief financial|CFO/i.test(title);

      const txs = [...xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g)]
        .map((m) => {
          const t = m[1];
          const code = secValue("transactionCode", t) || secText("transactionCode", t);
          const shares = Number(secValue("transactionShares", t)) || 0;
          const price = Number(secValue("transactionPricePerShare", t)) || 0;
          return {
            code,
            label: SEC_CODE_LABEL[code] || code,
            date: secValue("transactionDate", t),
            shares,
            price,
            amount: Math.round(shares * price),
            sharesAfter: Number(secValue("sharesOwnedFollowingTransaction", t)) || 0,
          };
        })
        .filter((t) => t.shares > 0);

      return { symbol, issuer, owner, role, isTopExec, txs };
    };

    // 여러 Form 4 문서를 병렬(제한)로 가져와 파싱 → 거래 단위로 평탄화
    const form4Stats = { fetched: 0, httpFail: 0, noTx: 0, parsed: 0 };
    const fetchForm4Docs = async (hits: any[]) => {
      const out: any[] = [];
      const CONC = 4;                                  // SEC 10 req/s 제한 준수(여유 있게)
      for (let i = 0; i < hits.length; i += CONC) {
        const chunk = hits.slice(i, i + CONC);
        const got = await Promise.all(chunk.map(async (h: any) => {
          try {
            const [acc, doc] = String(h._id).split(":");
            // 주의: ciks[0]이 항상 발행사는 아니다(보고자일 수도). 문서 경로는 어느 CIK로도
            // 접근 가능하므로 첫 CIK를 쓰되, 실패 시 나머지 CIK로 재시도한다.
            const ciks: string[] = (h._source?.ciks || []).map((c: string) => String(c).replace(/^0+/, ""));
            let xml = "";
            for (const cik of ciks) {
              const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${acc.replace(/-/g, "")}/${doc}`;
              const r = await fetch(url, { headers: SEC_UA });
              if (r.ok) { xml = await r.text(); form4Stats.fetched++; break; }
              form4Stats.httpFail++;
            }
            if (!xml) return null;
            const parsed = parseForm4(xml);
            if (!parsed.symbol || !parsed.txs.length) { form4Stats.noTx++; return null; }
            form4Stats.parsed++;
            return { ...parsed, filedAt: h._source?.file_date || "", url: "" };
          } catch { return null; }
        }));
        out.push(...got.filter(Boolean));
        await new Promise((r) => setTimeout(r, 120));   // SEC 예의(초당 요청 억제)
      }
      // 거래 1건 = 카드 1장. 매수(P)/매도(S)만 노출(보상성 거래 제외).
      const rows: any[] = [];
      for (const f of out) {
        for (const t of f.txs) {
          if (t.code !== "P" && t.code !== "S") continue;
          rows.push({
            symbol: f.symbol, issuer: f.issuer, owner: f.owner, role: f.role,
            isTopExec: f.isTopExec, filedAt: f.filedAt, url: f.url,
            code: t.code, label: t.label, date: t.date,
            shares: t.shares, price: t.price, amount: t.amount, sharesAfter: t.sharesAfter,
          });
        }
      }
      return rows.sort((a, b) => b.amount - a.amount);
    };

    // 최신 내부자 거래 피드 — 비회원 공개(캐시된 공통 데이터)
    if (action === "sec-insider-latest") {
      const key = "sec:insider:latest:v2";
      const cached = await cacheGet(key, 10 * 60_000) as any;
      // 빈 결과는 캐시하지 않지만, 혹시 남아 있어도 재조회하도록 방어(빈 화면 고착 방지)
      if (cached?.rows?.length) return ok(cached, 200, CACHE_HIT);
      try {
        const r = await fetch("https://efts.sec.gov/LATEST/search-index?forms=4&from=0&size=60", { headers: SEC_UA });
        if (!r.ok) throw new Error(`efts_${r.status}`);
        const hits = (await r.json())?.hits?.hits ?? [];
        const rows = await fetchForm4Docs(hits.slice(0, 40));
        const data = { builtAt: new Date().toISOString(), rows, stats: form4Stats };
        if (rows.length) await cacheSet(key, data);   // 빈 결과 캐시 금지
        return ok(data, 200, CACHE_MISS);
      } catch (_e) {
        const stale = await cacheGetStale(key);
        if (stale) return ok(stale, 200, CACHE_HIT);
        return err("sec_unavailable", 502);
      }
    }

    // ══ KRX 공식 OpenAPI (임시 진단: 응답 필드 확인용) ══════════════
    // 키는 서버 시크릿(KRX_KEY)에만 존재. 브라우저로 절대 내려보내지 않는다.
    if (action === "krx-probe") {
      const KRX_KEY = Deno.env.get("KRX_KEY") || "";
      if (!KRX_KEY) return err("krx_key_missing", 400);
      const basDd = String(body.basDd || "20260710");
      const eps: Record<string, string> = {
        주식_유가: `sto/stk_bydd_trd?basDd=${basDd}`,
        주식_코스닥: `sto/ksq_bydd_trd?basDd=${basDd}`,
        종목기본정보: `sto/stk_isu_base_info?basDd=${basDd}`,
        지수_KOSPI: `idx/kospi_dd_trd?basDd=${basDd}`,
        지수_KRX: `idx/krx_dd_trd?basDd=${basDd}`,
        ETF: `etp/etf_bydd_trd?basDd=${basDd}`,
        옵션: `drv/eqsop_bydd_trd?basDd=${basDd}`,
        선물: `drv/eqsfu_bydd_trd?basDd=${basDd}`,
      };
      const out: Record<string, unknown> = {};
      for (const [name, path] of Object.entries(eps)) {
        try {
          const r = await fetch(`https://data-dbg.krx.co.kr/svc/apis/${path}`, {
            headers: { AUTH_KEY: KRX_KEY },
          });
          const txt = await r.text();
          let j: any = null;
          try { j = JSON.parse(txt); } catch { /* not json */ }
          const rows = j?.OutBlock_1 || j?.OutBlock_2 || j?.output || [];
          out[name] = {
            status: r.status,
            rows: Array.isArray(rows) ? rows.length : 0,
            fields: Array.isArray(rows) && rows[0] ? Object.keys(rows[0]) : null,
            sample: Array.isArray(rows) && rows[0] ? rows[0] : txt.slice(0, 160),
            topKeys: j ? Object.keys(j) : null,
          };
        } catch (e) {
          out[name] = { error: String(e) };
        }
      }
      return ok(out);
    }

    // ══ 13F — 주요 기관의 분기별 포지션 변화 ═══════════════════════
    // 13F는 분기 종료 후 45일 내 제출 → "지금 뭘 사는가"가 아니라 "지난 분기에 어떻게
    // 움직였나"를 본다. 대가들의 신규 편입·전량 매도·비중 변화가 핵심.
    //
    // 함정: 종목을 이름으로 매칭하면 안 된다. 발행사 표기가 분기마다 바뀌어
    // (예: "CHEVRON CORP NEW" → "CHEVRON CORPORATION") 같은 종목이 '전량 매도 +
    // 신규 편입'으로 이중 계상된다. 반드시 CUSIP(증권 고유번호)으로 매칭한다.

    const INSTITUTIONS: { id: string; cik: string; name: string; who: string }[] = [
      { id: "brk",  cik: "0001067983", name: "버크셔 해서웨이", who: "워런 버핏" },
      { id: "ark",  cik: "0001697748", name: "ARK Invest",      who: "캐시 우드" },
      { id: "psq",  cik: "0001336528", name: "퍼싱 스퀘어",     who: "빌 애크먼" },
      { id: "scion",cik: "0001649339", name: "사이언 자산운용", who: "마이클 버리" },
      { id: "bw",   cik: "0001350694", name: "브리지워터",      who: "레이 달리오" },
      { id: "tiger",cik: "0001167483", name: "타이거 글로벌",   who: "체이스 콜먼" },
      { id: "duq",  cik: "0001536411", name: "듀케인 패밀리",   who: "스탠리 드러켄밀러" },
      { id: "app",  cik: "0001056188", name: "아팔루사",        who: "데이비드 테퍼" },
    ];

    // 13F 보유내역(정보 테이블 XML) → CUSIP 기준 집계
    const fetch13fHoldings = async (cik: string, accession: string) => {
      const accn = accession.replace(/-/g, "");
      const base = `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, "")}/${accn}`;
      const idxRes = await fetch(`${base}/`, { headers: SEC_UA });
      if (!idxRes.ok) return null;
      const idx = await idxRes.text();
      const xmls = [...idx.matchAll(/href="([^"]+\.xml)"/g)]
        .map((m) => m[1]).filter((u) => !u.includes("primary_doc"));
      for (const x of xmls) {
        const r = await fetch(`https://www.sec.gov${x}`, { headers: SEC_UA });
        if (!r.ok) continue;
        const t = await r.text();
        if (!t.includes("infoTable")) continue;
        const map: Record<string, { name: string; value: number; shares: number }> = {};
        for (const m of t.matchAll(/<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/g)) {
          const b = m[1];
          const pick = (tag: string) => {
            const mm = b.match(new RegExp(`<(?:\\w+:)?${tag}>([\\s\\S]*?)</(?:\\w+:)?${tag}>`));
            return mm ? mm[1].trim() : "";
          };
          const cusip = pick("cusip").toUpperCase();
          if (!cusip) continue;
          const num = (s: string) => Number(String(s).replace(/[^0-9]/g, "")) || 0;
          const cur = map[cusip] || (map[cusip] = { name: pick("nameOfIssuer"), value: 0, shares: 0 });
          cur.value += num(pick("value"));
          cur.shares += num(pick("sshPrnamt"));
        }
        if (Object.keys(map).length) return map;
      }
      return null;
    };

    if (action === "sec-13f") {
      const id = String(body.id || "brk");
      const inst = INSTITUTIONS.find((i) => i.id === id);
      if (!inst) return err("institution_not_found", 404);
      const key = `sec:13f:v2:${id}`;
      const cached = await cacheGet(key, 24 * 3600_000);   // 분기 데이터 → 하루 캐시로 충분
      if (cached) return ok(cached, 200, CACHE_HIT);
      try {
        const sr = await fetch(`https://data.sec.gov/submissions/CIK${inst.cik}.json`, { headers: SEC_UA });
        if (!sr.ok) throw new Error(`sec_${sr.status}`);
        const sub = await sr.json();
        const rec = sub.filings?.recent ?? {};
        // reportDate = 분기말 기준일(예: 2026-03-31). filingDate(제출일)와 구분해야 한다.
        // 13F는 "그 시점의 보유 스냅샷"이라 매매 날짜·매입단가는 존재하지 않는다.
        const f13: { acc: string; date: string; period: string }[] = [];
        for (let i = 0; i < (rec.form?.length || 0) && f13.length < 2; i++) {
          if (String(rec.form[i]).startsWith("13F-HR")) {
            f13.push({
              acc: rec.accessionNumber[i],
              date: rec.filingDate[i],
              period: rec.reportDate?.[i] || "",
            });
          }
        }
        if (!f13.length) return err("no_13f", 404);

        const cur = await fetch13fHoldings(inst.cik, f13[0].acc);
        if (!cur) throw new Error("holdings_parse");
        const prev = f13[1] ? await fetch13fHoldings(inst.cik, f13[1].acc) : null;

        const total = Object.values(cur).reduce((s, h) => s + h.value, 0);
        // 13F의 value는 "분기말 시가 평가액"이지 매입 원가가 아니다.
        // value/shares = 분기말 주당 평가액(= 사실상 분기말 종가). 매입 단가로 오해되지 않도록
        // 필드명을 endPrice로 두고, 화면에서도 '분기말'을 명시한다.
        const endPrice = (h: { value: number; shares: number }) =>
          h.shares ? Number((h.value / h.shares).toFixed(2)) : 0;

        const top = Object.entries(cur)
          .map(([cusip, h]) => ({ cusip, name: h.name, value: h.value, shares: h.shares,
            endPrice: endPrice(h),
            weight: total ? Number((h.value / total * 100).toFixed(1)) : 0 }))
          .sort((a, b) => b.value - a.value).slice(0, 15);

        let added: any[] = [], exited: any[] = [], changed: any[] = [];
        if (prev) {
          added = Object.entries(cur).filter(([c]) => !prev[c])
            .map(([c, h]) => ({ cusip: c, name: h.name, value: h.value, shares: h.shares,
              endPrice: endPrice(h) }))
            .sort((a, b) => b.value - a.value).slice(0, 10);
          exited = Object.entries(prev).filter(([c]) => !cur[c])
            .map(([c, h]) => ({ cusip: c, name: h.name, prevValue: h.value, prevShares: h.shares,
              prevEndPrice: endPrice(h) }))
            .sort((a, b) => b.prevValue - a.prevValue).slice(0, 10);
          changed = Object.entries(cur).filter(([c]) => prev[c] && prev[c].shares !== cur[c].shares)
            .map(([c, h]) => {
              const p = prev[c];
              const diff = h.shares - p.shares;
              return { cusip: c, name: h.name, shares: h.shares, diff,
                pct: p.shares ? Number((diff / p.shares * 100).toFixed(1)) : 0,
                value: h.value, endPrice: endPrice(h) };
            })
            .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 10);
        }

        const data = {
          inst: { id: inst.id, name: inst.name, who: inst.who },
          filedAt: f13[0].date,            // 제출일
          period: f13[0].period,           // 보유 기준일(분기말)
          prevFiledAt: f13[1]?.date || "",
          prevPeriod: f13[1]?.period || "", // 직전 분기말 → 매매는 이 두 날짜 사이에 발생
          totalValue: total, count: Object.keys(cur).length,
          top, added, exited, changed,
        };
        await cacheSet(key, data);
        return ok(data, 200, CACHE_MISS);
      } catch (_e) {
        const stale = await cacheGetStale(key);
        if (stale) return ok(stale, 200, CACHE_HIT);
        return err("sec_unavailable", 502);
      }
    }

    if (action === "sec-13f-list") {
      return ok(INSTITUTIONS.map((i) => ({ id: i.id, name: i.name, who: i.who })));
    }

    // 티커 → CIK 매핑(SEC 공식 목록, 7일 캐시). 미국 기업 모니터링·내부자 조회의 공통 기반.
    const getTickerCik = async (ticker: string): Promise<string | null> => {
      let map = await cacheGet("sec:tickers", 7 * 24 * 3600_000) as Record<string, string> | null;
      if (!map) {
        const tr = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: SEC_UA });
        if (!tr.ok) return null;
        const raw = await tr.json();
        map = {};
        for (const k of Object.keys(raw)) map[raw[k].ticker] = String(raw[k].cik_str).padStart(10, "0");
        await cacheSet("sec:tickers", map);
      }
      return map[ticker] || null;
    };

    // 미국 기업 조회(티커 → 회사명·CIK·거래소). 모니터링 카드 추가 시 사용.
    if (action === "sec-company") {
      const ticker = String(body.ticker || "").toUpperCase();
      if (!/^[A-Z.\-]{1,10}$/.test(ticker)) return err("ticker_required");
      const cik = await getTickerCik(ticker);
      if (!cik) return err("ticker_not_found", 404);
      const key = `sec:company:${ticker}`;
      const cached = await cacheGet(key, 7 * 24 * 3600_000);
      if (cached) return ok(cached, 200, CACHE_HIT);
      const r = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: SEC_UA });
      if (!r.ok) return err("sec_unavailable", 502);
      const d = await r.json();
      const data = { ticker, cik, name: d.name || ticker, exchange: (d.exchanges || [])[0] || "US" };
      await cacheSet(key, data);
      return ok(data, 200, CACHE_MISS);
    }

    // 미국 기업 최근 공시(8-K·10-Q·10-K 등). DART 공시 카드와 같은 자리에 표시.
    if (action === "sec-filings") {
      const ticker = String(body.ticker || "").toUpperCase();
      if (!/^[A-Z.\-]{1,10}$/.test(ticker)) return err("ticker_required");
      const key = `sec:filings:${ticker}`;
      const cached = await cacheGet(key, 30 * 60_000);
      if (cached) return ok(cached, 200, CACHE_HIT);
      try {
        const cik = await getTickerCik(ticker);
        if (!cik) return err("ticker_not_found", 404);
        const r = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: SEC_UA });
        if (!r.ok) throw new Error(`sec_${r.status}`);
        const d = await r.json();
        const rec = d.filings?.recent ?? {};
        // 투자 판단에 의미 있는 서식만(정기보고·수시공시·지분·증권신고)
        const KEEP = ["8-K", "10-Q", "10-K", "S-1", "SC 13D", "SC 13G", "DEF 14A", "6-K", "20-F"];
        const rows: any[] = [];
        for (let i = 0; i < (rec.form?.length || 0) && rows.length < 15; i++) {
          const form = rec.form[i];
          if (!KEEP.some((f) => String(form).startsWith(f))) continue;
          const acc = String(rec.accessionNumber[i] || "");
          // 제목: 문서설명 → 8-K 항목코드(items) 순. 서식명과 같으면 중복이라 비운다.
          const desc = rec.primaryDocDescription?.[i] || "";
          const items = rec.items?.[i] || "";
          const title = (desc && desc !== form) ? desc : items;
          rows.push({
            form,
            date: String(rec.filingDate[i] || "").replace(/-/g, ""),   // YYYYMMDD (DART와 동일 포맷)
            title,
            url: `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, "")}/${acc.replace(/-/g, "")}/${rec.primaryDocument[i]}`,
          });
        }
        const data = { ticker, name: d.name || ticker, rows };
        await cacheSet(key, data);
        return ok(data, 200, CACHE_MISS);
      } catch (_e) {
        const stale = await cacheGetStale(key);
        if (stale) return ok(stale, 200, CACHE_HIT);
        return err("sec_unavailable", 502);
      }
    }

    // 종목별 내부자 거래(티커) — 내 보유·관심 종목 확인용
    if (action === "sec-insider-stock") {
      const ticker = String(body.ticker || "").toUpperCase();
      if (!/^[A-Z.\-]{1,10}$/.test(ticker)) return err("ticker_required");
      const key = `sec:insider:${ticker}`;
      const cached = await cacheGet(key, 30 * 60_000);
      if (cached) return ok(cached, 200, CACHE_HIT);
      try {
        const cik = await getTickerCik(ticker);
        if (!cik) return err("ticker_not_found", 404);
        const r = await fetch(
          `https://efts.sec.gov/LATEST/search-index?forms=4&ciks=${cik}&from=0&size=20`, { headers: SEC_UA });
        if (!r.ok) throw new Error(`efts_${r.status}`);
        const hits = (await r.json())?.hits?.hits ?? [];
        // 한 신고에 분할 체결이 여러 건 담겨 수백 건이 되기도 한다 → 금액 상위 50건만 전송
        const rows = (await fetchForm4Docs(hits)).slice(0, 50);
        const data = { ticker, builtAt: new Date().toISOString(), rows };
        await cacheSet(key, data);
        return ok(data, 200, CACHE_MISS);
      } catch (_e) {
        const stale = await cacheGetStale(key);
        if (stale) return ok(stale, 200, CACHE_HIT);
        return err("sec_unavailable", 502);
      }
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
