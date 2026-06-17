// Sync upcoming events for the user's connected calendar (Google or ICS).
import { corsHeaders, normalizeEmail, serviceClient, isActiveSubscriber } from "../_shared/subscription.ts";

const DAYS_AHEAD = 14;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    const sb = serviceClient();
    if (!(await isActiveSubscriber(sb, e))) return j({ error: "Subscription required" }, 402);

    const { data: conns } = await sb
      .from("calendar_connections")
      .select("*")
      .ilike("email", e)
      .order("created_at", { ascending: false });
    if (!conns || conns.length === 0) return j({ events: 0, connections: 0 });

    let totalEvents = 0;
    for (const conn of conns) {
      // Clear existing future events
      await sb.from("calendar_events").delete().eq("connection_id", conn.id);
      const events = conn.provider === "google"
        ? await syncGoogle(sb, conn)
        : await syncIcs(sb, conn);
      totalEvents += events;
      await sb.from("calendar_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", conn.id);
    }
    return j({ events: totalEvents, connections: conns.length });
  } catch (err) {
    console.error("sync-calendar", err);
    return j({ error: (err as Error).message }, 500);
  }
});

async function syncGoogle(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>): Promise<number> {
  let access = conn.google_access_token as string | null;
  const expires = conn.google_token_expires_at ? new Date(conn.google_token_expires_at as string) : null;
  if (!access || !expires || expires < new Date()) {
    access = await refreshAccess(sb, conn);
  }
  if (!access) return 0;

  const now = new Date();
  const max = new Date(now.getTime() + DAYS_AHEAD * 24 * 3600 * 1000);
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", now.toISOString());
  url.searchParams.set("timeMax", max.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const r = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  if (!r.ok) {
    console.error("google calendar fetch failed", await r.text());
    return 0;
  }
  const j = await r.json();
  const items = j.items || [];
  const rows = items
    .filter((it: { start?: { dateTime?: string } }) => it.start?.dateTime)
    .map((it: {
      id: string; summary?: string; description?: string;
      start: { dateTime: string }; end: { dateTime: string };
      attendees?: unknown[]; recurringEventId?: string; location?: string;
    }) => ({
      connection_id: conn.id,
      email: conn.email,
      external_id: it.id,
      title: it.summary ?? "(no title)",
      description: it.description ?? null,
      starts_at: it.start.dateTime,
      ends_at: it.end.dateTime,
      attendee_count: Array.isArray(it.attendees) ? it.attendees.length : 0,
      is_recurring: !!it.recurringEventId,
      location: it.location ?? null,
      source: "google",
    }));
  if (rows.length) await sb.from("calendar_events").insert(rows);
  return rows.length;
}

async function refreshAccess(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>): Promise<string | null> {
  const refresh = conn.google_refresh_token as string | null;
  if (!refresh) return null;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  const tok = await r.json();
  if (!r.ok) { console.error("refresh failed", tok); return null; }
  const expiresAt = new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString();
  await sb.from("calendar_connections").update({
    google_access_token: tok.access_token,
    google_token_expires_at: expiresAt,
  }).eq("id", conn.id);
  return tok.access_token;
}

async function syncIcs(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>): Promise<number> {
  let text = conn.ics_content as string | null;
  if (!text && conn.ics_url) {
    const r = await fetch(conn.ics_url as string);
    if (!r.ok) return 0;
    text = await r.text();
  }
  if (!text) return 0;
  const events = parseIcs(text);
  const now = new Date(); const max = new Date(now.getTime() + DAYS_AHEAD * 24 * 3600 * 1000);
  const rows = events
    .filter((ev) => ev.start >= now && ev.start <= max)
    .map((ev) => ({
      connection_id: conn.id,
      email: conn.email,
      external_id: ev.uid,
      title: ev.summary,
      description: ev.description,
      starts_at: ev.start.toISOString(),
      ends_at: ev.end.toISOString(),
      attendee_count: ev.attendees,
      is_recurring: ev.recurring,
      location: ev.location,
      source: "ics",
    }));
  if (rows.length) await sb.from("calendar_events").insert(rows);
  return rows.length;
}

interface IcsEvent {
  uid: string; summary: string; description: string | null; location: string | null;
  start: Date; end: Date; attendees: number; recurring: boolean;
}

function parseIcs(text: string): IcsEvent[] {
  // Unfold lines (RFC 5545: lines beginning with space/tab continue prev)
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> & { _attendees?: number } | null = null;
  for (const ln of lines) {
    if (ln === "BEGIN:VEVENT") cur = { _attendees: 0 };
    else if (ln === "END:VEVENT" && cur && cur.start && cur.end) {
      events.push({
        uid: cur.uid ?? crypto.randomUUID(),
        summary: cur.summary ?? "(no title)",
        description: cur.description ?? null,
        location: cur.location ?? null,
        start: cur.start, end: cur.end,
        attendees: cur._attendees ?? 0,
        recurring: cur.recurring ?? false,
      });
      cur = null;
    } else if (cur) {
      const [keyRaw, ...rest] = ln.split(":");
      const value = rest.join(":");
      const key = keyRaw.split(";")[0];
      if (key === "UID") cur.uid = value;
      else if (key === "SUMMARY") cur.summary = unescapeIcs(value);
      else if (key === "DESCRIPTION") cur.description = unescapeIcs(value);
      else if (key === "LOCATION") cur.location = unescapeIcs(value);
      else if (key === "DTSTART") cur.start = parseIcsDate(value, keyRaw);
      else if (key === "DTEND") cur.end = parseIcsDate(value, keyRaw);
      else if (key === "ATTENDEE") cur._attendees = (cur._attendees ?? 0) + 1;
      else if (key === "RRULE") cur.recurring = true;
    }
  }
  return events;
}

function unescapeIcs(v: string) { return v.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\"); }

function parseIcsDate(v: string, key: string): Date {
  // Examples: 20251217T093000Z, 20251217T093000, 20251217 (all-day)
  if (/^\d{8}$/.test(v)) {
    return new Date(`${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}T00:00:00Z`);
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (m) {
    const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? "Z" : ""}`;
    return new Date(iso);
  }
  return new Date(v);
}

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
