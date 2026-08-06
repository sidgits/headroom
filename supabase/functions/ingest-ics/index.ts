// Save an ICS connection (URL or pasted content) and trigger sync.
import { corsHeaders, normalizeEmail, serviceClient, isActiveSubscriber } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, icsUrl, icsContent } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    if (!icsUrl && !icsContent) return j({ error: "Provide icsUrl or icsContent" }, 400);
    if (icsUrl && typeof icsUrl !== "string") return j({ error: "Invalid ICS URL" }, 400);
    if (icsContent && typeof icsContent !== "string") return j({ error: "Invalid ICS file" }, 400);
    if (typeof icsContent === "string") {
      if (!icsContent.trim()) return j({ error: "The selected ICS file is empty" }, 400);
      if (!/BEGIN:VCALENDAR/i.test(icsContent) || !/BEGIN:VEVENT/i.test(icsContent)) {
        return j({ error: "The selected file does not contain calendar events" }, 400);
      }
    }

    const sb = serviceClient();
    if (!(await isActiveSubscriber(sb, e))) return j({ error: "Subscription required" }, 402);

    // Validate first, then replace any prior ICS connection so a bad upload
    // cannot erase a previously working calendar.
    const { error: deleteError } = await sb.from("calendar_connections").delete().ilike("email", e).eq("provider", "ics");
    if (deleteError) throw deleteError;
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
