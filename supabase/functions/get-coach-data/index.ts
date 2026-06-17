// Fetch coach + calendar data for the dashboard (subscribers only).
import { corsHeaders, normalizeEmail, serviceClient, isActiveSubscriber } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    const sb = serviceClient();
    if (!(await isActiveSubscriber(sb, e))) return j({ error: "Subscription required" }, 402);

    const [conn, events, clt, msgs, profile] = await Promise.all([
      sb.from("calendar_connections").select("id, provider, last_synced_at, created_at").ilike("email", e).order("created_at", { ascending: false }),
      sb.from("calendar_events").select("id, title, starts_at, ends_at, attendee_count, is_recurring, location, source")
        .ilike("email", e).gte("starts_at", new Date().toISOString()).order("starts_at").limit(200),
      sb.from("clt_analyses").select("*").ilike("email", e).gte("analysis_date", new Date().toISOString().slice(0,10)).order("analysis_date"),
      sb.from("coach_messages").select("id, role, content, parts, created_at").ilike("email", e).order("created_at").limit(100),
      sb.from("assessment_completions").select("name, archetype_name").ilike("email", e).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    return j({
      connections: conn.data ?? [],
      events: events.data ?? [],
      clt: clt.data ?? [],
      messages: msgs.data ?? [],
      profile: profile.data ?? null,
    });
  } catch (err) {
    console.error("get-coach-data", err);
    return j({ error: (err as Error).message }, 500);
  }
});
function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
