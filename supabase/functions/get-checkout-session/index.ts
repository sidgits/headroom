// Returns email + status for a Stripe Checkout Session id.
// Used by the dashboard to recover identity after a guest checkout
// when localStorage isn't populated (different device/browser).
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("Stripe");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return new Response(JSON.stringify({ error: "invalid session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      (session.metadata?.email as string | undefined) ||
      null;

    return new Response(
      JSON.stringify({
        email,
        payment_status: session.payment_status,
        status: session.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("get-checkout-session error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
