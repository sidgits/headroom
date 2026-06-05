// Returns assessment completions + dashboard checkins for a given email.
// No JWT required — identifies the user purely by their stored email.
// Uses service role to bypass RLS.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [completionsRes, checkinsRes, subRes] = await Promise.all([
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
      supabase
        .from("subscribers")
        .select("status, current_period_end")
        .ilike("email", trimmed)
        .maybeSingle(),
    ]);

    // Best-effort daily check-in log (idempotent per day via a unique-ish insert)
    try {
      const today = new Date().toISOString().slice(0, 10);
      const alreadyToday = (checkinsRes.data ?? []).some(
        (c: any) => (c.created_at ?? "").slice(0, 10) === today
      );
      if (!alreadyToday) {
        await supabase.from("dashboard_checkins").insert({
          email: trimmed,
          user_id: null,
        });
      }
    } catch (_) {
      // ignore
    }

    return new Response(
      JSON.stringify({
        completions: completionsRes.data ?? [],
        checkins: checkinsRes.data ?? [],
        subscriber: subRes.data ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("get-user-dashboard error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
