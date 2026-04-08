import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import type { ScoringResult } from "@/lib/scoring";
import { generateResultsPDF } from "@/lib/generatePDF";
import { supabase } from "@/integrations/supabase/client";

interface ResultsScreenProps {
  result: ScoringResult;
  role: string;
  onRetake: () => void;
}

const burnoutColors: Record<string, string> = {
  low: "text-golden",
  moderate: "text-primary",
  high: "text-deep-orange",
};

const burnoutBgColors: Record<string, string> = {
  low: "from-golden/20 to-golden/5",
  moderate: "from-primary/20 to-primary/5",
  high: "from-deep-orange/20 to-deep-orange/5",
};

const ShareButtons = ({ archetype, captureRef }: { archetype: ScoringResult["archetype"]; captureRef: React.RefObject<HTMLDivElement> }) => {
  const shareText = `I'm the ${archetype.name}, visit headroomapp.co to know your headroom profile!`;

  const captureAndShare = useCallback(async (platform: string) => {
    let imageBlob: Blob | null = null;

    if (captureRef.current) {
      try {
        const canvas = await html2canvas(captureRef.current, {
          backgroundColor: "#0c0a09",
          scale: 2,
          useCORS: true,
        });
        imageBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((blob) => resolve(blob), "image/png")
        );
      } catch (e) {
        console.error("Screenshot capture failed", e);
      }
    }

    // Try Web Share API with image if supported
    if (imageBlob && navigator.share && navigator.canShare) {
      const file = new File([imageBlob], "headroom-result.png", { type: "image/png" });
      const shareData: ShareData = { text: shareText, files: [file] };
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (e) {
          // User cancelled or error — fall through to URL sharing
        }
      }
    }

    // Fallback: download image then open share URL
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "headroom-result.png";
      a.click();
      URL.revokeObjectURL(url);
    }

    const shareUrls: Record<string, string> = {
      X: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://headroomapp.co")}&quote=${encodeURIComponent(shareText)}`,
      LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://headroomapp.co")}`,
      WhatsApp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      Instagram: `https://www.instagram.com/`,
    };

    window.open(shareUrls[platform], "_blank", "noopener,noreferrer");
  }, [archetype, shareText, captureRef]);

  const XIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );

  const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );

  const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );

  const socials = [
    { icon: XIcon, label: "X" },
    { icon: InstagramIcon, label: "Instagram" },
    { icon: FacebookIcon, label: "Facebook" },
    { icon: LinkedInIcon, label: "LinkedIn" },
    { icon: WhatsAppIcon, label: "WhatsApp" },
  ];

  return (
    <div className="space-y-5">
      <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Share Your Result
      </p>

      <div className="flex items-center justify-center gap-4">
        {socials.map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            onClick={() => captureAndShare(label)}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-200">
              <Icon />
            </div>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const ResultsScreen = ({ result, role, onRetake }: ResultsScreenProps) => {
  const { archetype, burnoutRisk, dimensionScores, recommendations, mirror, shadowArchetype } = result;

  const logged = useRef(false);
  const archetypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!logged.current) {
      logged.current = true;
      supabase.functions.invoke("log-assessment", {
        body: {
          role,
          archetype_id: archetype.id,
          archetype_name: archetype.name,
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

        {/* LAYER 3 — DIMENSION BARS */}
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

        {/* LAYER 4 — SHADOW ARCHETYPE */}
        <motion.div
          className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Under pressure you shift toward
          </h3>
          <p className="text-lg font-semibold text-foreground">{shadowArchetype.name}</p>
          <p className="text-muted-foreground leading-relaxed text-[15px]">{shadowArchetype.description}</p>
        </motion.div>

        {/* LAYER 5 — THE ONE UNLOCK */}
        <motion.div
          className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            What to do next
          </h3>
          <p className="text-foreground/90 leading-relaxed text-[15px]">{recommendations[0]}</p>
        </motion.div>

        {/* LAYER 6 — BURNOUT RISK SIGNAL */}
        <motion.div
          className={`rounded-2xl p-6 bg-gradient-to-br ${burnoutBgColors[burnoutRisk.level]} border border-border/30 space-y-3`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className={`text-sm font-bold uppercase tracking-wider ${burnoutColors[burnoutRisk.level]}`}>
              Burnout Risk: {burnoutRisk.label}
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Signal: {burnoutRisk.signal}
          </p>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {burnoutRisk.description}
          </p>
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Early intervention</p>
            <p className="text-foreground/80 text-sm leading-relaxed">{burnoutRisk.earlyIntervention}</p>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Derived from your E / I / G score signature. Not a diagnosis — an early pattern signal.
          </p>
        </motion.div>

        {/* LAYER 7 — SHARE + RETURN */}
        <motion.div
          className="space-y-6 pt-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <motion.button
            onClick={() => generateResultsPDF(result, role)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 transition-all"
          >
            <Download className="w-5 h-5" />
            Download my profile
          </motion.button>

          <ShareButtons archetype={archetype} captureRef={archetypeRef} />
          <div className="text-center">
            <button
              onClick={onRetake}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Retake the assessment
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsScreen;
