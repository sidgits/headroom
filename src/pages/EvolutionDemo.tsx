import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  Brain,
  Building2,
  Check,
  ChevronDown,
  Database,
  FileSpreadsheet,
  Gauge,
  Layers,
  Lightbulb,
  Play,
  RotateCcw,
  Pause,
  Scale,
  Sigma,
  Sparkles,
  Table2,
  TrendingDown,
  Users,
} from "lucide-react";
import {
  ALLOCATION,
  behavioralCost,
  behavioralMargin,
  C_baseline,
  COMMERCIALS,
  compositeRisk,
  DIMENSIONS,
  disciplinedRevenue,
  H_drag,
  H_PARTS,
  INDICATORS,
  INSIGHTS,
  L_shadow,
  M_discipline,
  M_PARTS,
  money,
  PI,
  PI_FORECAST,
  PI_FORECAST_DELTAS,
  PI_TODAY,
  R_ideal,
  RECOMMENDATIONS,
  reportedMargin,
  reportedProfit,
  SOURCES,
  TEAM_RISK,
  verdict,
  W_scope,
  WARNING,
  WARNING_SIGNALS,
} from "@/lib/behavioralOSDemo";

/* ------------------------------------------------------------------ */
/*  Playback primitives                                                */
/* ------------------------------------------------------------------ */

const STAGES = [
  { id: 0, label: "Source systems", sub: "ERP · Excel · Workfront" },
  { id: 1, label: "Risk logic", sub: "Weighting & signal routing" },
  { id: 2, label: "Commercial base", sub: "Revenue & allocation" },
  { id: 3, label: "Leading indicators", sub: "Delivery + cognitive load" },
  { id: 4, label: "Behavioral profit", sub: "Equation, insights, actions" },
];

const STAGE_MS = 3200;

/** Counts a number up once `active` flips true. */
function useCountUp(target: number, active: boolean, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) { setV(0); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return v;
}

const Num = ({ value, active, format }: { value: number; active: boolean; format: (n: number) => string }) => {
  const v = useCountUp(value, active);
  return <>{format(v)}</>;
};

/** Types a string out character by character. */
function useTypewriter(text: string, active: boolean, delay = 0) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) { setOut(""); return; }
    let i = 0;
    let timer: number | undefined;
    const startTimer = window.setTimeout(() => {
      timer = window.setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length && timer) window.clearInterval(timer);
      }, 22);
    }, delay);
    return () => {
      window.clearTimeout(startTimer);
      if (timer) window.clearInterval(timer);
    };
  }, [text, active, delay]);
  return out;
}

const bandColor = (band: string) =>
  band === "high"
    ? "text-red-600 bg-red-500/10 border-red-500/25"
    : band === "moderate"
      ? "text-amber-600 bg-amber-500/10 border-amber-500/25"
      : "text-emerald-600 bg-emerald-500/10 border-emerald-500/25";

const Stage = ({
  index,
  current,
  eyebrow,
  title,
  lede,
  children,
}: {
  index: number;
  current: number;
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) => {
  const active = current >= index;
  return (
    <section
      id={`stage-${index}`}
      className={`scroll-mt-28 transition-opacity duration-700 ${active ? "opacity-100" : "opacity-25"}`}
    >
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">{eyebrow}</p>
      </div>
      <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground leading-tight">{title}</h2>
      {lede && <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">{lede}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
};

const Flow = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-2 py-10">
    <ArrowDown className="w-5 h-5 text-primary animate-bounce" />
    <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">{label}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Stage 1 — source systems streaming in                              */
/* ------------------------------------------------------------------ */

const SOURCE_ICONS = [Database, FileSpreadsheet, Table2, Brain];

const SourceCard = ({ source, i, active }: { source: typeof SOURCES[number]; i: number; active: boolean }) => {
  const Icon = SOURCE_ICONS[i] ?? Database;
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (!active) { setFilled(0); return; }
    const id = window.setInterval(() => {
      setFilled((f) => (f >= source.fields.length ? f : f + 1));
    }, 260);
    return () => window.clearInterval(id);
  }, [active, source.fields.length]);

  const done = filled >= source.fields.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: active ? 1 : 0.4, y: 0 }}
      transition={{ delay: i * 0.12, duration: 0.5 }}
      className="rounded-2xl border border-border bg-card/70 backdrop-blur p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-sm text-foreground truncate">{source.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{source.kind}</p>
        </div>
        <span
          className={`ml-auto shrink-0 text-[10px] px-2 py-1 rounded-full border font-medium ${
            done
              ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
              : "text-primary border-primary/30 bg-primary/10"
          }`}
        >
          {done ? "Synced" : active ? "Reading…" : "Idle"}
        </span>
      </div>

      <div className="space-y-1.5">
        {source.fields.map((f, fi) => {
          const shown = fi < filled;
          return (
            <div
              key={f.label}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300 ${
                shown ? "border-border bg-background/60" : "border-dashed border-border/60 bg-transparent"
              }`}
            >
              <span className="text-[11px] text-muted-foreground flex-1 truncate">{f.label}</span>
              <AnimatePresence>
                {shown ? (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-mono text-[11px] text-foreground"
                  >
                    {f.value}
                  </motion.span>
                ) : (
                  <span className="font-mono text-[11px] text-muted-foreground/40">— — —</span>
                )}
              </AnimatePresence>
              {f.hint && shown && (
                <span className="hidden sm:inline text-[9px] font-mono text-accent">{f.hint}</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Stage 2 — risk logic                                               */
/* ------------------------------------------------------------------ */

const RiskEngine = ({ active }: { active: boolean }) => (
  <div className="rounded-2xl border border-border bg-card/70 backdrop-blur overflow-hidden">
    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
      <Layers className="w-4 h-4 text-accent" />
      <p className="font-heading text-sm text-foreground">MarginMix weighted scoring model</p>
      <span className="ml-auto text-[10px] font-mono text-muted-foreground">5 dimensions · 27 signals</span>
    </div>

    <div className="divide-y divide-border">
      {DIMENSIONS.map((d, i) => (
        <div key={d.name} className="px-5 py-4 grid md:grid-cols-[200px_1fr_auto] gap-3 md:gap-5 items-center">
          <div>
            <p className="text-sm text-foreground">{d.name}</p>
            <p className="text-[11px] font-mono text-muted-foreground">
              weight {Math.round(d.weight * 100)}% · {d.questions}
            </p>
          </div>
          <div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: active ? `${d.score}%` : 0 }}
                transition={{ delay: 0.25 + i * 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{d.rationale}</p>
          </div>
          <p className="font-mono text-sm text-foreground md:text-right">
            <Num value={d.score} active={active} format={(n) => n.toFixed(0)} /> /100
          </p>
        </div>
      ))}
    </div>

    <div className="px-5 py-5 bg-primary/5 border-t border-border flex flex-wrap items-center gap-4">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Composite risk</p>
        <p className="font-heading text-3xl text-foreground">
          <Num value={compositeRisk} active={active} format={(n) => n.toFixed(0)} />
        </p>
      </div>
      <div className="h-10 w-px bg-border hidden sm:block" />
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Verdict</p>
        <p className="font-heading text-lg text-red-600">{verdict(compositeRisk)}</p>
      </div>
      <p className="text-[11px] text-muted-foreground ml-auto max-w-xs">
        Confidence signal is neutral, so no hard override fires. Score routes straight into the
        behavioural cost terms below.
      </p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Stage 5 — equation                                                 */
/* ------------------------------------------------------------------ */

const Term = ({
  symbol,
  name,
  value,
  parts,
  active,
  tone,
}: {
  symbol: string;
  name: string;
  value: string;
  parts?: { label: string; value: number; note: string }[];
  active: boolean;
  tone: "revenue" | "cost";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: active ? 1 : 0.3, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`rounded-2xl border p-5 ${
      tone === "revenue" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card/70"
    }`}
  >
    <div className="flex items-baseline justify-between gap-3">
      <p className="font-mono text-sm text-accent">{symbol}</p>
      <p className="font-heading text-lg text-foreground">{value}</p>
    </div>
    <p className="text-xs text-muted-foreground mt-1">{name}</p>
    {parts && (
      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        {parts.map((p) => (
          <div key={p.label} className="flex items-start justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">{p.label}</span>
            <span className="font-mono text-[11px] text-foreground shrink-0">
              {p.value < 5 ? p.value.toFixed(2) : money(p.value)}
            </span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EvolutionDemo() {
  const [stage, setStage] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);
  const startedRef = useRef(false);

  const finished = stage >= STAGES.length - 1;

  const start = useCallback(() => {
    setStage(0);
    setPlaying(true);
    startedRef.current = true;
    setHint(false);
  }, []);

  const reset = useCallback(() => {
    setStage(-1);
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || stage < 0) return;
    if (stage >= STAGES.length - 1) { setPlaying(false); return; }
    const id = window.setTimeout(() => setStage((s) => s + 1), STAGE_MS);
    return () => window.clearTimeout(id);
  }, [playing, stage]);

  // Subtle invitation to press play shortly after arrival.
  useEffect(() => {
    const id = window.setTimeout(() => { if (!startedRef.current) setHint(true); }, 900);
    return () => window.clearTimeout(id);
  }, []);


  // Follow the playhead.
  useEffect(() => {
    if (stage < 0) return;
    const el = document.getElementById(`stage-${stage}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage]);

  const jump = (i: number) => { setStage(i); setPlaying(false); };

  const summary = useTypewriter(
    "Reported margin says this account earns $790,000. The Behavioral OS says it loses $98,210. The gap is $888,210 of shadow labor and cognitive drag that never reached the P&L.",
    stage >= 4,
    600,
  );

  const equationVisible = stage >= 4;

  const dimensionsDone = useMemo(() => stage >= 1, [stage]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>BehavioralOS — Loss-making engagements, flagged 90 days early</title>
        <meta
          name="description"
          content="BehavioralOS is an early warning system for services delivery: the engagement that's about to lose money, flagged 90 days before the P&L shows it — proven by the Behavioral Equation of Profit."
        />
        <link rel="canonical" href="https://headroomapp.co/evolution/demo" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://headroomapp.co/evolution/demo" />
        <meta
          property="og:title"
          content="BehavioralOS — the engagement that's about to lose money, flagged 90 days early"
        />
        <meta
          property="og:description"
          content="An interactive sample-data walkthrough: an early warning on a live engagement, and the Behavioral Equation of Profit arithmetic that produced it."
        />
        <meta property="og:image" content="https://headroomapp.co/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="BehavioralOS — the engagement that's about to lose money, flagged 90 days early"
        />
        <meta
          name="twitter:description"
          content="An interactive sample-data walkthrough: an early warning on a live engagement, and the arithmetic behind it."
        />
        <meta name="twitter:image" content="https://headroomapp.co/og-image.png" />
      </Helmet>

      {/* ---------------- Layer 1: the early warning ---------------- */}
      <section className="max-w-3xl mx-auto px-5 pt-10 md:pt-16 pb-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            to="/evolution"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> The thesis
          </Link>
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border rounded-full px-3 py-1">
            Sample data · not a live customer
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border overflow-hidden shadow-sm"
          style={{ borderColor: "#E5D5BE" }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3 border-b"
            style={{ background: "#FBF0EC", borderColor: "#F0DBD3" }}
          >
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#B84A3E" }} />
            <p
              className="text-[11px] tracking-[0.22em] uppercase font-medium"
              style={{ color: "#B84A3E" }}
            >
              Early warning · {WARNING.engagement}
            </p>
            <span className="ml-auto text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              {WARNING.account}
            </span>
          </div>

          <div className="bg-card/70 backdrop-blur px-5 md:px-7 py-6">
            <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight text-foreground">
              {WARNING.headline}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Forecast window: {WARNING.window} · {WARNING.confidence}
            </p>

            <div className="my-6 h-px bg-border" />

            <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground mb-4">
              What changed
            </p>
            <ul className="space-y-4">
              {WARNING_SIGNALS.map((s, i) => (
                <motion.li
                  key={s.text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.45 }}
                  className="flex gap-3"
                >
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "#B84A3E" }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm md:text-[15px] text-foreground leading-snug">{s.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {s.source} → <span className="font-mono">{s.term}</span>
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>

            <div
              className="mt-6 rounded-2xl border px-5 py-4"
              style={{ background: "#FBF0EC", borderColor: "#F0DBD3" }}
            >
              <p className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: "#B84A3E" }}>
                Recommended
              </p>
              <p className="text-sm text-foreground">{WARNING.recommendation}</p>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={() => {
              setDrillOpen((o) => !o);
              if (!drillOpen && stage < 0) window.setTimeout(start, 320);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/70 px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {drillOpen ? "Hide the calculation" : "How was this calculated?"}
            <ChevronDown
              className={`w-4 h-4 text-primary transition-transform ${drillOpen ? "rotate-180" : ""}`}
            />
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            The warning is the product. Π — the Behavioral Equation of Profit — is why it is right.
          </p>
        </div>
      </section>

      {drillOpen && (
        <>
      {/* Playback bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-3">
          <Link
            to="/evolution"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Evolution
          </Link>

          <div className="hidden md:flex items-center gap-1 mx-auto">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => jump(s.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] transition-colors ${
                  stage === s.id
                    ? "bg-primary text-primary-foreground"
                    : stage > s.id
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {stage > s.id && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                {s.label}
              </button>
            ))}
          </div>

          <div className="ml-auto md:ml-0 flex items-center gap-2">
            {!finished && (
              <button
                id="demo-play-button"
                onClick={() => (stage < 0 ? start() : setPlaying((p) => !p))}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {playing ? "Pause" : stage < 0 ? "Run" : "Play"}
              </button>
            )}
            {(finished || stage >= 0) && (
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Replay
              </button>
            )}
          </div>

        </div>
        <div className="h-0.5 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Subtle invitation to start */}
      <AnimatePresence>
        {hint && stage < 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.45 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={start}
              className="group inline-flex items-center gap-3 rounded-full border border-border bg-background/90 backdrop-blur-xl pl-3 pr-5 py-2.5 shadow-lg hover:shadow-xl transition-shadow"
            >
              <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                <Play className="w-3.5 h-3.5 relative" />
              </span>
              <span className="text-xs text-foreground">
                Press play to see the demo
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Hero */}
      <header className="max-w-6xl mx-auto px-5 pt-14 pb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-primary mb-4">
          Behind the warning · sample data
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-semibold leading-[1.05] max-w-3xl">
          Where the warning{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            comes from
          </span>
        </h2>
        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Northwind Group, a 34-person delivery footprint. The operating data arrives from the
          company's own systems, passes through MarginMix risk logic and Headroom cognitive load,
          and resolves into Π — the arithmetic that makes the warning a forecast rather than a hunch.
        </p>
        <p className="mt-4 text-xs text-muted-foreground/80">
          Illustrative sample dataset — no live customer data. The fields fill themselves.
        </p>
      </header>


      <main className="max-w-6xl mx-auto px-5 pb-28 space-y-4">
        {/* Stage 0 */}
        <Stage
          index={0}
          current={stage}
          eyebrow="Company's own sources"
          title="Data arrives from systems that already exist"
          lede="No new tracking layer. The OS reads what finance, commercial and resourcing already maintain, plus the behavioural telemetry Headroom and MarginMix generate."
        >
          <div className="grid md:grid-cols-2 gap-4">
            {SOURCES.map((s, i) => (
              <SourceCard key={s.id} source={s} i={i} active={stage >= 0} />
            ))}
          </div>
        </Stage>

        <Flow label="Proprietary risk logic · weighting · signal routing" />

        {/* Stage 1 */}
        <Stage
          index={1}
          current={stage}
          eyebrow="Processing layer"
          title="Every signal is routed, weighted and scored"
          lede="27 MarginMix questions map to five weighted dimensions. Headroom's Sweller decomposition runs in parallel on 3,418 calendar events. Both feed the same ledger."
        >
          <RiskEngine active={dimensionsDone} />
        </Stage>

        <Flow label="Base layer of the dashboard" />

        {/* Stage 2 */}
        <Stage
          index={2}
          current={stage}
          eyebrow="Base layer"
          title="Current commercials and resource allocation"
          lede="What the business believes it is earning, and where the people actually are."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COMMERCIALS.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: stage >= 2 ? 1 : 0.3, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card/70 backdrop-blur p-5"
              >
                <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground">{c.label}</p>
                <p className="font-heading text-2xl text-foreground mt-2">
                  <Num value={c.value} active={stage >= 2} format={money} />
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{c.note}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card/70 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <Users className="w-4 h-4 text-accent" />
              <p className="font-heading text-sm">Resource allocation</p>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">34 FTE · 46,900 hours</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    <th className="text-left font-normal px-5 py-3">Account / workstream</th>
                    <th className="text-right font-normal px-5 py-3">FTE</th>
                    <th className="text-right font-normal px-5 py-3">Hours</th>
                    <th className="text-right font-normal px-5 py-3">Senior mix</th>
                    <th className="text-right font-normal px-5 py-3">Utilisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ALLOCATION.map((r, i) => (
                    <motion.tr
                      key={r.account}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: stage >= 2 ? 1 : 0.25 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                    >
                      <td className="px-5 py-3 text-foreground">{r.account}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">{r.fte.toFixed(1)}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                        {r.hours.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">{r.seniorPct}%</td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`font-mono text-xs px-2 py-1 rounded-md border ${bandColor(
                            r.util >= 90 ? "high" : r.util >= 75 ? "moderate" : "low",
                          )}`}
                        >
                          {r.util}%
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Stage>

        <Flow label="The crux — delivery complexity meets human capacity" />

        {/* Stage 3 */}
        <Stage
          index={3}
          current={stage}
          eyebrow="Leading indicators"
          title="Delivery complexity and cognitive load, side by side"
          lede="These are the signals that move before revenue does. Each one is derived, not declared — the derivation sits under every number."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INDICATORS.map((ind, i) => (
              <motion.div
                key={ind.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: stage >= 3 ? 1 : 0.3, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card/70 backdrop-blur p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-foreground">{ind.name}</p>
                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${bandColor(ind.band)}`}>
                    {ind.band}
                  </span>
                </div>
                <p className="font-heading text-3xl text-foreground mt-3">
                  <Num value={ind.value} active={stage >= 3} format={(n) => n.toFixed(0)} />
                  <span className="text-sm text-muted-foreground ml-1">{ind.unit}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{ind.derivation}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card/70 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <Gauge className="w-4 h-4 text-accent" />
              <p className="font-heading text-sm">Cognitive load & burnout risk by team</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead>
                  <tr className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    <th className="text-left font-normal px-5 py-3">Team</th>
                    <th className="text-right font-normal px-5 py-3">People</th>
                    <th className="text-right font-normal px-5 py-3">Core</th>
                    <th className="text-right font-normal px-5 py-3">Toxic</th>
                    <th className="text-right font-normal px-5 py-3">Growth</th>
                    <th className="text-right font-normal px-5 py-3">Daily load</th>
                    <th className="text-right font-normal px-5 py-3">Burnout risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TEAM_RISK.map((t, i) => (
                    <motion.tr
                      key={t.team}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: stage >= 3 ? 1 : 0.25 }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                    >
                      <td className="px-5 py-3 text-foreground">{t.team}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">{t.people}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">{t.core}</td>
                      <td className="px-5 py-3 text-right font-mono text-red-600">{t.toxic}</td>
                      <td className="px-5 py-3 text-right font-mono text-emerald-600">{t.growth}</td>
                      <td className="px-5 py-3 text-right font-mono text-foreground">{t.load}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border ${bandColor(t.risk)}`}>
                          {t.risk}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Stage>

        <Flow label="Apply the Behavioral Equation of Profit" />

        {/* Stage 4 */}
        <Stage
          index={4}
          current={stage}
          eyebrow="The equation"
          title="Π = (M_discipline × R_ideal) − [C_baseline + L_shadow + (H_drag × W_scope)]"
          lede="Every term is now populated from the layers above. Nothing is estimated by hand."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Term
              symbol="M_discipline"
              name="Management discipline — geometric mean of three sub-scores"
              value={M_discipline.toFixed(3)}
              parts={M_PARTS}
              active={equationVisible}
              tone="revenue"
            />
            <Term
              symbol="R_ideal"
              name="Card-rate ideal revenue"
              value={money(R_ideal)}
              active={equationVisible}
              tone="revenue"
            />
            <Term
              symbol="C_baseline"
              name="Visible loaded cost already on the P&L"
              value={money(C_baseline)}
              active={equationVisible}
              tone="cost"
            />
            <Term
              symbol="L_shadow"
              name="Shadow labor — 7,500 unbilled hours × $62 blended rate"
              value={money(L_shadow)}
              active={equationVisible}
              tone="cost"
            />
            <Term
              symbol="H_drag"
              name="Cognitive drag — velocity loss plus burnout churn"
              value={money(H_drag)}
              parts={H_PARTS}
              active={equationVisible}
              tone="cost"
            />
            <Term
              symbol="W_scope"
              name="Scope weight — $2.40M evaluated ÷ $3.87M portfolio"
              value={W_scope.toFixed(3)}
              active={equationVisible}
              tone="cost"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: equationVisible ? 1 : 0.2, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <Sigma className="w-4 h-4 text-accent" />
              <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Resolution</p>
            </div>

            <div className="font-mono text-xs md:text-sm text-muted-foreground space-y-1.5">
              <p>
                ({M_discipline.toFixed(3)} × {money(R_ideal)}) = {money(disciplinedRevenue)}
              </p>
              <p>
                {money(C_baseline)} + {money(L_shadow)} + ({money(H_drag)} × {W_scope.toFixed(3)}) ={" "}
                {money(behavioralCost)}
              </p>
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-5">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Reported profit</p>
                <p className="font-heading text-3xl text-emerald-600 mt-1">
                  <Num value={reportedProfit} active={equationVisible} format={money} />
                </p>
                <p className="text-[11px] text-muted-foreground">{reportedMargin.toFixed(1)}% margin on ACV</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Behavioral profit Π</p>
                <p className="font-heading text-4xl text-red-600 mt-1">
                  <Num value={PI} active={equationVisible} format={(n) => `−${money(Math.abs(n))}`} />
                </p>
                <p className="text-[11px] text-muted-foreground">{behavioralMargin.toFixed(1)}% true margin</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Invisible gap</p>
                <p className="font-heading text-3xl text-foreground mt-1">
                  <Num value={reportedProfit - PI} active={equationVisible} format={money} />
                </p>
                <p className="text-[11px] text-muted-foreground">Shadow labor + cognitive drag</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-foreground leading-relaxed min-h-[3.5rem]">
              {summary}
              {equationVisible && summary.length < 160 && (
                <span className="inline-block w-1.5 h-4 bg-primary align-middle ml-0.5 animate-pulse" />
              )}
            </p>
          </motion.div>

          {/* Insights */}
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-accent" />
              <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
                Auto-generated insights
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {INSIGHTS.map((ins, i) => (
                <motion.div
                  key={ins.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: equationVisible ? 1 : 0.25, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
                  className="rounded-2xl border border-border bg-card/70 backdrop-blur p-5"
                >
                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                    {ins.tag}
                  </span>
                  <p className="font-heading text-sm text-foreground mt-3">{ins.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">{ins.body}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-8 rounded-2xl border border-border bg-card/70 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <p className="font-heading text-sm">Recommended interventions</p>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                Recoverable: {money(RECOMMENDATIONS.reduce((s, r) => s + r.impact, 0))}
              </span>
            </div>
            <div className="divide-y divide-border">
              {RECOMMENDATIONS.map((r, i) => (
                <motion.div
                  key={r.action}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: equationVisible ? 1 : 0.25, x: 0 }}
                  transition={{ delay: 1.1 + i * 0.15, duration: 0.45 }}
                  className="px-5 py-4 flex items-start gap-4"
                >
                  <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{r.action}</p>
                    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{r.detail}</p>
                  </div>
                  <p className="font-mono text-sm text-emerald-600 shrink-0">+{money(r.impact)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Stage>

        <div className="pt-16 text-center">
          <p className="text-sm text-muted-foreground">
            V1 mockup — logic sourced from the Headroom deterministic blueprint and the MarginMix risk model.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { reset(); window.setTimeout(start, 120); }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" /> Replay the flow
            </button>
            <Link
              to="/evolution"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Building2 className="w-4 h-4" /> Back to the Behavioral OS
            </Link>
          </div>
        </div>
      </main>
        </>
      )}
    </div>
  );
}
