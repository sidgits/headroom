// Server-side corporate domain verification. The corporate_domains list is not
// readable by anon/authenticated clients; this returns only a boolean.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const verifyCorporateDomain = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): { email: string } => {
    const { email } = (input ?? {}) as Record<string, unknown>;
    if (typeof email !== "string") throw new Error("Invalid email");
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error("Invalid email");
    }
    return { email: trimmed };
  })
  .handler(async ({ data }) => {
    const domain = data.email.split("@")[1] ?? "";
    if (!domain) return { allowed: false };
    const sb = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
    const { data: row, error } = await sb
      .from("corporate_domains")
      .select("id")
      .ilike("domain", domain)
      .maybeSingle();
    if (error) {
      console.error("verify-corporate-domain error", error);
      throw new Error("Verification failed");
    }
    return { allowed: !!row };
  });
