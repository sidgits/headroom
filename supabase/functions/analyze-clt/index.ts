// Run the Cognitive Load Theory (Sweller) orchestration over upcoming events.
// Produces a daily load score (0-100) and per-block tips for the next 7 days.
import { corsHeaders, normalizeEmail, serviceClient, hasPaidAccess } from "../_shared/subscription.ts";
import { safeTz, tzDateKey, tzHour, tzStartOfDay, tzStartOfToday } from "../_shared/tz.ts";

interface EventRow {
  id: string; title: string; starts_at: string; ends_at: string;
  attendee_count: number; is_recurring: boolean; description: string | null;
}

interface BlockTip {
  event_id: string;
  category: "intrinsic" | "extraneous" | "germane";
  action: "add_buffer" | "batch" | "chunk" | "switch_modality" | "defer" | "preserve" | "monitor";
  tip: string;
  /** 0-100 burnout/cognitive-load marker for this specific time slot */
  load: number;
  risk: "low" | "moderate" | "high";
}


interface DayAnalysis {
  date: string;
  daily_load_score: number;
  intrinsic_load: number;
  extraneous_load: number;
  germane_load: number;
  per_block_tips: BlockTip[];
  recommendations: string[];
  summary: string;
  events: EventRow[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, reviewCode, timeZone } = await req.json();
    const tz = safeTz(timeZone);
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    const sb = serviceClient();
    if (!(await hasPaidAccess(sb, e, reviewCode))) return j({ error: "Subscription required" }, 402);

    // Today (from midnight) plus the week ahead.
    const from = tzStartOfToday(tz);
    const end = new Date(from.getTime() + 8 * 24 * 3600 * 1000);

    const { data: events } = await sb
      .from("calendar_events")
      .select("id, title, starts_at, ends_at, attendee_count, is_recurring, description")
      .ilike("email", e)
      .gte("starts_at", from.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at");

    const days = groupByDay(events ?? [], tz);
    // Only days that actually have events get a score — an empty day must never
    // synthesise a load number.
    const analyses: DayAnalysis[] = days
      .filter((d) => d.events.length > 0)
      .map((d) => analyzeDay(d.date, d.events, tz));

    // Clear stale rows in the window (e.g. a day whose events were removed) so
    // an empty day never keeps an old score.
    const keep = analyses.map((a) => a.date);
    let del = sb.from("clt_analyses").delete().ilike("email", e)
      .gte("analysis_date", tzDateKey(from, tz))
      .lte("analysis_date", tzDateKey(end, tz));
    if (keep.length) del = del.not("analysis_date", "in", `(${keep.join(",")})`);
    await del;

    // Persist (one row per day)
    for (const a of analyses) {
      await sb.from("clt_analyses").upsert({
        email: e,
        analysis_date: a.date,
        daily_load_score: a.daily_load_score,
        intrinsic_load: a.intrinsic_load,
        extraneous_load: a.extraneous_load,
        germane_load: a.germane_load,
        per_block_tips: a.per_block_tips,
        recommendations: a.recommendations,
        summary: a.summary,
      }, { onConflict: "email,analysis_date" } as never);
    }
    return j({ days: analyses });
  } catch (err) {
    console.error("analyze-clt", err);
    return j({ error: (err as Error).message }, 500);
  }
});

function groupByDay(events: EventRow[], tz: string) {
  const map = new Map<string, EventRow[]>();
  for (const ev of events) {
    const d = tzDateKey(ev.starts_at, tz);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(ev);
  }
  return Array.from(map.entries()).map(([date, events]) => ({ date, events }));
}

function durationMin(ev: EventRow) {
  return (new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / 60000;
}

function hour(ev: EventRow, tz: string) {
  return tzHour(ev.starts_at, tz);
}

// Sweller-CLT orchestration: intrinsic = complexity of task, extraneous = fragmentation/
// context-switching/after-hours, germane = sustained focus & learning blocks.
function analyzeDay(date: string, events: EventRow[], tz: string): DayAnalysis {
  let intrinsic = 0, extraneous = 0, germane = 0;
  const tips: BlockTip[] = [];

  const COMPLEX = /(strategy|design|review|interview|planning|kickoff|architecture|deep|writing|research|presentation|board|roadmap)/i;
  const ROUTINE = /(standup|sync|catch[- ]?up|check[- ]?in|1[:-]1|status|update)/i;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const dur = durationMin(ev);
    const h = hour(ev, tz);
    const complex = COMPLEX.test(ev.title);
    const routine = ROUTINE.test(ev.title);
    const big = ev.attendee_count >= 6;
    const isFocus = ev.attendee_count <= 1 && dur >= 90;

    // Per-block accumulators so every time slot gets its own marker.
    let evExtraneous = 0;
    let evGermane = 0;
    const evTips: { category: BlockTip["category"]; action: BlockTip["action"]; tip: string }[] = [];

    // Intrinsic load: complexity × duration weight
    let evIntrinsic = (complex ? 6 : routine ? 2 : 4) * Math.min(2, dur / 60);
    if (big) evIntrinsic += 2;
    intrinsic += evIntrinsic;

    // Extraneous: back-to-back, after-hours, fragmentation
    if (i > 0) {
      const gap = (new Date(ev.starts_at).getTime() - new Date(events[i-1].ends_at).getTime()) / 60000;
      if (gap >= 0 && gap < 10) {
        evExtraneous += 5;
        evTips.push({ category: "extraneous", action: "add_buffer",
          tip: "Back-to-back with previous block — add a 10-min buffer to reset working memory." });
      }
    }
    if (h < 8 || h >= 19) {
      evExtraneous += 4;
      evTips.push({ category: "extraneous", action: "defer",
        tip: "Outside core hours — defer to tomorrow if not urgent; off-hour load compounds fatigue." });
    }
    if (big && complex) {
      evExtraneous += 3;
      evTips.push({ category: "extraneous", action: "chunk",
        tip: "Large complex meeting — split into a pre-read + decision call to lower extraneous load." });
    }
    if (routine && dur > 30) {
      evExtraneous += 2;
      evTips.push({ category: "extraneous", action: "batch",
        tip: "Routine sync running long — cap at 25 min and batch with other status meetings." });
    }
    if (dur >= 120 && ev.attendee_count >= 2) {
      evExtraneous += 3;
      evTips.push({ category: "extraneous", action: "chunk",
        tip: "Over two hours with others — attention decays after ~50 min; split it or add a break." });
    }

    // Germane: protected long focus blocks
    if (isFocus) {
      evGermane += 6;
      evTips.push({ category: "germane", action: "preserve",
        tip: "Deep-work block — protect it; turn off notifications and don't accept overlaps." });
    } else if (complex && dur >= 45 && ev.attendee_count <= 3) {
      evGermane += 3;
    }

    extraneous += evExtraneous;
    germane += evGermane;

    // Burnout marker for this slot (0-100): intrinsic + extraneous, offset by germane.
    const blockLoad = Math.max(0, Math.min(100, Math.round(
      (evIntrinsic * 4.5) + (evExtraneous * 6) - (evGermane * 3),
    )));
    const risk: BlockTip["risk"] = blockLoad >= 60 ? "high" : blockLoad >= 35 ? "moderate" : "low";

    const primary = evTips[0] ?? {
      category: (complex ? "intrinsic" : "extraneous") as BlockTip["category"],
      action: "monitor" as BlockTip["action"],
      tip: risk === "low"
        ? "Low-load block — good place to absorb overflow or protect recovery."
        : complex
          ? "Complex block — prep 10 min beforehand so working memory isn't loaded cold."
          : "Moderate load — keep it to its slot and avoid stacking another meeting after it.",
    };

    tips.push({
      event_id: ev.id,
      category: primary.category,
      action: primary.action,
      tip: evTips.length > 1 ? evTips.map((t) => t.tip).join(" ") : primary.tip,
      load: blockLoad,
      risk,
    });
  }


  // Fragmentation penalty: many blocks, and — more importantly — no window long
  // enough to do real work in. A 3-hour day chopped into six pieces costs more
  // than three hours booked in one run.
  if (events.length >= 6) extraneous += (events.length - 5) * 2;
  const longestGap = largestFreeWindow(events, tz);
  if (events.length >= 3 && longestGap < 90) {
    extraneous += events.length >= 5 ? 14 : 9;
  } else if (events.length >= 4 && longestGap < 120) {
    extraneous += 6;
  }


  // Cap each at ~100 for display
  const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  intrinsic = cap(intrinsic);
  extraneous = cap(extraneous);
  germane = cap(germane);

  // Daily load = high intrinsic + extraneous, partially offset by germane.
  const raw = intrinsic * 0.5 + extraneous * 0.7 - germane * 0.25;
  const score = cap(raw + 10); // small baseline

  const recs: string[] = [];
  if (extraneous > 40) recs.push("Reduce context switching: batch similar meetings into one block.");
  if (events.length >= 3 && largestFreeWindow(events, tz) < 90) recs.push("The day is fragmented — no 90-min window survives. Consolidate meetings to open one.");
  if (intrinsic > 50 && germane < 15) recs.push("High-complexity day with no deep-work block — carve out 90 min.");
  if (score >= 70) recs.push("Overload risk. Move one meeting to tomorrow or convert it to async.");
  if (germane >= 20 && score < 50) recs.push("Healthy balance — keep this pattern.");

  return {
    date, daily_load_score: score, intrinsic_load: intrinsic, extraneous_load: extraneous, germane_load: germane,
    per_block_tips: tips, recommendations: recs,
    summary: score >= 70 ? "Overload risk"
      : score >= 50 ? "Heavy day"
      : score >= 30 ? "Balanced"
      : events.length === 0 ? "Open" : "Light",
    events,
  };
}

/** Longest uninterrupted free stretch (minutes) inside local core hours 08:00-18:00. */
function largestFreeWindow(events: EventRow[], tz: string): number {
  if (events.length === 0) return 600;
  const dayKey = tzDateKey(events[0].starts_at, tz);
  const start = tzStartOfDay(dayKey, tz).getTime() + 8 * 3600 * 1000;
  const end = start + 10 * 3600 * 1000;
  const busy = events
    .map((ev) => [new Date(ev.starts_at).getTime(), new Date(ev.ends_at).getTime()] as const)
    .filter(([s2, e2]) => e2 > start && s2 < end)
    .sort((a, b) => a[0] - b[0]);
  let cursor = start, best = 0;
  for (const [s2, e2] of busy) {
    best = Math.max(best, (Math.max(start, s2) - cursor) / 60000);
    cursor = Math.max(cursor, Math.min(end, e2));
  }
  best = Math.max(best, (end - cursor) / 60000);
  return Math.round(best);
}

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
