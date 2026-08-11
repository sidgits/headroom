// Migrated from supabase/functions/log-share-click — internal-only analytics logger.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type ShareClickInput = { platform: string; archetype_name: string; completed: boolean };

export const logShareClick = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): ShareClickInput => {
    const { platform, archetype_name, completed } = (input ?? {}) as Record<string, unknown>;
    if (typeof platform !== "string" || !platform || typeof archetype_name !== "string" || !archetype_name) {
      throw new Error("Missing required fields");
    }
    return { platform, archetype_name, completed: completed === true };
  })
  .handler(async ({ data }) => {
    const sb = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
    const { error } = await sb.from("share_clicks").insert(data);
    if (error) {
      console.error("log-share-click insert error", error);
      return { success: false };
    }
    return { success: true };
  });
