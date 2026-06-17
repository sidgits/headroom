// Returns the Google OAuth consent URL for connecting Calendar.
import { corsHeaders, normalizeEmail, serviceClient, isActiveSubscriber } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, redirectOrigin } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return json({ error: "Invalid email" }, 400);

    const sb = serviceClient();
    if (!(await isActiveSubscriber(sb, e))) return json({ error: "Subscription required" }, 402);

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    if (!clientId) return json({ error: "Google OAuth not configured" }, 500);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    const state = btoa(JSON.stringify({ email: e, origin: redirectOrigin || "" }));
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      state,
    });
    return json({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      redirectUri,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
