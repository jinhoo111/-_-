import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENC = new TextEncoder();
const DEC = new TextDecoder();

async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = ENC.encode(secret.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptKey(plaintext: string, secret: string) {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, ENC.encode(plaintext));
  return {
    iv: btoa(String.fromCharCode(...iv)),
    encrypted_key: btoa(String.fromCharCode(...new Uint8Array(buf))),
  };
}

async function decryptKey(encrypted_key: string, iv: string, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const ivBuf = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const encBuf = Uint8Array.from(atob(encrypted_key), (c) => c.charCodeAt(0));
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBuf }, key, encBuf);
  return DEC.decode(dec);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const body = await req.json();
    const { action, service, key, path, params, query } = body;

    const SECRET = Deno.env.get("ENCRYPTION_SECRET") ?? "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── 키 저장
    if (action === "store-key") {
      const enc = await encryptKey(key, SECRET);
      const { error } = await sb.from("api_keys").upsert({
        service,
        ...enc,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── 키 존재 확인
    if (action === "key-exists") {
      const { data } = await sb.from("api_keys").select("service").eq("service", service).maybeSingle();
      return new Response(JSON.stringify({ exists: !!data }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── 키 삭제
    if (action === "delete-key") {
      await sb.from("api_keys").delete().eq("service", service);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── 네이버 종목 검색 (CORS 우회 프록시)
    if (action === "naver-search") {
      const url = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(query ?? "")}&target=stock`;
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://finance.naver.com/",
          "Accept": "application/json",
        },
      });
      if (!r.ok) throw new Error(`naver_ac_error:${r.status}`);
      const data = await r.json();
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── API 프록시 호출
    if (action === "call") {
      const { data: row, error } = await sb
        .from("api_keys")
        .select("encrypted_key, iv")
        .eq("service", service)
        .single();

      if (error || !row) {
        return new Response(JSON.stringify({ error: "fh_auth" }), {
          status: 401,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      const apiKey = await decryptKey(row.encrypted_key, row.iv, SECRET);

      // Finnhub REST 프록시
      if (service === "finnhub") {
        const qs = new URLSearchParams({ ...(params ?? {}), token: apiKey });
        const r = await fetch(`https://finnhub.io/api/v1/${path}?${qs}`);
        if (r.status === 401) {
          return new Response(JSON.stringify({ error: "fh_auth" }), {
            status: 401,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }
        const d = await r.json();
        return new Response(JSON.stringify(d), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Google AI (Gemini) 프록시
      if (service === "googleai") {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }
        );
        const d = await r.json();
        return new Response(JSON.stringify(d), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
