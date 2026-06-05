// Verifies subscription status by querying Stripe and upserts subscribers table.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("Stripe");
    if (!stripeKey) throw new Error("Stripe secret key not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user?.email) throw new Error("Not authenticated");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      await admin.from("subscribers").upsert(
        { user_id: user.id, email: user.email, status: "inactive" },
        { onConflict: "email" }
      );
      return new Response(JSON.stringify({ active: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customer = customers.data[0];
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 5 });
    const active = subs.data.find((s) => ["active", "trialing"].includes(s.status));

    await admin.from("subscribers").upsert(
      {
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customer.id,
        stripe_subscription_id: active?.id ?? null,
        status: active?.status ?? "inactive",
        current_period_end: active ? new Date(active.current_period_end * 1000).toISOString() : null,
      },
      { onConflict: "email" }
    );

    return new Response(JSON.stringify({ active: !!active, status: active?.status ?? "inactive" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("check-subscription error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
