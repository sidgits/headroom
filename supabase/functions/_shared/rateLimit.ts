// Persistent, DB-backed rate limiter shared across edge functions.
// Records each attempt in `public.rate_limit_events` (service-role only) so
// the limit survives Deno isolate cold-starts, unlike an in-memory Map.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

let cached: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  return cached;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export interface RateLimitOptions {
  action: string;       // logical bucket, e.g. "verify-admin" or "get-user-dashboard"
  identifier: string;   // usually the client IP, optionally combined with an email
  max: number;          // max attempts allowed in the window
  windowMs: number;     // window size in milliseconds
}

export interface RateLimitResult {
  limited: boolean;
  count: number;
  retryAfterMs: number; // suggested Retry-After in ms (0 when not limited)
}

/**
 * Check + record a rate-limit attempt.
 *
 * Best-effort: if the DB call fails we fail OPEN (do not block the caller)
 * to avoid taking the site down on a transient DB issue. We still log it.
 */
export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { action, identifier, max, windowMs } = opts;
  const since = new Date(Date.now() - windowMs).toISOString();
  const supabase = admin();

  try {
    const { count, error } = await supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("action", action)
      .eq("identifier", identifier)
      .gte("created_at", since);

    if (error) {
      console.error("[rateLimit] read failed", action, error);
      return { limited: false, count: 0, retryAfterMs: 0 };
    }

    const used = count ?? 0;
    if (used >= max) {
      return { limited: true, count: used, retryAfterMs: windowMs };
    }

    // Record this attempt (best-effort).
    await supabase.from("rate_limit_events").insert({ action, identifier });

    return { limited: false, count: used + 1, retryAfterMs: 0 };
  } catch (e) {
    console.error("[rateLimit] unexpected error", action, e);
    return { limited: false, count: 0, retryAfterMs: 0 };
  }
}
