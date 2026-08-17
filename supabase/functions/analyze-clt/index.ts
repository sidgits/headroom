// Run the Cognitive Load Theory (Sweller) orchestration over upcoming events.
// Produces a daily load score (0-100) and per-block tips for the next 7 days.
import { corsHeaders, normalizeEmail, serviceClient, hasPaidAccess } from "../_shared/subscription.ts";
import { safeTz, tzDateKey, tzHour, tzStartOfDay, tzStartOfToday } from "../_shared/tz.ts";
import { buildInterventions, type Intervention } from "../_shared/interventions.ts";

/** Upsert the freshly computed actions, preserving anything the user already
 *  resolved, and retire open rows that no longer apply. */
async function persistInterventions(
  // deno-lint-ignore no-explicit-any
  sb: any,
  email: string,
  list: Intervention[],
) {
  const keyOf = (i: { kind: string; target_event_id: string | null; target_date: string | null }) =>
    `${i.kind}|${i.target_event_id ?? ""}|${i.target_date ?? ""}`;

  const { data: existing } = await sb
    .from("interventions")
    .select("id, kind, target_event_id, target_date, status, snoozed_until")
    .ilike("email", email);

  const byKey = new Map<string, { id: string; status: string; snoozed_until: string | null }>(
    (existing ?? []).map((r: { id: string; kind: string; target_event_id: string | null; target_date: string | null; status: string; snoozed_until: string | null }) =>
      [keyOf(r), { id: r.id, status: r.status, snoozed_until: r.snoozed_until }]),
  );

  const liveIds: string[] = [];
  for (const i of list) {
    const prev = byKey.get(keyOf(i));
    if (prev) {
      liveIds.push(prev.id);
      // Never resurrect something the user handled or dismissed.
      if (prev.status !== "open") continue;
      await sb.from("interventions").update({
        severity: i.severity, title: i.title, evidence: i.evidence,
        action_label: i.action_label, payload: i.payload, expected_delta: i.expected_delta,
      }).eq("id", prev.id);
      continue;
    }
    const { data: inserted } = await sb.from("interventions").insert({
      email,
      kind: i.kind, severity: i.severity,
      target_event_id: i.target_event_id, target_date: i.target_date,
      title: i.title, evidence: i.evidence, action_label: i.action_label,
      payload: i.payload, expected_delta: i.expected_delta, status: "open",
    }).select("id").maybeSingle();
    if (inserted?.id) liveIds.push(inserted.id);
  }

  // Open rows whose event or condition no longer exists are removed.
  let stale = sb.from("interventions").delete().ilike("email", email).eq("status", "open");
  if (liveIds.length) stale = stale.not("id", "in", `(${liveIds.join(",")})`);
  await stale;
}

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

    // 60 days of history through 30 days ahead.
    const from = new Date(tzStartOfToday(tz).getTime() - 60 * 24 * 3600 * 1000);
    const end = new Date(tzStartOfToday(tz).getTime() + 31 * 24 * 3600 * 1000);

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

    // Turn the analysis into trackable actions.
    const { data: history } = await sb
      .from("clt_analyses")
      .select("analysis_date, daily_load_score, intrinsic_load, extraneous_load, germane_load")
      .ilike("email", e).order("analysis_date").limit(5000);

    const { interventions } = buildInterventions(
      analyses.map((a) => ({
        date: a.date,
        daily_load_score: a.daily_load_score,
        intrinsic_load: a.intrinsic_load,
        extraneous_load: a.extraneous_load,
        germane_load: a.germane_load,
        events: a.events.map((ev) => ({
          id: ev.id, title: ev.title, starts_at: ev.starts_at, ends_at: ev.ends_at,
          attendee_count: ev.attendee_count, is_recurring: ev.is_recurring,
        })),
      })),
      history ?? [],
      tz,
    );
    await persistInterventions(sb, e, interventions);

    return j({ days: analyses, interventions: interventions.length });
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
//
// Design rule: the engine is silent by default. A block only gets an instruction when
// something is actually wrong; a calm day produces one honest line and nothing else.
const UNTITLED = /^(busy|tentative|free|blocked?|hold|private|no title|untitled|ooo|out of office)?$/i;

function isUntitled(title: string | null | undefined) {
  return UNTITLED.test((title ?? "").trim());
}

function timeLabel(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function analyzeDay(date: string, events: EventRow[], tz: string): DayAnalysis {
  let intrinsic = 0, extraneous = 0, germane = 0;
  const tips: BlockTip[] = [];

  const COMPLEX = /(strategy|design|review|interview|planning|kickoff|architecture|deep|writing|research|presentation|board|roadmap)/i;
  const ROUTINE = /(standup|sync|catch[- ]?up|check[- ]?in|1[:-]1|status|update)/i;

  const protectedBlocks: EventRow[] = [];
  const draft: { ev: EventRow; load: number; risk: BlockTip["risk"]; tip: BlockTip | null }[] = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const dur = durationMin(ev);
    const h = hour(ev, tz);
    const unnamed = isUntitled(ev.title);
    const complex = !unnamed && COMPLEX.test(ev.title);
    const routine = !unnamed && ROUTINE.test(ev.title);
    const big = ev.attendee_count >= 6;
    const solo = ev.attendee_count <= 1;
    const isFocus = solo && dur >= 90;

    let evExtraneous = 0;
    let evGermane = 0;
    // Candidate instructions, most severe first — only ever one is emitted.
    const candidates: { weight: number; category: BlockTip["category"]; action: BlockTip["action"]; tip: string }[] = [];

    // Intrinsic load: complexity × duration weight. An unnamed block is assumed
    // ordinary rather than complex — we don't score what we can't see.
    let evIntrinsic = (complex ? 6 : routine ? 2 : unnamed ? 3 : 4) * Math.min(2, dur / 60);
    if (big) evIntrinsic += 2;
    intrinsic += evIntrinsic;

    // Extraneous: only real friction counts. Two short solo holds touching each
    // other is not a context switch worth naming.
    if (i > 0) {
      const prev = events[i - 1];
      const gap = (new Date(ev.starts_at).getTime() - new Date(prev.ends_at).getTime()) / 60000;
      const heavyChain = (ev.attendee_count >= 2 || prev.attendee_count >= 2)
        && dur >= 30 && durationMin(prev) >= 30;
      if (gap >= 0 && gap < 10 && heavyChain) {
        evExtraneous += 5;
        candidates.push({ weight: 5, category: "extraneous", action: "add_buffer",
          tip: "Straight out of the previous meeting — put 10 minutes between them to reset working memory." });
      }
    }
    if (h < 8 || h >= 19) {
      evExtraneous += 4;
      candidates.push({ weight: 7, category: "extraneous", action: "defer",
        tip: "Outside core hours — defer to tomorrow if it isn't urgent; off-hour load compounds fatigue." });
    }
    if (big && complex) {
      evExtraneous += 3;
      candidates.push({ weight: 8, category: "extraneous", action: "chunk",
        tip: "Large complex meeting — split into a pre-read plus a decision call to lower Toxic Load." });
    }
    if (routine && dur > 30) {
      evExtraneous += 2;
      candidates.push({ weight: 4, category: "extraneous", action: "batch",
        tip: "Routine sync running long — cap it at 25 minutes and batch it with other status meetings." });
    }
    if (dur >= 120 && ev.attendee_count >= 2) {
      evExtraneous += 3;
      candidates.push({ weight: 6, category: "extraneous", action: "chunk",
        tip: "Over two hours with other people — attention decays after about 50 minutes; split it or add a break." });
    }

    // Germane: protected long focus blocks. If the block has no title we say so
    // rather than asserting deep work the calendar never claimed.
    if (isFocus) {
      evGermane += unnamed ? 4 : 6;
      protectedBlocks.push(ev);
      candidates.push({ weight: 1, category: "germane", action: "preserve",
        tip: unnamed
          ? `${Math.round(dur)}-minute block with no title — if this is focus time, keep it clear and I'll defend it.`
          : "Deep-work block — protect it; turn off notifications and don't accept overlaps." });
    } else if (complex && dur >= 45 && ev.attendee_count <= 3) {
      evGermane += 3;
    }

    extraneous += evExtraneous;
    germane += evGermane;

    const blockLoad = Math.max(0, Math.min(100, Math.round(
      (evIntrinsic * 4.5) + (evExtraneous * 6) - (evGermane * 3),
    )));
    const risk: BlockTip["risk"] = blockLoad >= 60 ? "high" : blockLoad >= 35 ? "moderate" : "low";

    candidates.sort((a, b) => b.weight - a.weight);
    const chosen = candidates[0] ?? null;
    draft.push({
      ev, load: blockLoad, risk,
      tip: chosen
        ? { event_id: ev.id, category: chosen.category, action: chosen.action, tip: chosen.tip, load: blockLoad, risk }
        : null,
    });
  }

  // Fragmentation penalty: many blocks, and — more importantly — no window long
  // enough to do real work in.
  if (events.length >= 6) extraneous += (events.length - 5) * 2;
  const longestGap = largestFreeWindow(events, tz);
  const bookedMinutes = events.reduce((s, ev) => s + durationMin(ev), 0);
  if (events.length >= 3 && longestGap < 90) {
    extraneous += events.length >= 5 ? 14 : 9;
  } else if (events.length >= 4 && longestGap < 120) {
    extraneous += 6;
  }
  // A genuinely light day cannot register heavy friction. Under four booked
  // hours with a real open window, Toxic Load is damped toward the truth.
  if (bookedMinutes < 240 && longestGap >= 90) extraneous = extraneous * 0.5;

  const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  intrinsic = cap(intrinsic);
  extraneous = cap(extraneous);
  germane = cap(germane);

  const raw = intrinsic * 0.5 + extraneous * 0.7 - germane * 0.25;
  const score = cap(raw + 10);

  // Speak only when it matters. On a calm day the per-block advice is dropped
  // entirely and the day carries one honest line instead.
  const quiet = score < 35;
  for (const d of draft) {
    if (!d.tip) continue;
    if (quiet && d.risk !== "high") continue;
    tips.push(d.tip);
  }

  const recs: string[] = [];
  if (extraneous > 40) recs.push("Reduce context switching: batch similar meetings into one block.");
  if (events.length >= 3 && longestGap < 90) recs.push("The day is fragmented — no 90-min window survives. Consolidate meetings to open one.");
  if (intrinsic > 50 && germane < 15) recs.push("High-complexity day with no deep-work block — carve out 90 min.");
  if (score >= 70) recs.push("Overload risk. Move one meeting to tomorrow or convert it to async.");

  const label = score >= 70 ? "Overload risk"
    : score >= 50 ? "Heavy day"
    : score >= 30 ? "Balanced day"
    : "Light day";

  let summary = label;
  if (quiet) {
    if (protectedBlocks.length) {
      const times = protectedBlocks.map((b) => timeLabel(b.starts_at, tz));
      summary = `${label}. ${times.length === 1 ? "One protected block" : `${times.length} protected blocks`} at ${times.join(" and ")} — keep them clear.`;
      recs.length = 0;
      recs.push(`Nothing needs fixing today. Just hold ${times.join(" and ")}.`);
    } else {
      summary = `${label}. Nothing here needs intervening.`;
      recs.length = 0;
    }
  } else if (longestGap >= 90) {
    summary = `${label}. Your longest clear window is ${Math.floor(longestGap / 60)}h ${longestGap % 60}m.`;
  }

  return {
    date, daily_load_score: score, intrinsic_load: intrinsic, extraneous_load: extraneous, germane_load: germane,
    per_block_tips: tips, recommendations: recs,
    summary,
    events,
  };
}


/** Longest stretch (minutes) inside local core hours 09:00-17:00 that is either free
 *  or already a solo focus block — i.e. time actually usable for deep work. */
function largestFreeWindow(events: EventRow[], tz: string): number {
  if (events.length === 0) return 600;
  const dayKey = tzDateKey(events[0].starts_at, tz);
  const start = tzStartOfDay(dayKey, tz).getTime() + 9 * 3600 * 1000;
  const end = start + 8 * 3600 * 1000;
  const busy = events
    .filter((ev) => !(ev.attendee_count <= 1 && durationMin(ev) >= 90))
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
