// Sync upcoming events for the user's connected calendar (Google or ICS).
import { corsHeaders, normalizeEmail, serviceClient, hasPaidAccess } from "../_shared/subscription.ts";
import { safeTz, tzStartOfToday, tzStartOfWeek } from "../_shared/tz.ts";

const DAYS_AHEAD = 30;
const DAYS_BACK = 60;
const windowStartFrom = (tz: string) =>
  new Date(tzStartOfToday(tz).getTime() - DAYS_BACK * 24 * 3600 * 1000);

// Live provider syncs (Google) cover this week + next week only — the window a
// person can still act on, and small enough to refresh on every visit.
const liveWindow = (tz: string) => {
  const start = tzStartOfWeek(tz);
  return { start, end: new Date(start.getTime() + 14 * 24 * 3600 * 1000) };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, reviewCode, timeZone } = await req.json();
    const tz = safeTz(timeZone);
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    const sb = serviceClient();
    if (!(await hasPaidAccess(sb, e, reviewCode))) return j({ error: "Subscription required" }, 402);

    const { data: conns } = await sb
      .from("calendar_connections")
      .select("*")
      .ilike("email", e)
      .order("created_at", { ascending: false });
    if (!conns || conns.length === 0) return j({ events: 0, connections: 0 });

    let totalEvents = 0;
    const errors: string[] = [];
    for (const conn of conns) {
      // Clear only the events this sync will actually re-fetch. Live provider
      // syncs cover this week + next week, so anything older must be kept —
      // it is the person's longitudinal history.
      let del = sb.from("calendar_events").delete().eq("connection_id", conn.id);
      if (conn.provider === "google") {
        const { start, end } = liveWindow(tz);
        del = del.gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString());
      }
      const { error: deleteError } = await del;
      if (deleteError) throw deleteError;
      let events = 0;
      if (conn.provider === "google") events = await syncGoogle(sb, conn, errors, tz);
      else if (conn.provider === "outlook") events = await syncOutlook(sb, conn, errors, tz);
      else events = await syncIcs(sb, conn, errors, tz);
      totalEvents += events;
      await sb.from("calendar_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", conn.id);
    }
    return j({ events: totalEvents, connections: conns.length, errors });
  } catch (err) {
    console.error("sync-calendar", err);
    return j({ error: (err as Error).message }, 500);
  }
});

function providerMessage(status: number, body: string): string {
  if (body.includes("has not been used in project") || body.includes("SERVICE_DISABLED")) {
    return "Calendar API is not enabled for this app yet. We've been notified — no action needed on your side.";
  }
  if (status === 401 || status === 403) return "Calendar access was denied or expired. Please disconnect and reconnect.";
  return `Calendar provider error (${status}).`;
}

async function syncGoogle(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>, errors: string[] = [], tz = "UTC"): Promise<number> {
  let access = conn.google_access_token as string | null;
  const expires = conn.google_token_expires_at ? new Date(conn.google_token_expires_at as string) : null;
  if (!access || !expires || expires < new Date()) {
    access = await refreshAccess(sb, conn);
  }
  if (!access) { errors.push("Google access expired. Please disconnect and reconnect your calendar."); return 0; }

  const { start: now, end: max } = liveWindow(tz);

  // Collect the calendars the user actually looks at (primary + any selected ones).
  let calendarIds: string[] = ["primary"];
  const listRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&maxResults=250",
    { headers: { Authorization: `Bearer ${access}` } },
  );
  if (listRes.ok) {
    const list = await listRes.json();
    const ids = (list.items ?? [])
      .filter((c: { selected?: boolean; primary?: boolean }) => c.selected !== false || c.primary)
      .map((c: { id: string }) => c.id)
      .filter(Boolean);
    if (ids.length) calendarIds = Array.from(new Set(ids));
  } else {
    const body = await listRes.text();
    console.error("google calendarList failed", listRes.status, body);
    errors.push(providerMessage(listRes.status, body));
    return 0;
  }

  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const calId of calendarIds) {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
    );
    url.searchParams.set("timeMin", now.toISOString());
    url.searchParams.set("timeMax", max.toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "250");

    const r = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
    if (!r.ok) {
      const body = await r.text();
      console.error("google calendar fetch failed", calId, r.status, body);
      // A single inaccessible calendar shouldn't fail the whole sync.
      if (calendarIds.length === 1) errors.push(providerMessage(r.status, body));
      continue;
    }
    const j = await r.json();
    for (const it of (j.items ?? []) as Array<{
      id: string; iCalUID?: string; status?: string; summary?: string; description?: string;
      start: { dateTime?: string }; end: { dateTime?: string };
      attendees?: unknown[]; recurringEventId?: string; location?: string;
    }>) {
      if (it.status === "cancelled") continue;
      if (!it.start?.dateTime || !it.end?.dateTime) continue;
      const key = `${it.iCalUID ?? it.id}|${it.start.dateTime}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
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
      });
    }
  }
  if (rows.length) {
    const { error } = await sb.from("calendar_events").insert(rows);
    if (error) throw error;
  }
  return rows.length;
}


async function refreshAccess(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>): Promise<string | null> {
  const refresh = conn.google_refresh_token as string | null;
  if (!refresh) return null;
  const clientId = (Deno.env.get("GOOGLE_CLIENT_ID") ?? "").trim();
  const clientSecret = (Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "").trim();
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
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

async function syncOutlook(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>, errors: string[] = [], tz = "UTC"): Promise<number> {
  let access = conn.outlook_access_token as string | null;
  const expires = conn.outlook_token_expires_at ? new Date(conn.outlook_token_expires_at as string) : null;
  if (!access || !expires || expires < new Date()) {
    access = await refreshOutlookAccess(sb, conn);
  }
  if (!access) { errors.push("Outlook access expired. Please disconnect and reconnect your calendar."); return 0; }

  const now = windowStartFrom(tz);
  const max = new Date(Date.now() + DAYS_AHEAD * 24 * 3600 * 1000);
  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarview");
  url.searchParams.set("startDateTime", now.toISOString());
  url.searchParams.set("endDateTime", max.toISOString());
  url.searchParams.set("$select", "id,subject,start,end,attendees,location,recurrence");
  url.searchParams.set("$top", "250");

  const r = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  if (!r.ok) {
    const body = await r.text();
    console.error("outlook calendar fetch failed", body);
    errors.push(providerMessage(r.status, body));
    return 0;
  }
  const j = await r.json();
  const items = j.value || [];
  const rows = items
    .filter((it: { start?: { dateTime?: string } }) => it.start?.dateTime)
    .map((it: {
      id: string; subject?: string; bodyPreview?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees?: unknown[]; location?: { displayName?: string }; recurrence?: unknown;
    }) => ({
      connection_id: conn.id,
      email: conn.email,
      external_id: it.id,
      title: it.subject ?? "(no title)",
      description: it.bodyPreview ?? null,
      starts_at: new Date(it.start.dateTime).toISOString(),
      ends_at: new Date(it.end.dateTime).toISOString(),
      attendee_count: Array.isArray(it.attendees) ? it.attendees.length : 0,
      is_recurring: !!it.recurrence,
      location: it.location?.displayName ?? null,
      source: "outlook",
    }));
  if (rows.length) {
    const { error } = await sb.from("calendar_events").insert(rows);
    if (error) throw error;
  }
  return rows.length;
}

async function refreshOutlookAccess(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>): Promise<string | null> {
  const refresh = conn.outlook_refresh_token as string | null;
  if (!refresh) return null;
  const r = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("OUTLOOK_CLIENT_ID")!,
      client_secret: Deno.env.get("OUTLOOK_CLIENT_SECRET")!,
      refresh_token: refresh,
      grant_type: "refresh_token",
      scope: ["openid", "profile", "email", "offline_access", "Calendars.Read"].join(" "),
    }),
  });
  const tok = await r.json();
  if (!r.ok) { console.error("outlook refresh failed", tok); return null; }
  const expiresAt = new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString();
  await sb.from("calendar_connections").update({
    outlook_access_token: tok.access_token,
    outlook_token_expires_at: expiresAt,
    ...(tok.refresh_token ? { outlook_refresh_token: tok.refresh_token } : {}),
  }).eq("id", conn.id);
  return tok.access_token;
}

async function syncIcs(sb: ReturnType<typeof serviceClient>, conn: Record<string, unknown>, errors: string[] = [], tz = "UTC"): Promise<number> {
  let text = conn.ics_content as string | null;
  if (!text && conn.ics_url) {
    // Some providers only serve ICS over webcal:// — normalize to https.
    const raw = (conn.ics_url as string).trim().replace(/^webcal:\/\//i, "https://");
    let r: Response;
    try {
      r = await fetch(raw, { headers: { "User-Agent": "HeadroomCalendar/1.0", Accept: "text/calendar,*/*" } });
    } catch {
      errors.push("Could not reach the ICS URL. Check that the link is public.");
      return 0;
    }
    if (!r.ok) { errors.push(`Could not download the ICS URL (${r.status}). Check that the link is public.`); return 0; }
    text = await r.text();
  }
  if (!text) return 0;
  if (!/BEGIN:VEVENT/i.test(text)) {
    errors.push("That file/link didn't contain any calendar events. Export your calendar as .ics and try again.");
    return 0;
  }

  // No fixed window for ICS — keep whatever range the person actually uploaded.
  const parsed = parseIcs(text);
  const starts = parsed.map((e) => e.start.getTime()).filter((n) => Number.isFinite(n));
  const ends = parsed.map((e) => e.end.getTime()).filter((n) => Number.isFinite(n));
  const now = Date.now();
  const from = new Date(starts.length ? Math.min(...starts) : now);
  // Recurring events (UNTIL/COUNT or open-ended) run past the last DTEND in the
  // file, so widen the expansion window whenever any recurrence rule exists.
  const hasRecurrence = parsed.some((e) => !!e.rrule);
  const lastEnd = ends.length ? Math.max(...ends) : now;
  const max = new Date(hasRecurrence ? Math.max(lastEnd, now + 365 * 24 * 3600 * 1000) : lastEnd);
  const occurrences = expandOccurrences(parsed, from, max);

  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const ev of occurrences) {
    const key = `${ev.uid}|${ev.start.toISOString()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
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
    });
  }
  if (rows.length) {
    const { error } = await sb.from("calendar_events").insert(rows);
    if (error) throw error;
  }
  if (!rows.length) {
    errors.push("We parsed your calendar, but it contains no upcoming events. In Outlook use Save Calendar → More Options and set the date range to the next 2 weeks with Full details, then upload again.");
  }
  return rows.length;
}

interface IcsEvent {
  uid: string; summary: string; description: string | null; location: string | null;
  start: Date; end: Date; attendees: number; recurring: boolean;
  rrule: string | null; exdates: number[]; allDay: boolean;
  recurrenceId: number | null;
}

function parseIcs(text: string): IcsEvent[] {
  // Unfold lines (RFC 5545: lines beginning with space/tab continue prev)
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: IcsEvent[] = [];
  let cur: (Partial<IcsEvent> & { _attendees?: number; _exdates?: number[] }) | null = null;
  let inEvent = false;
  for (const lnRaw of lines) {
    const ln = lnRaw.trim();
    if (/^BEGIN:VEVENT$/i.test(ln)) { cur = { _attendees: 0, _exdates: [] }; inEvent = true; }
    else if (/^END:VEVENT$/i.test(ln)) {
      if (cur && cur.start) {
        const start = cur.start;
        const end = cur.end ?? new Date(start.getTime() + (cur.allDay ? 24 * 3600 * 1000 : 30 * 60 * 1000));
        events.push({
          uid: cur.uid ?? crypto.randomUUID(),
          summary: cur.summary ?? "(no title)",
          description: cur.description ?? null,
          location: cur.location ?? null,
          start, end,
          attendees: cur._attendees ?? 0,
          recurring: !!cur.rrule,
          rrule: cur.rrule ?? null,
          exdates: cur._exdates ?? [],
          allDay: !!cur.allDay,
          recurrenceId: cur.recurrenceId ?? null,
        });
      }
      cur = null; inEvent = false;
    } else if (inEvent && cur) {
      const idx = ln.indexOf(":");
      if (idx === -1) continue;
      const keyRaw = ln.slice(0, idx);
      const value = ln.slice(idx + 1);
      const key = keyRaw.split(";")[0].toUpperCase();
      if (key === "UID") cur.uid = value;
      else if (key === "SUMMARY") cur.summary = unescapeIcs(value);
      else if (key === "DESCRIPTION") cur.description = unescapeIcs(value);
      else if (key === "LOCATION") cur.location = unescapeIcs(value);
      else if (key === "DTSTART") {
        cur.start = parseIcsDate(value.split(",")[0], keyRaw);
        cur.allDay = /VALUE=DATE(?!-TIME)/i.test(keyRaw) || /^\d{8}$/.test(value);
      }
      else if (key === "DTEND") cur.end = parseIcsDate(value.split(",")[0], keyRaw);
      else if (key === "DURATION" && !cur.end && cur.start) {
        cur.end = new Date(cur.start.getTime() + parseIcsDuration(value));
      }
      else if (key === "ATTENDEE") cur._attendees = (cur._attendees ?? 0) + 1;
      else if (key === "RRULE") cur.rrule = value;
      else if (key === "EXDATE") {
        for (const part of value.split(",")) {
          const d = parseIcsDate(part.trim(), keyRaw);
          if (!isNaN(d.getTime())) cur._exdates!.push(d.getTime());
        }
      }
      else if (key === "RECURRENCE-ID") {
        const d = parseIcsDate(value, keyRaw);
        if (!isNaN(d.getTime())) cur.recurrenceId = d.getTime();
      }
      else if (key === "STATUS" && /CANCELLED/i.test(value)) cur.start = undefined;
    }
  }
  return events;
}

const DAY_MS = 24 * 3600 * 1000;
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/** Expand single + recurring events into concrete occurrences inside [from, to]. */
function expandOccurrences(events: IcsEvent[], from: Date, to: Date): IcsEvent[] {
  const out: IcsEvent[] = [];
  // Overrides (RECURRENCE-ID) replace a specific instance of the master event.
  const overrides = new Map<string, IcsEvent>();
  for (const ev of events) {
    if (ev.recurrenceId != null) overrides.set(`${ev.uid}|${ev.recurrenceId}`, ev);
  }

  for (const ev of events) {
    if (ev.recurrenceId != null) {
      if (overlaps(ev.start, ev.end, from, to)) out.push(ev);
      continue;
    }
    if (!ev.rrule) {
      if (overlaps(ev.start, ev.end, from, to)) out.push(ev);
      continue;
    }
    const duration = Math.max(ev.end.getTime() - ev.start.getTime(), 5 * 60 * 1000);
    for (const startMs of recurrenceStarts(ev, from, to)) {
      if (ev.exdates.includes(startMs)) continue;
      const override = overrides.get(`${ev.uid}|${startMs}`);
      if (override) continue; // already added above
      const start = new Date(startMs);
      const end = new Date(startMs + duration);
      if (!overlaps(start, end, from, to)) continue;
      out.push({ ...ev, start, end, recurring: true });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function overlaps(start: Date, end: Date, from: Date, to: Date): boolean {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return end.getTime() >= from.getTime() && start.getTime() <= to.getTime();
}

/** Minimal but practical RRULE expansion: FREQ DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL, COUNT, UNTIL, BYDAY. */
function recurrenceStarts(ev: IcsEvent, from: Date, to: Date): number[] {
  const rule: Record<string, string> = {};
  for (const part of ev.rrule!.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) rule[k.toUpperCase()] = v;
  }
  const freq = (rule.FREQ ?? "").toUpperCase();
  const interval = Math.max(parseInt(rule.INTERVAL ?? "1", 10) || 1, 1);
  const count = rule.COUNT ? parseInt(rule.COUNT, 10) : null;
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL, "UNTIL").getTime() : null;
  const byDay = rule.BYDAY ? rule.BYDAY.split(",").map((d) => d.replace(/^[-+]?\d+/, "").toUpperCase()) : [];

  const starts: number[] = [];
  const base = ev.start.getTime();
  if (isNaN(base)) return starts;
  const limit = to.getTime();
  const windowStart = from.getTime() - DAY_MS; // keep events already in progress
  let emitted = 0;
  const MAX_ITER = 5000;

  if (freq === "DAILY" || freq === "WEEKLY") {
    const stepMs = (freq === "DAILY" ? DAY_MS : 7 * DAY_MS) * interval;
    // Weekly with BYDAY: iterate day by day within each active week.
    if (freq === "WEEKLY" && byDay.length) {
      const weekStepMs = 7 * DAY_MS * interval;
      for (let i = 0; i < MAX_ITER; i++) {
        const weekBase = base + i * weekStepMs;
        if (weekBase > limit) break;
        for (let d = 0; d < 7; d++) {
          const t = weekBase + d * DAY_MS;
          if (t < base) continue;
          const dow = WEEKDAYS[new Date(t).getUTCDay()];
          if (!byDay.includes(dow)) continue;
          if (until != null && t > until) return starts;
          emitted++;
          if (count != null && emitted > count) return starts;
          if (t >= windowStart && t <= limit) starts.push(t);
        }
      }
      return starts;
    }
    for (let i = 0; i < MAX_ITER; i++) {
      const t = base + i * stepMs;
      if (t > limit) break;
      if (until != null && t > until) break;
      if (count != null && i + 1 > count) break;
      if (t >= windowStart) starts.push(t);
    }
    return starts;
  }

  if (freq === "MONTHLY" || freq === "YEARLY") {
    const d0 = new Date(base);
    for (let i = 0; i < 400; i++) {
      const t = new Date(d0.getTime());
      if (freq === "MONTHLY") t.setUTCMonth(d0.getUTCMonth() + i * interval);
      else t.setUTCFullYear(d0.getUTCFullYear() + i * interval);
      const ms = t.getTime();
      if (ms > limit) break;
      if (until != null && ms > until) break;
      if (count != null && i + 1 > count) break;
      if (ms >= windowStart) starts.push(ms);
    }
    return starts;
  }

  // Unknown FREQ — treat as a single event.
  if (base >= windowStart && base <= limit) starts.push(base);
  return starts;
}

function unescapeIcs(v: string) { return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\"); }

function parseIcsDuration(v: string): number {
  const m = v.match(/^P?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!m) return 30 * 60 * 1000;
  const [, w, d, h, mi, s] = m;
  return ((+(w ?? 0) * 7 + +(d ?? 0)) * 86400 + +(h ?? 0) * 3600 + +(mi ?? 0) * 60 + +(s ?? 0)) * 1000;
}

/** Offset (ms) to add to a "wall clock as UTC" timestamp to get the real UTC instant. */
function tzOffsetMs(tz: string, utcGuess: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = Object.fromEntries(dtf.formatToParts(utcGuess).map((p) => [p.type, p.value]));
    const asUTC = Date.UTC(
      +parts.year, +parts.month - 1, +parts.day,
      +parts.hour % 24, +parts.minute, +parts.second,
    );
    return utcGuess.getTime() - asUTC;
  } catch {
    return 0;
  }
}

function parseIcsDate(v: string, key: string): Date {
  const val = v.trim();
  // Examples: 20251217T093000Z, 20251217T093000, 20251217 (all-day)
  if (/^\d{8}$/.test(val)) {
    return new Date(`${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T00:00:00Z`);
  }
  const m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (m) {
    const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    if (m[7]) return new Date(wall);
    // Floating or TZID-qualified local time — convert using the named zone.
    const tzid = key.match(/TZID=([^;:]+)/i)?.[1];
    if (tzid) {
      const guess = new Date(wall);
      const offset = tzOffsetMs(tzid.replace(/^"|"$/g, ""), guess);
      // Refine once for DST boundaries.
      const refined = new Date(wall + offset);
      return new Date(wall + tzOffsetMs(tzid.replace(/^"|"$/g, ""), refined));
    }
    return new Date(wall);
  }
  return new Date(val);
}


function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
