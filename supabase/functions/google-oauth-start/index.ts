// Returns a Google OAuth consent URL for connecting the user's Google Calendar (read-only).
import { corsHeaders, normalizeEmail, serviceClient, hasPaidAccess } from "../_shared/subscription.ts";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, reviewCode, redirectTo } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);

    const sb = serviceClient();
    if (!(await hasPaidAccess(sb, e, reviewCode))) return j({ error: "Subscription required" }, 402);

    const clientId = (Deno.env.get("GOOGLE_CLIENT_ID") ?? "").trim();
    if (!clientId) return j({ error: "Google client is not configured." }, 500);

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-oauth-callback`;
    const state = btoa(JSON.stringify({
      email: e,
      redirectTo: typeof redirectTo === "string" ? redirectTo : "",
      reviewCode: typeof reviewCode === "string" ? reviewCode : "",
    }));

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("state", state);

    return j({ url: url.toString(), redirectUri });
  } catch (err) {
    console.error("google-oauth-start", err);
    return j({ error: (err as Error).message }, 500);
  }
});

function j(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
