// Handles Microsoft's OAuth redirect. Exchanges code for tokens, stores connection, redirects back to app.
import { serviceClient } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const errDescription = url.searchParams.get("error_description");

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
    Response.redirect(`${origin}/dashboard/calendar?outlook=${status}`, 302);

  if (err || !code || !email) {
    console.error("outlook oauth callback bad request", { err, errDescription, hasCode: !!code, hasEmail: !!email });
    return back("error");
  }

  try {
    const clientId = Deno.env.get("OUTLOOK_CLIENT_ID")!.trim();
    const clientSecret = Deno.env.get("OUTLOOK_CLIENT_SECRET")!.trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const redirectUri = `${supabaseUrl}/functions/v1/outlook-oauth-callback`;

    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
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
      console.error("outlook token exchange failed", tok);
      return back("error");
    }

    const sb = serviceClient();
    const expiresAt = new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString();
    await sb.from("calendar_connections").upsert(
      {
        email,
        provider: "outlook",
        outlook_refresh_token: tok.refresh_token ?? null,
        outlook_access_token: tok.access_token,
        outlook_token_expires_at: expiresAt,
      },
      { onConflict: "email" } as never,
    ).then(async (r) => {
      if (r.error) {
        await sb.from("calendar_connections").insert({
          email, provider: "outlook",
          outlook_refresh_token: tok.refresh_token, outlook_access_token: tok.access_token,
          outlook_token_expires_at: expiresAt,
        });
      }
    });

    return back("connected");
  } catch (e) {
    console.error("outlook oauth callback error", e);
    return back("error");
  }
});
