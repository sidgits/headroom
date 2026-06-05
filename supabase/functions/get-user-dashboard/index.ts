// Returns assessment completions + dashboard checkins for a given email.
// No JWT required — identifies the user purely by their stored email.
// Uses service role to bypass RLS.
//
// Hardening:
//  - DB-backed rate limit per (IP + email) to mitigate enumeration.
//  - Daily check-in insert tolerates the email-only case (no user_id).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, clientIp } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json().catch(() => ({}));
    const trimmed = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-IP burst limit (defence-in-depth against enumeration), plus a
    // tighter per-(IP+email) limit so a single attacker can't sweep many
    // addresses from the same IP.
    const ip = clientIp(req);
    const ipLimit = await checkRateLimit({
      action: "get-user-dashboard:ip",
      identifier: ip,
      max: 60,
      windowMs: 60 * 60 * 1000, // 60 requests / hour / IP
    });
    if (ipLimit.limited) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Try again later." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(ipLimit.retryAfterMs / 1000)),
          },
        },
      );
    }
    const pairLimit = await checkRateLimit({
      action: "get-user-dashboard:ip_email",
      identifier: `${ip}|${trimmed}`,
      max: 20,
      windowMs: 10 * 60 * 1000, // 20 requests / 10 min / (IP, email)
    });
    if (pairLimit.limited) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Try again later." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(pairLimit.retryAfterMs / 1000)),
          },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [completionsRes, checkinsRes] = await Promise.all([
      supabase
        .from("assessment_completions")
        .select("id, role, archetype_id, archetype_name, created_at, name, email, result_data")
        .ilike("email", trimmed)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("dashboard_checkins")
        .select("id, created_at")
        .ilike("email", trimmed)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    // Best-effort daily check-in log. user_id is nullable now, so email-only
    // visits record a checkin without a session.
    try {
      const today = new Date().toISOString().slice(0, 10);
      const alreadyToday = (checkinsRes.data ?? []).some(
        (c: { created_at?: string }) => (c.created_at ?? "").slice(0, 10) === today,
      );
      if (!alreadyToday) {
        await supabase.from("dashboard_checkins").insert({ email: trimmed });
      }
    } catch (_) {
      // ignore — non-critical
    }

    return new Response(
      JSON.stringify({
        completions: completionsRes.data ?? [],
        checkins: checkinsRes.data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    console.error("get-user-dashboard error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
