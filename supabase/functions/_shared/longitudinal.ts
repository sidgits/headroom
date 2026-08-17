// Longitudinal (baseline vs now) analysis over the full clt_analyses history.
// The daily rows are kept forever, so "have you improved since your first
// Headroom check?" is just a matter of bucketing them and diffing the ends.

export interface CltRow {
  analysis_date: string;
  daily_load_score: number;
  intrinsic_load: number;
  extraneous_load: number;
  germane_load: number;
}

export interface Bucket {
  key: string;          // YYYY-MM
  label: string;        // Mar 2026
  days: number;
  score: number;
  core: number;
  toxic: number;
  growth: number;
}

export interface Longitudinal {
  hasHistory: boolean;
  totalDays: number;
  firstDate: string | null;
  lastDate: string | null;
  spanDays: number;
  baseline: Bucket | null;   // first up-to-14 analyzed days
  current: Bucket | null;    // last up-to-14 analyzed days
  delta: { score: number; core: number; toxic: number; growth: number } | null;
  direction: "improved" | "worsened" | "steady" | null;
  months: Bucket[];
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

function summarize(rows: CltRow[], key: string, label: string): Bucket {
  return {
    key, label,
    days: rows.length,
    score: avg(rows.map((r) => r.daily_load_score ?? 0)),
    core: avg(rows.map((r) => r.intrinsic_load ?? 0)),
    toxic: avg(rows.map((r) => r.extraneous_load ?? 0)),
    growth: avg(rows.map((r) => r.germane_load ?? 0)),
  };
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** Only score days that actually have signal (a scored day with any load). */
export function buildLongitudinal(all: CltRow[]): Longitudinal {
  const rows = (all ?? [])
    .filter((r) => r && r.analysis_date && Number.isFinite(r.daily_load_score))
    .sort((a, b) => a.analysis_date.localeCompare(b.analysis_date));

  if (rows.length < 2) {
    return {
      hasHistory: false, totalDays: rows.length,
      firstDate: rows[0]?.analysis_date ?? null, lastDate: rows[rows.length - 1]?.analysis_date ?? null,
      spanDays: 0, baseline: null, current: null, delta: null, direction: null, months: [],
    };
  }

  const window = Math.min(14, Math.max(3, Math.floor(rows.length / 2)));
  const baseline = summarize(rows.slice(0, window), "baseline", "First check");
  const current = summarize(rows.slice(-window), "current", "Now");

  const delta = {
    score: current.score - baseline.score,
    core: current.core - baseline.core,
    toxic: current.toxic - baseline.toxic,
    growth: current.growth - baseline.growth,
  };

  const monthMap = new Map<string, CltRow[]>();
  for (const r of rows) {
    const k = r.analysis_date.slice(0, 7);
    if (!monthMap.has(k)) monthMap.set(k, []);
    monthMap.get(k)!.push(r);
  }
  const months = Array.from(monthMap.entries()).map(([k, rs]) => summarize(rs, k, monthLabel(k)));

  const first = rows[0].analysis_date, last = rows[rows.length - 1].analysis_date;
  const spanDays = Math.round((Date.parse(last) - Date.parse(first)) / 86400000);

  // Lower load score = healthier schedule.
  const direction = delta.score <= -4 ? "improved" : delta.score >= 4 ? "worsened" : "steady";

  return {
    hasHistory: true, totalDays: rows.length, firstDate: first, lastDate: last, spanDays,
    baseline, current, delta, direction, months,
  };
}

/** One-line text summary for the coach's system prompt. */
export function longitudinalPrompt(l: Longitudinal): string {
  if (!l.hasHistory || !l.baseline || !l.current || !l.delta) {
    return "(not enough history yet — fewer than 2 analyzed days)";
  }
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  return [
    `Tracked ${l.totalDays} analyzed days across ${l.spanDays} days (${l.firstDate} → ${l.lastDate}).`,
    `First check average: load ${l.baseline.score}/100 (Core ${l.baseline.core}, Toxic ${l.baseline.toxic}, Growth ${l.baseline.growth}).`,
    `Recent average: load ${l.current.score}/100 (Core ${l.current.core}, Toxic ${l.current.toxic}, Growth ${l.current.growth}).`,
    `Change since first check: load ${sign(l.delta.score)}, Core ${sign(l.delta.core)}, Toxic ${sign(l.delta.toxic)}, Growth ${sign(l.delta.growth)} — overall ${l.direction} (lower load score is healthier).`,
    `Monthly averages: ${l.months.map((m) => `${m.label} ${m.score}`).join(", ")}.`,
  ].join(" ");
}
