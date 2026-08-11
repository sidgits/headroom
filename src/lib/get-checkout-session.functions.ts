// Migrated from supabase/functions/get-checkout-session — returns email + status
// for a Stripe Checkout Session id. Used by the dashboard to recover identity
// after a guest checkout when localStorage isn't populated.
// Calls the Stripe REST API directly to avoid a heavyweight SDK dependency.
import { createServerFn } from "@tanstack/react-start";

type StripeSession = {
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  metadata?: Record<string, string> | null;
  payment_status?: string;
  status?: string;
  error?: { message?: string };
};

export const getCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): { sessionId: string } => {
    const { sessionId } = (input ?? {}) as { sessionId?: unknown };
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      throw new Error("invalid session_id");
    }
    return { sessionId };
  })
  .handler(async ({ data }) => {
    const stripeKey = process.env["STRIPE_SECRET_KEY"] || process.env["Stripe"];
    if (!stripeKey) throw new Error("Stripe not configured");

    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } },
    );
    const session = (await res.json()) as StripeSession;
    if (!res.ok) {
      console.error("get-checkout-session error", session.error?.message);
      throw new Error(session.error?.message ?? "Stripe error");
    }

    const email =
      session.customer_details?.email || session.customer_email || session.metadata?.["email"] || null;

    return {
      email,
      payment_status: session.payment_status ?? null,
      status: session.status ?? null,
    };
  });
