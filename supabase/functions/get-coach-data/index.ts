// Fetch coach + calendar data for the dashboard (subscribers only).
import { corsHeaders, normalizeEmail, serviceClient, hasPaidAccess } from "../_shared/subscription.ts";
import { safeTz, tzDateKey, tzStartOfToday } from "../_shared/tz.ts";
import { buildLongitudinal } from "../_shared/longitudinal.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, reviewCode, timeZone } = await req.json();
    const tz = safeTz(timeZone);
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    const sb = serviceClient();
    if (!(await hasPaidAccess(sb, e, reviewCode))) return j({ error: "Subscription required" }, 402);

    const from = new Date(tzStartOfToday(tz).getTime() - 60 * 24 * 3600 * 1000);
    const until = new Date(tzStartOfToday(tz).getTime() + 31 * 24 * 3600 * 1000);

    const [conn, events, clt, msgs, profile, allClt] = await Promise.all([
      sb.from("calendar_connections").select("id, provider, last_synced_at, created_at").ilike("email", e).order("created_at", { ascending: false }),
      sb.from("calendar_events").select("id, title, starts_at, ends_at, attendee_count, is_recurring, location, source")
        .ilike("email", e).gte("starts_at", from.toISOString()).lte("starts_at", until.toISOString()).order("starts_at").limit(2000),
      sb.from("clt_analyses").select("*").ilike("email", e).gte("analysis_date", tzDateKey(from, tz)).lte("analysis_date", tzDateKey(until, tz)).order("analysis_date"),
      sb.from("coach_messages").select("id, role, content, parts, created_at").ilike("email", e).order("created_at").limit(100),
      sb.from("assessment_completions").select("name, archetype_name").ilike("email", e).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      // Unwindowed history powers the baseline-vs-now longitudinal view.
      sb.from("clt_analyses").select("analysis_date, daily_load_score, intrinsic_load, extraneous_load, germane_load")
        .ilike("email", e).order("analysis_date").limit(5000),
    ]);

    return j({
      connections: conn.data ?? [],
      events: events.data ?? [],
      clt: clt.data ?? [],
      messages: msgs.data ?? [],
      profile: profile.data ?? null,
      longitudinal: buildLongitudinal(allClt.data ?? []),
      timeZone: tz,
    });
  } catch (err) {
    console.error("get-coach-data", err);
    return j({ error: (err as Error).message }, 500);
  }
});
function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
