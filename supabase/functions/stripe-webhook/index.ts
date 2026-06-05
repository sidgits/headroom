// Stripe webhook — handles checkout.session.completed.
// Marks subscription active and sends a payment-success email.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("Stripe");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Missing Stripe config", { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400, headers: corsHeaders });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400, headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || session.customer_email || undefined;
      const name = session.customer_details?.name || undefined;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const userId = session.metadata?.user_id && session.metadata.user_id !== "guest" ? session.metadata.user_id : null;

      const amount = session.amount_total
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: (session.currency || "usd").toUpperCase() }).format(session.amount_total / 100)
        : undefined;

      // Upsert subscriber
      if (email) {
        let periodEnd: string | null = null;
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          } catch (e) {
            console.error("subscription retrieve failed", e);
          }
        }
        await admin.from("subscribers").upsert(
          {
            user_id: userId,
            email,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            status: "active",
            current_period_end: periodEnd,
          },
          { onConflict: "email" }
        );

        // Send payment success email
        try {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "payment-success",
              recipientEmail: email,
              idempotencyKey: `payment-success-${session.id}`,
              templateData: {
                name: name?.split(" ")[0],
                amount,
                dashboardUrl: "https://headroomapp.co/dashboard",
              },
            },
          });
        } catch (e) {
          console.error("send email failed", e);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook handler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
