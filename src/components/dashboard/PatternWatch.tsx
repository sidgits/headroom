import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export interface PatternWeek {
  key: string; label: string; days: number;
  score: number; toxic: number; growth: number;
}

export default function PatternWatch({ weeks }: { weeks: PatternWeek[] }) {
  const recent = (weeks ?? []).slice(-6);
  if (recent.length < 2) return null;

  const last = recent[recent.length - 1];
  const first = recent[0];
  const scoreDelta = last.score - first.score;
  const growthDelta = last.growth - first.growth;
  const max = Math.max(40, ...recent.map((w) => w.score));

  const Trend = scoreDelta <= -4 ? TrendingDown : scoreDelta >= 4 ? TrendingUp : Minus;
  const tone = scoreDelta <= -4 ? "text-primary" : scoreDelta >= 4 ? "text-[hsl(var(--warm-red))]" : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pattern watch</div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${tone}`}>
          <Trend className="w-3.5 h-3.5" />
          {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} load
        </span>
      </div>

      <div className="flex items-end gap-1.5 h-20">
        {recent.map((w) => (
          <div key={w.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              <div className="w-full rounded-t-md bg-gradient-to-t from-[hsl(var(--golden))]/40 to-[hsl(var(--warm-red))]/70"
                style={{ height: `${Math.max(6, (w.score / max) * 100)}%` }}
                title={`Week of ${w.label}: load ${w.score}, Toxic ${w.toxic}, Growth ${w.growth}`} />
            </div>
            <span className="text-[9px] text-muted-foreground">{w.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Weekly average load over the last {recent.length} weeks.{" "}
        {scoreDelta >= 4
          ? "Load is drifting up — the Action Center items above are the cheapest way to reverse it."
          : scoreDelta <= -4
            ? "Load is trending down. Whatever you changed is working."
            : "Load is holding steady."}
        {growthDelta <= -5 && " Deep-work time has slipped, which usually shows up as fatigue two to three weeks later."}
      </p>
    </div>
  );
}
