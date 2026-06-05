import { useEffect, useRef, useState } from "react";
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
  const { archetype, dimensionScores, mirror } = result;

  const logged = useRef(false);
  const archetypeRef = useRef<HTMLDivElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);


  useEffect(() => {
    window.scrollTo(0, 0);

    if (!logged.current) {
      logged.current = true;
      supabase.functions.invoke("log-assessment", {
        body: {
          role,
          archetype_id: archetype.id,
          archetype_name: archetype.name,
          email,
          name,
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

        {/* LAYER 3 — DIMENSION BARS (digital lexicon) */}
        <motion.div
          className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
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
                  {dim.code === "E" ? "Extraneous Cognitive Load" : dim.code === "I" ? "Intrinsic Cognitive Load" : "Germane Cognitive Load"}
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

        {/* Retake link */}
        <motion.div
          className="text-center pt-2 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <button
            onClick={onRetake}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Retake the assessment
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsScreen;
