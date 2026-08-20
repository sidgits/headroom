import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import type { ScoringResult } from "@/lib/scoring";
import { supabase } from "@/integrations/supabase/client";
import UpgradeModal from "./UpgradeModal";


interface ResultsScreenProps {
  result: ScoringResult;
  role: string;
  email: string;
  name?: string;
  onRetake: () => void;
}

const ResultsScreen = ({ result, role, email, name, onRetake }: ResultsScreenProps) => {
  const { archetype, dimensionScores, mirror, burnoutRisk, shadowArchetype, recommendations } = result;

  const logged = useRef(false);
  const archetypeRef = useRef<HTMLDivElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);


  useEffect(() => {
    window.scrollTo(0, 0);

    if (email) {
      try { localStorage.setItem("headroom_assessment_email", email); } catch {}
    }

    if (!logged.current) {
      logged.current = true;
      supabase.functions.invoke("log-assessment", {
        body: {
          role,
          archetype_id: archetype.id,
          archetype_name: archetype.name,
          email,
          name,
          result_data: result,
        },
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[140%] h-[50%] rounded-full bg-gradient-to-b from-primary/12 via-accent/8 to-transparent blur-3xl" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[40%] rounded-full bg-gradient-to-tl from-warm-red/8 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-6 py-12 space-y-8">

        {/* LAYER 1 — THE REVEAL */}
        <motion.div
          ref={archetypeRef}
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            {archetype.emoji}
          </motion.div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
            Your Headroom Profile
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {archetype.name}
          </h1>
          <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-warm-red font-semibold italic leading-relaxed max-w-sm mx-auto">
            {archetype.headline}
          </p>
          <p className="text-xs text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed">
            Rooted in Sweller's Cognitive Load Theory — the gold standard in understanding how the brain processes work.
          </p>
        </motion.div>

        {/* LAYER 2 — THE MIRROR */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {burnoutRisk && (
            <div className="text-center">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-warm-red/10 text-warm-red border border-warm-red/20">
                Burnout Risk — {burnoutRisk.label}
              </span>
            </div>
          )}

          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
              At your best
            </h3>
            <p className="text-muted-foreground leading-relaxed text-[15px]">{mirror.atYourBest}</p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
              What's working against you
            </h3>
            <p className="text-muted-foreground leading-relaxed text-[15px]">{mirror.workingAgainstYou}</p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-warm-red">
              The pattern you probably haven't noticed
            </h3>
            <p className="text-muted-foreground leading-relaxed text-[15px]">{mirror.patternNotNoticed}</p>
          </div>
        </motion.div>

        {/* LAYER 2.5 — FREE ARCHETYPE INSIGHTS */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Free insights
            </span>
            <span className="text-xs text-muted-foreground">Based on your {archetype.name} pattern</span>
          </div>

          {shadowArchetype && (
            <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/70">
                Where you drift under pressure
              </h3>
              <p className="text-[15px] font-semibold text-foreground">{shadowArchetype.name}</p>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{shadowArchetype.description}</p>
            </div>
          )}

          {result.aiLoad && (
            <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
                  Your AI Load
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {result.aiLoad.band}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{result.aiLoad.meaning}</p>

              {result.aiLoad.split && (
                <div className="pt-3 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                    Where this load actually lands
                  </p>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="bg-warm-red" style={{ width: `${result.aiLoad.split.toxic}%` }} />
                    <div className="bg-primary" style={{ width: `${result.aiLoad.split.core}%` }} />
                    <div className="bg-accent" style={{ width: `${result.aiLoad.split.growth}%` }} />
                  </div>
                  <ul className="space-y-2">
                    <li className="text-[14px] leading-relaxed">
                      <span className="font-semibold text-warm-red">Toxic Load · {result.aiLoad.split.toxic}%</span>
                      <span className="text-muted-foreground"> — {result.aiLoad.split.toxicWhy}</span>
                    </li>
                    <li className="text-[14px] leading-relaxed">
                      <span className="font-semibold text-primary">Core Load · {result.aiLoad.split.core}%</span>
                      <span className="text-muted-foreground"> — {result.aiLoad.split.coreWhy}</span>
                    </li>
                    <li className="text-[14px] leading-relaxed">
                      <span className="font-semibold text-accent">Growth Load · {result.aiLoad.split.growth}%</span>
                      <span className="text-muted-foreground"> — {result.aiLoad.split.growthWhy}</span>
                    </li>
                  </ul>
                  <p className="text-[14px] text-foreground/80 leading-relaxed">{result.aiLoad.split.summary}</p>
                </div>
              )}

              {result.aiLoad.drivers && result.aiLoad.drivers.length > 0 && (
                <div className="pt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                    What drove this — answer by answer
                  </p>
                  <ul className="space-y-3">
                    {result.aiLoad.drivers.map((driver, index) => (
                      <li
                        key={`${driver.questionNumber}-${index}`}
                        className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {driver.questionNumber > 0 ? `Question ${driver.questionNumber}` : "Combined answers"}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                              driver.weight === "primary"
                                ? "bg-accent/10 text-accent border-accent/20"
                                : driver.weight === "amplifier"
                                  ? "bg-warm-red/10 text-warm-red border-warm-red/20"
                                  : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {driver.weight === "primary"
                              ? "Sets your score"
                              : driver.weight === "amplifier"
                                ? "Raises your load"
                                : "Protects you"}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-snug">{driver.question}</p>
                        <p className="text-[14px] font-semibold text-foreground leading-snug">
                          &ldquo;{driver.answer}&rdquo;
                        </p>
                        <p className="text-[14px] text-muted-foreground leading-relaxed">{driver.effect}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-1">
                AI Load is the fourth dimension in your profile. The exact score — and how it changes the way your
                calendar should be defended — sits in your dashboard.
              </p>


            </div>
          )}


          {burnoutRisk && (
            <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-warm-red">
                Your early warning signal
              </h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{burnoutRisk.signal}</p>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{burnoutRisk.earlyIntervention}</p>
            </div>
          )}

          {recommendations?.[0] && (
            <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-6 space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                One move to try this week
              </h3>
              <p className="text-foreground/90 leading-relaxed text-[15px]">{recommendations[0]}</p>
              <p className="text-xs text-muted-foreground pt-1">
                This is the single highest-leverage change for your archetype. The full plan — and whether it's
                actually working — lives in your dashboard.
              </p>
            </div>
          )}
        </motion.div>

        {/* LAYER 3 — DIMENSION BARS (digital lexicon) — blurred behind upgrade gate */}
        <div className="relative">
          <motion.div
            className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-5 blur-md pointer-events-none select-none"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            aria-hidden="true"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Your Headroom Dimensions
            </h3>
            {dimensionScores.map((dim, i) => {
              const pct = (dim.score / dim.maxScore) * 100;
              return (
                <div key={dim.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{dim.name} ({dim.code})</span>
                    <span className="text-muted-foreground">
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <p className="text-xs italic text-muted-foreground -mt-1">
                    {dim.code === "E" ? "Toxic Cognitive Load" : dim.code === "I" ? "Core Cognitive Load" : dim.code === "A" ? "AI Cognitive Load" : "Growth Cognitive Load"}
                  </p>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.7 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{dim.plainLanguage}</p>
                  <p className="text-sm text-foreground/80">{dim.interpretation}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Upgrade CTA overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div className="w-full max-w-md rounded-2xl border border-primary/25 bg-card/95 backdrop-blur-xl shadow-xl p-5 sm:p-6 space-y-4">
              <div className="text-center space-y-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-warm-red/10 text-warm-red border border-warm-red/20">
                  Locked
                </span>
                <h3 className="text-lg font-bold text-foreground">Unlock your full Headroom Profile</h3>
                <p className="text-xs text-muted-foreground">
                  You've seen the pattern. The dashboard shows you the numbers — and what to do next.
                </p>
              </div>

              <ul className="space-y-2.5">
                {[
                  { t: "Your four load scores", d: "Toxic, Core, Growth and AI Load — measured, not guessed." },
                  { t: "Calendar load analysis", d: "Upload your calendar and see which days will break you." },
                  { t: "Tracking over time", d: "Check in daily and watch your pattern shift." },
                  { t: "Your AI burnout coach", d: "Grounded in your actual scores, available anytime." },
                ].map((b) => (
                  <li key={b.t} className="flex gap-2.5 items-start">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-xs leading-relaxed">
                      <span className="font-semibold text-foreground">{b.t}</span>
                      <span className="text-muted-foreground"> — {b.d}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary via-accent to-warm-red text-primary-foreground font-semibold text-sm sm:text-base shadow-lg hover:opacity-90 transition"
              >
                Click here for Calendar Insights &amp; Access personalized AI coach
              </button>
              <p className="text-[11px] text-center text-muted-foreground">
                Free for a limited time.
              </p>
            </div>
          </motion.div>
        </div>

      </div>

      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};


export default ResultsScreen;
