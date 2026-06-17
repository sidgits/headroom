// Save an ICS connection (URL or pasted content) and trigger sync.
import { corsHeaders, normalizeEmail, serviceClient, isActiveSubscriber } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, icsUrl, icsContent } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    if (!icsUrl && !icsContent) return j({ error: "Provide icsUrl or icsContent" }, 400);

    const sb = serviceClient();
    if (!(await isActiveSubscriber(sb, e))) return j({ error: "Subscription required" }, 402);

    // Replace any prior ICS connection for this email.
    await sb.from("calendar_connections").delete().ilike("email", e).eq("provider", "ics");
    const { data, error } = await sb.from("calendar_connections").insert({
      email: e,
      provider: "ics",
      ics_url: icsUrl ?? null,
      ics_content: icsContent ?? null,
    }).select("id").single();
    if (error) throw error;

    return j({ ok: true, connectionId: data.id });
  } catch (err) {
    console.error("ingest-ics", err);
    return j({ error: (err as Error).message }, 500);
  }
});
function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
