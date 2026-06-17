// Shared helper: verify an email belongs to an active subscriber.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function isActiveSubscriber(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("subscribers")
    .select("status, current_period_end")
    .ilike("email", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  if (!["active", "trialing"].includes(data.status as string)) return false;
  if (data.current_period_end && new Date(data.current_period_end as string) < new Date()) return false;
  return true;
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
