// Creates a Stripe Checkout Session (monthly subscription)
// Picks the India price for India IPs, global price otherwise.
// No auth required — Stripe collects the email during checkout.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_INDIA = "price_1TfXhF6bE2gY9hpWkTpCYauh";
const PRICE_GLOBAL = "price_1Telga6bE2gY9hpWP0hKjCWJ";

// Supported currency_options on the global price.
// US (and any country not listed) falls back to USD.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GB: "gbp",
  AE: "aed", SA: "aed",
  SG: "sgd",
  AU: "aud",
  CA: "cad",
  NZ: "nzd",
  CH: "chf",
  HK: "hkd",
  JP: "jpy",
  SE: "sek",
  // Eurozone
  DE: "eur", FR: "eur", ES: "eur", IT: "eur", NL: "eur", BE: "eur",
  IE: "eur", PT: "eur", AT: "eur", FI: "eur", GR: "eur", LU: "eur",
  EE: "eur", LV: "eur", LT: "eur", SK: "eur", SI: "eur", CY: "eur", MT: "eur", HR: "eur",
};

async function detectCountry(req: Request): Promise<string | null> {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (!ip) return null;
  const key = Deno.env.get("IPSTACK_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch(`https://api.ipstack.com/${ip}?access_key=${key}&fields=country_code`);
    const j = await r.json();
    return (j?.country_code as string) ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const origin = req.headers.get("origin") || "https://headroomapp.co";
    // ─── TEST BYPASS ──────────────────────────────────────────────────────────
    // On lovable preview/test URLs, skip Stripe entirely so we can validate the
    // post-payment flow end-to-end. Mark the user (or email) as active in
    // subscribers and route straight to the dashboard success state.
    const isTestEnv = (() => {
      try {
        const host = new URL(origin).hostname;
        return (
          host.endsWith(".lovable.app") ||
          host.endsWith(".lovableproject.com") ||
          host === "localhost" ||
          host === "127.0.0.1"
        );
      } catch {
        return false;
      }
    })();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("Stripe");
    if (!stripeKey && !isTestEnv) {
      return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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

    const country = await detectCountry(req);
    const isIndia = country === "IN";
    const region = isIndia ? "IN" : "GLOBAL";
    // For non-India, pick a local currency from the global price's currency_options
    // when the buyer's country maps to one; otherwise default to USD.
    const localCurrency = !isIndia && country ? COUNTRY_TO_CURRENCY[country] : undefined;

    // ─── TEST BYPASS branch ───────────────────────────────────────────────────
    if (isTestEnv) {
      console.log("create-checkout: TEST BYPASS active for origin", origin);
      try {
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        if (effectiveEmail) {
          const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await admin.from("subscribers").upsert(
            {
              user_id: userId ?? null,
              email: effectiveEmail,
              region,
              status: "active",
              current_period_end: periodEnd,
            },
            { onConflict: "email" },
          );
        }
      } catch (e) {
        console.error("create-checkout test bypass upsert failed", e);
      }
      return new Response(
        JSON.stringify({
          url: `${origin}/dashboard?checkout=success&test=1`,
          region,
          test: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const stripe = new Stripe(stripeKey!, { apiVersion: "2024-06-20" });
    const priceId = isIndia ? PRICE_INDIA : PRICE_GLOBAL;

    let customerId: string | undefined;
    if (effectiveEmail) {
      const existing = await stripe.customers.list({ email: effectiveEmail, limit: 1 });
      customerId = existing.data[0]?.id;
    }


    // For India subscriptions, enable UPI Autopay (e-mandate) alongside cards.
    // UPI on recurring requires explicit payment_method_types + mandate options.
    const paymentMethodTypes = isIndia ? ["card", "upi"] : undefined;
    const paymentMethodOptions = isIndia
      ? {
          upi: {
            mandate_options: {
              amount: 50000,        // ₹500 cap in paise (above ₹300 price)
              amount_type: "maximum",
            },
          },
        }
      : undefined;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : effectiveEmail,
      mode: "subscription",
      payment_method_types: paymentMethodTypes as any,
      payment_method_options: paymentMethodOptions as any,
      line_items: [{ price: priceId, quantity: 1 }],
      currency: localCurrency, // undefined => Stripe uses price's base currency (USD / INR)
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: { user_id: userId ?? "guest", region, country: country ?? "", currency: localCurrency ?? (isIndia ? "inr" : "usd"), email: effectiveEmail ?? "" },
      subscription_data: { metadata: { user_id: userId ?? "guest", region, country: country ?? "", currency: localCurrency ?? (isIndia ? "inr" : "usd"), email: effectiveEmail ?? "" } },
    });

    return new Response(JSON.stringify({ url: session.url, region, country, currency: localCurrency ?? (isIndia ? "inr" : "usd") }), {
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
