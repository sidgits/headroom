import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";

export interface Bucket {
  key: string; label: string; days: number;
  score: number; core: number; toxic: number; growth: number;
}
export interface Longitudinal {
  hasHistory: boolean;
  totalDays: number;
  firstDate: string | null;
  lastDate: string | null;
  spanDays: number;
  baseline: Bucket | null;
  current: Bucket | null;
  delta: { score: number; core: number; toxic: number; growth: number } | null;
  direction: "improved" | "worsened" | "steady" | null;
  months: Bucket[];
}

const fmt = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

function Delta({ value, invert = false, label }: { value: number; invert?: boolean; label: string }) {
  // For load scores, lower is better. For Growth Load, higher is better (invert).
  const better = invert ? value > 0 : value < 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-1 flex items-center gap-1 text-lg font-bold ${neutral ? "text-muted-foreground" : better ? "text-primary" : "text-destructive"}`}>
        <Icon className="w-4 h-4" />
        {value > 0 ? `+${value}` : value}
      </div>
    </div>
  );
}

export default function LongitudinalTrend({ data }: { data: Longitudinal | null | undefined }) {
  if (!data) return null;

  if (!data.hasHistory || !data.baseline || !data.current || !data.delta) {
    return (
      <section className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5 space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Progress since your first check</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Keep your calendar synced. Once you have a few more analyzed days, you&apos;ll see how your load has moved since day one.
        </p>
      </section>
    );
  }

  const { baseline, current, delta, months } = data;
  const max = Math.max(100, ...months.map((m) => m.score));
  const verdict =
    data.direction === "improved" ? "Your schedule is lighter than when you started."
    : data.direction === "worsened" ? "Your schedule has gotten heavier since you started."
    : "Your load has held roughly steady since you started.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5 space-y-4"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Progress since your first check</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {verdict} {data.totalDays} analyzed days · {fmt(data.firstDate)} → {fmt(data.lastDate)}.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Delta label="Overall load" value={delta.score} />
        <Delta label="Core load" value={delta.core} />
        <Delta label="Toxic load" value={delta.toxic} />
        <Delta label="Growth load" value={delta.growth} invert />
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {[baseline, current].map((b, i) => (
          <div key={b.key} className="rounded-xl border border-border bg-background p-3">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
              {i === 0 ? "First check average" : "Recent average"}
            </div>
            <div className="text-2xl font-bold">{b.score}<span className="text-sm font-medium text-muted-foreground">/100</span></div>
            <div className="text-xs text-muted-foreground mt-1">
              Core {b.core} · Toxic {b.toxic} · Growth {b.growth} · {b.days} days
            </div>
          </div>
        ))}
      </div>

      {months.length > 1 && (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Monthly average load</div>
          <div className="flex items-end gap-2 h-28">
            {months.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[11px] font-semibold">{m.score}</span>
                <div className="w-full bg-secondary rounded-t-md flex items-end" style={{ height: "100%" }}>
                  <div className="w-full bg-primary/70 rounded-t-md" style={{ height: `${Math.round((m.score / max) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
