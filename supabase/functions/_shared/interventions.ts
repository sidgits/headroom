// Intervention engine — turns the CLT day analysis into a small set of concrete,
// trackable actions ("defend this focus window", "this is the meeting to decline",
// "this pattern has run two weeks"). Pure functions; no IO.
import { tzDateKey, tzFormat, tzStartOfDay } from "./tz.ts";

export interface EvIn {
  id: string; title: string; starts_at: string; ends_at: string;
  attendee_count: number; is_recurring: boolean;
}

export interface DayIn {
  date: string;
  daily_load_score: number;
  intrinsic_load: number;
  extraneous_load: number;
  germane_load: number;
  events: EvIn[];
}

export type InterventionKind =
  | "defend_focus" | "decline" | "add_buffer" | "shorten" | "pattern";

export interface Intervention {
  kind: InterventionKind;
  severity: "high" | "moderate";
  target_event_id: string | null;
  target_date: string | null;
  title: string;
  evidence: string;
  action_label: string;
  payload: Record<string, unknown>;
  expected_delta: number;
}

const ROUTINE = /(standup|sync|catch[- ]?up|check[- ]?in|1[:-]1|status|update|weekly|monthly|all[- ]hands)/i;
const COMPLEX = /(strategy|design|review|interview|planning|kickoff|architecture|deep|writing|research|presentation|board|roadmap)/i;

const mins = (ev: EvIn) => (Date.parse(ev.ends_at) - Date.parse(ev.starts_at)) / 60000;

function hhmm(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
function weekdayLabel(dateKey: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric" })
    .format(tzStartOfDay(dateKey, tz).getTime() + 12 * 3600 * 1000);
}

/** Largest open stretch (minutes) inside local core hours 09:00-17:00, with its bounds. */
function openWindow(day: DayIn, tz: string): { start: number; end: number; length: number } {
  const dayStart = tzStartOfDay(day.date, tz).getTime();
  const start = dayStart + 9 * 3600 * 1000;
  const end = start + 8 * 3600 * 1000;
  const busy = day.events
    .map((ev) => [Date.parse(ev.starts_at), Date.parse(ev.ends_at)] as const)
    .filter(([s, e]) => e > start && s < end)
    .sort((a, b) => a[0] - b[0]);
  let cursor = start;
  let best = { start, end: start, length: 0 };
  const consider = (s: number, e: number) => {
    const len = (e - s) / 60000;
    if (len > best.length) best = { start: s, end: e, length: len };
  };
  for (const [s, e] of busy) {
    if (s > cursor) consider(cursor, Math.min(s, end));
    cursor = Math.max(cursor, Math.min(end, e));
  }
  if (cursor < end) consider(cursor, end);
  return { start: best.start, end: best.end, length: Math.round(best.length) };
}

/** Days that are complex but have no protected deep-work block, and still have room. */
export function focusDefense(days: DayIn[], tz: string): Intervention[] {
  const out: Intervention[] = [];
  for (const day of days) {
    if (day.events.length === 0) continue;
    if (day.germane_load >= 15) continue;              // already has deep work
    if (day.intrinsic_load < 25 && day.daily_load_score < 40) continue;
    const win = openWindow(day, tz);
    if (win.length < 90) continue;
    const blockStart = new Date(win.start);
    const blockEnd = new Date(win.start + 90 * 60000);
    out.push({
      kind: "defend_focus",
      severity: day.daily_load_score >= 60 ? "high" : "moderate",
      target_event_id: null,
      target_date: day.date,
      title: `Defend 90 minutes of deep work on ${weekdayLabel(day.date, tz)}`,
      evidence: `${day.events.length} blocks, load ${day.daily_load_score}/100, Growth Load only ${day.germane_load}. Your largest open window is ${Math.floor(win.length / 60)}h ${win.length % 60}m from ${hhmm(blockStart.toISOString(), tz)}.`,
      action_label: "Add focus block",
      payload: {
        start_iso: blockStart.toISOString(),
        end_iso: blockEnd.toISOString(),
        window_minutes: win.length,
        suggested_title: "Deep work (Headroom)",
        local_time: `${hhmm(blockStart.toISOString(), tz)} – ${hhmm(blockEnd.toISOString(), tz)}`,
      },
      expected_delta: Math.min(18, 8 + Math.round(day.intrinsic_load / 8)),
    });
  }
  return out;
}

/** The single highest-cost, lowest-value meeting per week. */
export function declineCandidates(days: DayIn[], tz: string): Intervention[] {
  const byWeek = new Map<string, { ev: EvIn; day: DayIn; score: number }>();
  for (const day of days) {
    for (const ev of day.events) {
      const d = mins(ev);
      const routine = ROUTINE.test(ev.title);
      const complex = COMPLEX.test(ev.title);
      let score = 0;
      if (routine) score += 3;
      if (ev.is_recurring) score += 3;
      if (ev.attendee_count >= 6) score += 3;
      if (ev.attendee_count >= 10) score += 2;
      if (d >= 45) score += 2;
      if (d >= 60) score += 1;
      if (complex) score -= 4;
      if (ev.attendee_count <= 2) score -= 3;
      if (score < 6) continue;
      const week = weekKey(day.date);
      const cur = byWeek.get(week);
      if (!cur || score > cur.score) byWeek.set(week, { ev, day, score });
    }
  }
  return Array.from(byWeek.values()).map(({ ev, day, score }) => {
    const d = Math.round(mins(ev));
    const cost = Math.round((d / 60) * Math.max(1, ev.attendee_count));
    return {
      kind: "decline" as const,
      severity: score >= 9 ? "high" as const : "moderate" as const,
      target_event_id: ev.id,
      target_date: day.date,
      title: `Consider declining “${ev.title}”`,
      evidence: `${tzFormat(ev.starts_at, tz)} · ${d} min · ${ev.attendee_count} attendees${ev.is_recurring ? " · recurring" : ""}. That is roughly ${cost} person-hours a week for a status-shaped block.`,
      action_label: "Copy decline note",
      payload: {
        event_title: ev.title,
        when: tzFormat(ev.starts_at, tz),
        minutes: d,
        decline_note: `Hi — I'm protecting focus time this week, so I'm going to step out of "${ev.title}". Please send the notes or tag me if a decision needs me; I'll respond async the same day.`,
      },
      expected_delta: Math.min(20, 6 + Math.round(d / 10)),
    };
  });
}

/** Back-to-back chains with zero reset time. */
export function bufferGaps(days: DayIn[], tz: string): Intervention[] {
  const out: Intervention[] = [];
  for (const day of days) {
    const evs = [...day.events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    let worst: { prev: EvIn; next: EvIn } | null = null;
    let chain = 0, bestChain = 0;
    for (let i = 1; i < evs.length; i++) {
      const gap = (Date.parse(evs[i].starts_at) - Date.parse(evs[i - 1].ends_at)) / 60000;
      if (gap >= 0 && gap < 5) {
        chain++;
        if (chain > bestChain) { bestChain = chain; worst = { prev: evs[i - 1], next: evs[i] }; }
      } else chain = 0;
    }
    if (!worst || bestChain < 2) continue;
    out.push({
      kind: "add_buffer",
      severity: bestChain >= 3 ? "high" : "moderate",
      target_event_id: worst.next.id,
      target_date: day.date,
      title: `Break the back-to-back run on ${weekdayLabel(day.date, tz)}`,
      evidence: `${bestChain + 1} blocks run with no gap. “${worst.next.title}” starts the moment “${worst.prev.title}” ends at ${hhmm(worst.prev.ends_at, tz)} — no reset for working memory.`,
      action_label: "Add 10-min buffer",
      payload: {
        start_iso: new Date(Date.parse(worst.next.starts_at) - 10 * 60000).toISOString(),
        end_iso: worst.next.starts_at,
        suggested_title: "Buffer (Headroom)",
        local_time: `${hhmm(new Date(Date.parse(worst.next.starts_at) - 10 * 60000).toISOString(), tz)} – ${hhmm(worst.next.starts_at, tz)}`,
        event_title: worst.next.title,
      },
      expected_delta: 5 + bestChain * 2,
    });
  }
  return out;
}

/** Routine meetings running long, or marathon multi-person blocks. */
export function shortenCandidates(days: DayIn[], tz: string): Intervention[] {
  const out: Intervention[] = [];
  for (const day of days) {
    for (const ev of day.events) {
      const d = Math.round(mins(ev));
      const routine = ROUTINE.test(ev.title);
      const marathon = d >= 120 && ev.attendee_count >= 2;
      if (!(routine && d > 30) && !marathon) continue;
      const suggested = marathon ? 60 : 25;
      out.push({
        kind: "shorten",
        severity: marathon ? "high" : "moderate",
        target_event_id: ev.id,
        target_date: day.date,
        title: marathon
          ? `Split “${ev.title}” — attention decays after ~50 minutes`
          : `Cap “${ev.title}” at 25 minutes`,
        evidence: `${tzFormat(ev.starts_at, tz)} · ${d} min · ${ev.attendee_count} attendees. ${marathon ? "Two hours in one room with others is where Toxic Load accumulates fastest." : "Routine syncs expand to fill the slot they're given."}`,
        action_label: "Copy message",
        payload: {
          event_title: ev.title,
          minutes: d,
          suggested_minutes: suggested,
          message: marathon
            ? `Proposal for "${ev.title}": split it into a 30-min pre-read + a 60-min decision session. Two straight hours costs everyone more than it returns.`
            : `Proposal for "${ev.title}": trim it to 25 minutes with a written agenda. Anything unresolved becomes a follow-up thread.`,
        },
        expected_delta: marathon ? 14 : 7,
      });
    }
  }
  return out;
}

export interface CltHistoryRow {
  analysis_date: string;
  daily_load_score: number;
  intrinsic_load: number;
  extraneous_load: number;
  germane_load: number;
}

export interface PatternWeek {
  key: string; label: string; days: number;
  score: number; toxic: number; growth: number;
}

export interface PatternResult {
  weeks: PatternWeek[];
  alerts: Intervention[];
}

function weekKey(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

/** Week-over-week streaks — the "before it becomes a bad month" signal. */
export function patterns(history: CltHistoryRow[], todayKey: string): PatternResult {
  const past = (history ?? []).filter((r) => r?.analysis_date && r.analysis_date <= todayKey);
  const map = new Map<string, CltHistoryRow[]>();
  for (const r of past) {
    const k = weekKey(r.analysis_date);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  const weeks: PatternWeek[] = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, rs]) => ({
      key: k,
      label: new Date(`${k}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      days: rs.length,
      score: avg(rs.map((r) => r.daily_load_score ?? 0)),
      toxic: avg(rs.map((r) => r.extraneous_load ?? 0)),
      growth: avg(rs.map((r) => r.germane_load ?? 0)),
    }))
    .filter((w) => w.days >= 2);

  const alerts: Intervention[] = [];
  const last3 = weeks.slice(-3);
  if (last3.length === 3) {
    const [a, b, c] = last3;
    const toxicRising = c.toxic > b.toxic && b.toxic > a.toxic && c.toxic - a.toxic >= 8;
    const growthFalling = c.growth < b.growth && b.growth < a.growth && a.growth - c.growth >= 5;
    const loadRising = c.score > b.score && b.score > a.score && c.score - a.score >= 8;

    if (toxicRising && growthFalling) {
      alerts.push({
        kind: "pattern", severity: "high", target_event_id: null, target_date: todayKey,
        title: "Three weeks of rising Toxic Load with falling deep work",
        evidence: `Toxic Load ${a.toxic} → ${b.toxic} → ${c.toxic} while Growth Load fell ${a.growth} → ${b.growth} → ${c.growth}. This is the shape that precedes a bad month.`,
        action_label: "Acknowledge",
        payload: { metric: "toxic_vs_growth", weeks: last3 },
        expected_delta: 0,
      });
    } else if (loadRising) {
      alerts.push({
        kind: "pattern", severity: "moderate", target_event_id: null, target_date: todayKey,
        title: "Load has climbed three weeks running",
        evidence: `Weekly average load ${a.score} → ${b.score} → ${c.score}. Reverse it now while it's still one or two meetings' worth of change.`,
        action_label: "Acknowledge",
        payload: { metric: "load_rising", weeks: last3 },
        expected_delta: 0,
      });
    } else if (toxicRising) {
      alerts.push({
        kind: "pattern", severity: "moderate", target_event_id: null, target_date: todayKey,
        title: "Fragmentation is trending up",
        evidence: `Toxic Load ${a.toxic} → ${b.toxic} → ${c.toxic}. More context switching, same hours.`,
        action_label: "Acknowledge",
        payload: { metric: "toxic_rising", weeks: last3 },
        expected_delta: 0,
      });
    }
  }
  return { weeks, alerts };
}

/** Full ranked list for a user: top actions first, capped. */
export function buildInterventions(
  days: DayIn[],
  history: CltHistoryRow[],
  tz: string,
  limit = 5,
): { interventions: Intervention[]; weeks: PatternWeek[] } {
  const todayKey = tzDateKey(new Date(), tz);
  // Only act on today and the next 14 days — the past can't be changed.
  const horizon = days
    .filter((d) => d.date >= todayKey && d.date <= addDays(todayKey, 14))
    .sort((a, b) => a.date.localeCompare(b.date));

  const { weeks, alerts } = patterns(history, todayKey);

  const candidates = [
    ...alerts,
    ...focusDefense(horizon, tz),
    ...declineCandidates(horizon, tz),
    ...bufferGaps(horizon, tz),
    ...shortenCandidates(horizon, tz),
  ];

  const rank = (i: Intervention) =>
    (i.kind === "pattern" ? 1000 : 0) +
    (i.severity === "high" ? 100 : 0) +
    i.expected_delta -
    daysFrom(todayKey, i.target_date ?? todayKey);

  const seen = new Set<string>();
  const ranked = candidates
    .sort((a, b) => rank(b) - rank(a))
    .filter((i) => {
      // One action per event, and at most one focus block per day.
      const key = `${i.kind}:${i.target_event_id ?? i.target_date}`;
      const evKey = i.target_event_id ? `ev:${i.target_event_id}` : key;
      if (seen.has(key) || seen.has(evKey)) return false;
      seen.add(key); seen.add(evKey);
      return true;
    })
    .slice(0, limit);

  return { interventions: ranked, weeks };
}

function addDays(dateKey: string, n: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function daysFrom(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/** Compact text block for the coach's system prompt. */
export function interventionsPrompt(list: { kind: string; title: string; evidence: string; status: string; target_date: string | null }[]): string {
  const open = list.filter((i) => i.status === "open");
  if (!open.length) return "(no open interventions right now)";
  return open.map((i) => `- [${i.kind}] ${i.target_date ?? ""} ${i.title} — ${i.evidence}`).join("\n");
}
