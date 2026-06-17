// Run the Cognitive Load Theory (Sweller) orchestration over upcoming events.
// Produces a daily load score (0-100) and per-block tips for the next 7 days.
import { corsHeaders, normalizeEmail, serviceClient, isActiveSubscriber } from "../_shared/subscription.ts";

interface EventRow {
  id: string; title: string; starts_at: string; ends_at: string;
  attendee_count: number; is_recurring: boolean; description: string | null;
}

interface BlockTip {
  event_id: string;
  category: "intrinsic" | "extraneous" | "germane";
  action: "add_buffer" | "batch" | "chunk" | "switch_modality" | "defer" | "preserve";
  tip: string;
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
    const { email } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    const sb = serviceClient();
    if (!(await isActiveSubscriber(sb, e))) return j({ error: "Subscription required" }, 402);

    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    const { data: events } = await sb
      .from("calendar_events")
      .select("id, title, starts_at, ends_at, attendee_count, is_recurring, description")
      .ilike("email", e)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at");

    const days = groupByDay(events ?? []);
    const analyses: DayAnalysis[] = days.map((d) => analyzeDay(d.date, d.events));

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

function groupByDay(events: EventRow[]) {
  const map = new Map<string, EventRow[]>();
  for (const ev of events) {
    const d = ev.starts_at.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(ev);
  }
  return Array.from(map.entries()).map(([date, events]) => ({ date, events }));
}

function durationMin(ev: EventRow) {
  return (new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / 60000;
}

function hour(ev: EventRow) {
  return new Date(ev.starts_at).getHours();
}

// Sweller-CLT orchestration: intrinsic = complexity of task, extraneous = fragmentation/
// context-switching/after-hours, germane = sustained focus & learning blocks.
function analyzeDay(date: string, events: EventRow[]): DayAnalysis {
  let intrinsic = 0, extraneous = 0, germane = 0;
  const tips: BlockTip[] = [];

  const COMPLEX = /(strategy|design|review|interview|planning|kickoff|architecture|deep|writing|research|presentation|board|roadmap)/i;
  const ROUTINE = /(standup|sync|catch[- ]?up|check[- ]?in|1[:-]1|status|update)/i;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const dur = durationMin(ev);
    const h = hour(ev);
    const complex = COMPLEX.test(ev.title);
    const routine = ROUTINE.test(ev.title);
    const big = ev.attendee_count >= 6;
    const isFocus = ev.attendee_count <= 1 && dur >= 90;

    // Intrinsic load: complexity × duration weight
    let evIntrinsic = (complex ? 6 : routine ? 2 : 4) * Math.min(2, dur / 60);
    if (big) evIntrinsic += 2;
    intrinsic += evIntrinsic;

    // Extraneous: back-to-back, after-hours, fragmentation
    if (i > 0) {
      const gap = (new Date(ev.starts_at).getTime() - new Date(events[i-1].ends_at).getTime()) / 60000;
      if (gap >= 0 && gap < 10) {
        extraneous += 5;
        tips.push({ event_id: ev.id, category: "extraneous", action: "add_buffer",
          tip: "Back-to-back with previous block — add a 10-min buffer to reset working memory." });
      }
    }
    if (h < 8 || h >= 19) {
      extraneous += 4;
      tips.push({ event_id: ev.id, category: "extraneous", action: "defer",
        tip: "Outside core hours — defer to tomorrow if not urgent; off-hour load compounds fatigue." });
    }
    if (big && complex) {
      extraneous += 3;
      tips.push({ event_id: ev.id, category: "extraneous", action: "chunk",
        tip: "Large complex meeting — split into a pre-read + decision call to lower extraneous load." });
    }
    if (routine && dur > 30) {
      extraneous += 2;
      tips.push({ event_id: ev.id, category: "extraneous", action: "batch",
        tip: "Routine sync running long — cap at 25 min and batch with other status meetings." });
    }

    // Germane: protected long focus blocks
    if (isFocus) {
      germane += 6;
      tips.push({ event_id: ev.id, category: "germane", action: "preserve",
        tip: "Deep-work block — protect it; turn off notifications and don't accept overlaps." });
    } else if (complex && dur >= 45 && ev.attendee_count <= 3) {
      germane += 3;
    }
  }

  // Fragmentation penalty
  if (events.length >= 6) extraneous += (events.length - 5) * 2;

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
  if (intrinsic > 50 && germane < 15) recs.push("High-complexity day with no deep-work block — carve out 90 min.");
  if (events.length === 0) recs.push("Open day — schedule one 90-min focus block before it fills up.");
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

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
