// Creates a Stripe Checkout Session (monthly subscription)
// Picks the India price for India IPs, global price otherwise.
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
    const stripeKey = Deno.env.get("Stripe");
    if (!stripeKey) throw new Error("Stripe secret key not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("Not authenticated");

    const isIndia = await detectIndia(req);
    const priceId = isIndia ? PRICE_INDIA : PRICE_GLOBAL;
    const region = isIndia ? "IN" : "GLOBAL";

    // Reuse existing customer if any
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = existing.data[0]?.id;

    const origin = req.headers.get("origin") || "https://headroomapp.co";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: { user_id: user.id, region },
      subscription_data: { metadata: { user_id: user.id, region } },
    });

    return new Response(JSON.stringify({ url: session.url, region }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("create-checkout error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
