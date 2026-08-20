// Exchanges the Google OAuth code for tokens and stores the calendar connection.
import { corsHeaders, serviceClient, normalizeEmail } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state") ?? "";
  const oauthError = url.searchParams.get("error");

  let email = "";
  let redirectTo = "";
  let reviewCode = "";
  try {
    const parsed = JSON.parse(atob(rawState));
    email = normalizeEmail(parsed.email) ?? "";
    redirectTo = typeof parsed.redirectTo === "string" ? parsed.redirectTo : "";
    reviewCode = typeof parsed.reviewCode === "string" ? parsed.reviewCode : "";
  } catch {
    /* ignore */
  }

  const back = (params: Record<string, string>) => {
    const base = redirectTo || "https://www.headroomapp.co/dashboard";
    const target = new URL(base);
    if (reviewCode) target.searchParams.set("review", reviewCode);
    for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
    return new Response(null, { status: 302, headers: { Location: target.toString() } });
  };

  if (oauthError) return back({ calendar: "denied" });
  if (!code || !email) return back({ calendar: "error" });

  try {
    const clientId = (Deno.env.get("GOOGLE_CLIENT_ID") ?? "").trim();
    const clientSecret = (Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "").trim();
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-oauth-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("google token exchange failed", tokenRes.status, JSON.stringify(token));
      return back({ calendar: "error" });
    }

    const sb = serviceClient();
    const expiresAt = new Date(Date.now() + ((token.expires_in ?? 3600) as number) * 1000).toISOString();

    const { data: existing } = await sb
      .from("calendar_connections")
      .select("id, google_refresh_token")
      .ilike("email", email)
      .eq("provider", "google")
      .maybeSingle();

    if (existing) {
      await sb.from("calendar_connections").update({
        google_access_token: token.access_token,
        google_refresh_token: token.refresh_token ?? existing.google_refresh_token,
        google_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await sb.from("calendar_connections").insert({
        email,
        provider: "google",
        google_access_token: token.access_token,
        google_refresh_token: token.refresh_token ?? null,
        google_token_expires_at: expiresAt,
      });
    }

    return back({ calendar: "connected" });
  } catch (err) {
    console.error("google-oauth-callback", err);
    return back({ calendar: "error" });
  }
});
