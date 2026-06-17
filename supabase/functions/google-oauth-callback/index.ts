// Handles Google's OAuth redirect. Exchanges code for refresh token, stores connection, redirects back to app.
import { serviceClient } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  let origin = "https://headroomapp.co";
  let email = "";
  try {
    if (stateRaw) {
      const s = JSON.parse(atob(stateRaw));
      if (s.origin) origin = s.origin;
      if (s.email) email = s.email;
    }
  } catch (_) { /* ignore */ }

  const back = (status: string) =>
    Response.redirect(`${origin}/dashboard/calendar?google=${status}`, 302);

  if (err || !code || !email) return back("error");

  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

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
    const tok = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("token exchange failed", tok);
      return back("error");
    }

    const sb = serviceClient();
    const expiresAt = new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString();
    await sb.from("calendar_connections").upsert(
      {
        email,
        provider: "google",
        google_refresh_token: tok.refresh_token ?? null,
        google_access_token: tok.access_token,
        google_token_expires_at: expiresAt,
      },
      { onConflict: "email" } as never,
    ).then(async (r) => {
      // fallback: if no unique, just insert
      if (r.error) {
        await sb.from("calendar_connections").insert({
          email, provider: "google",
          google_refresh_token: tok.refresh_token, google_access_token: tok.access_token,
          google_token_expires_at: expiresAt,
        });
      }
    });

    return back("connected");
  } catch (e) {
    console.error("oauth callback error", e);
    return back("error");
  }
});
