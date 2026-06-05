// Creates a Stripe Checkout Session (monthly subscription)
// Picks the India price for India IPs, global price otherwise.
// No auth required — Stripe collects the email during checkout.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_INDIA = "price_1Telss6bE2gY9hpWcQjGdG3I";
const PRICE_GLOBAL = "price_1Telga6bE2gY9hpWP0hKjCWJ";

async function detectIndia(req: Request): Promise<boolean> {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (!ip) return false;
  const key = Deno.env.get("IPSTACK_API_KEY");
  if (!key) return false;
  try {
    const r = await fetch(`https://api.ipstack.com/${ip}?access_key=${key}&fields=country_code`);
    const j = await r.json();
    return j?.country_code === "IN";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("Stripe");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Optional body: email-only users (no session) can pass their stored email
    // so checkout/customer is linked to the same address as their completions.
    let bodyEmail: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.email === "string") {
        const trimmed = body.email.trim().toLowerCase();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) bodyEmail = trimmed;
      }
    } catch (_) {
      // No JSON body — fine.
    }

    // Optional auth — reuse user email/customer if signed in, otherwise let Stripe collect it.
    let userEmail: string | undefined;
    let userId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes("Bearer undefined")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data } = await supabase.auth.getUser();
        userEmail = data.user?.email ?? undefined;
        userId = data.user?.id ?? undefined;
      } catch (_) {
        // Ignore — proceed as guest
      }
    }

    // Prefer the verified session email; fall back to the email-only value.
    const effectiveEmail = userEmail ?? bodyEmail;

    const isIndia = await detectIndia(req);
    const priceId = isIndia ? PRICE_INDIA : PRICE_GLOBAL;
    const region = isIndia ? "IN" : "GLOBAL";

    let customerId: string | undefined;
    if (effectiveEmail) {
      const existing = await stripe.customers.list({ email: effectiveEmail, limit: 1 });
      customerId = existing.data[0]?.id;
    }

    const origin = req.headers.get("origin") || "https://headroomapp.co";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : effectiveEmail,
      mode: "subscription",
      // Restrict to card only. This disables Stripe Link, which otherwise
      // emails buyers a 6-digit "Link verification code" during checkout.
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: { user_id: userId ?? "guest", region, email: effectiveEmail ?? "" },
      subscription_data: { metadata: { user_id: userId ?? "guest", region, email: effectiveEmail ?? "" } },
    });

    return new Response(JSON.stringify({ url: session.url, region }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("create-checkout error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
