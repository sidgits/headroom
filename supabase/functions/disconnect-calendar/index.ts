// Disconnect a calendar connection (and its events) for the user.
import { corsHeaders, normalizeEmail, serviceClient, hasPaidAccess } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, connectionId, reviewCode } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    const sb = serviceClient();
    if (!(await hasPaidAccess(sb, e, reviewCode))) return j({ error: "Subscription required" }, 402);

    // Only allow deleting connections that belong to this email.
    const q = sb.from("calendar_connections").select("id").ilike("email", e);
    const { data: owned, error: selErr } = connectionId ? await q.eq("id", connectionId) : await q;
    if (selErr) throw selErr;
    const ids = (owned ?? []).map((r: { id: string }) => r.id);
    if (ids.length === 0) return j({ ok: true, removed: 0 });

    await sb.from("calendar_events").delete().in("connection_id", ids);
    const { error: delErr } = await sb.from("calendar_connections").delete().in("id", ids);
    if (delErr) throw delErr;

    return j({ ok: true, removed: ids.length });
  } catch (err) {
    console.error("disconnect-calendar", err);
    return j({ error: (err as Error).message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
