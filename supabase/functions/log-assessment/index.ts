import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { role, archetype_id, archetype_name, email } = await req.json();

    if (!role || !archetype_id || !archetype_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: try to identify the signed-in user from the Authorization header.
    // The function deploys with verify_jwt=false so we validate the token in code.
    let user_id: string | null = null;
    let user_email: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: userData } = await userClient.auth.getUser();
        if (userData?.user) {
          user_id = userData.user.id;
          user_email = userData.user.email ?? null;
        }
      } catch {
        // Anonymous completion — user_id stays null
      }
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    let city = null;
    let region = null;
    let country = null;

    const ipstackKey = Deno.env.get("IPSTACK_API_KEY");
    if (ip && ip !== "unknown" && ip !== "127.0.0.1" && ipstackKey) {
      try {
        const geoRes = await fetch(
          `https://api.ipstack.com/${ip}?access_key=${ipstackKey}&fields=city,region_name,country_name`
        );
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (!geo.error) {
            city = geo.city || null;
            region = geo.region_name || null;
            country = geo.country_name || null;
          }
        }
      } catch {
        // Geolocation failed silently
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("assessment_completions").insert({
      role,
      archetype_id,
      archetype_name,
      // Prefer the verified signed-in email; fall back to the value provided in the body.
      email: user_email || email || null,
      user_id,
      ip_address: ip,
      city,
      region,
      country,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to log assessment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
