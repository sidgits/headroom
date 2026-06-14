// Admin-triggered: revoke sessions for all users without an active subscription.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { password } = await req.json().catch(() => ({}));
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword || password !== adminPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Collect paid user ids
    const { data: paid, error: paidErr } = await admin
      .from("subscribers")
      .select("user_id")
      .in("status", ["active", "trialing"]);
    if (paidErr) throw paidErr;
    const paidIds = new Set((paid ?? []).map((r) => r.user_id).filter(Boolean));

    // Paginate auth users
    let page = 1;
    const perPage = 200;
    let signedOut = 0;
    let total = 0;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      if (users.length === 0) break;
      for (const u of users) {
        total++;
        if (!paidIds.has(u.id)) {
          const { error: soErr } = await admin.auth.admin.signOut(u.id, "global");
          if (!soErr) signedOut++;
          else console.error("signOut failed", u.id, soErr.message);
        }
      }
      if (users.length < perPage) break;
      page++;
    }

    return new Response(JSON.stringify({ ok: true, total, signedOut, paid: paidIds.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
