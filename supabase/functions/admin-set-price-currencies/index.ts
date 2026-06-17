// One-shot admin utility: adds currency_options to the GLOBAL Stripe price
// so non-India buyers see their local currency at checkout. Protected by ADMIN_PASSWORD.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_GLOBAL = "price_1Telga6bE2gY9hpWP0hKjCWJ";

// Roughly $9 USD-equivalent, rounded to friendly local amounts.
// Stripe expects the minor unit (e.g. cents, pence, paise).
const CURRENCY_OPTIONS: Record<string, number> = {
  gbp: 700,    // £7
  eur: 850,    // €8.50
  aed: 3300,   // AED 33
  sgd: 1200,   // S$12
  aud: 1400,   // A$14
  cad: 1200,   // C$12
  nzd: 1500,   // NZ$15
  chf: 800,    // CHF 8
  hkd: 7000,   // HK$70
  jpy: 1400,   // ¥1400 (zero-decimal)
  sek: 95,     // kr 95 -> 9500? jpy zero-decimal; sek is 2-decimal so 9500
};

// Fix: SEK is 2-decimal; correct value above
CURRENCY_OPTIONS.sek = 9500; // kr 95.00

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminPass = req.headers.get("x-admin-password");
  if (!adminPass || adminPass !== Deno.env.get("ADMIN_PASSWORD")) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("Stripe");
  if (!stripeKey) {
    return new Response("Stripe not configured", { status: 500, headers: corsHeaders });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  try {
    const currency_options: Record<string, { unit_amount: number }> = {};
    for (const [cur, amt] of Object.entries(CURRENCY_OPTIONS)) {
      currency_options[cur] = { unit_amount: amt };
    }
    const updated = await stripe.prices.update(PRICE_GLOBAL, {
      currency_options,
    } as any);
    return new Response(
      JSON.stringify({
        ok: true,
        price_id: updated.id,
        base_currency: updated.currency,
        base_amount: updated.unit_amount,
        currency_options: Object.keys(updated.currency_options ?? {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("admin-set-price-currencies error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
