import { motion } from "framer-motion";
import { Share2, Twitter, Linkedin, Link, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { ScoringResult } from "@/lib/scoring";

interface ResultsScreenProps {
  result: ScoringResult;
  role: string;
  onRetake: () => void;
}

const burnoutColors: Record<string, string> = {
  low: "text-golden",
  moderate: "text-primary",
  high: "text-deep-orange",
  critical: "text-warm-red",
};

const burnoutBgColors: Record<string, string> = {
  low: "from-golden/20 to-golden/5",
  moderate: "from-primary/20 to-primary/5",
  high: "from-deep-orange/20 to-deep-orange/5",
  critical: "from-warm-red/20 to-warm-red/5",
};

const ShareButtons = ({ archetype }: { archetype: ScoringResult["archetype"] }) => {
  const [copied, setCopied] = useState(false);
  const shareText = `I'm "${archetype.name}" — ${archetype.headline}. Take the Headroom assessment to discover your cognitive load pattern.`;
  const shareUrl = window.location.origin;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const handleLinkedin = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Headroom Results", text: shareText, url: shareUrl });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <motion.button
        onClick={handleNativeShare}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="h-11 px-5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
      >
        <Share2 className="w-4 h-4" />
        Share my results
      </motion.button>
      <motion.button
        onClick={handleTwitter}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        aria-label="Share on X"
      >
        <Twitter className="w-4 h-4" />
      </motion.button>
      <motion.button
        onClick={handleLinkedin}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </motion.button>
      <motion.button
        onClick={handleCopyLink}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        aria-label="Copy link"
      >
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Link className="w-4 h-4" />}
      </motion.button>
    </div>
  );
};

const ResultsScreen = ({ result, role, onRetake }: ResultsScreenProps) => {
  const { archetype, burnoutRisk, dimensionScores, recommendations } = result;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[140%] h-[50%] rounded-full bg-gradient-to-b from-primary/12 via-accent/8 to-transparent blur-3xl" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[40%] rounded-full bg-gradient-to-tl from-warm-red/8 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-6 py-12 space-y-8">
        {/* Archetype Header */}
        <motion.div
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
            Your pattern
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {archetype.name}
          </h1>
          <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-warm-red font-semibold">
            {archetype.headline}
          </p>
        </motion.div>

        {/* Archetype Description */}
        <motion.div
          className="backdrop-blur-sm bg-card/50 border border-border/50 rounded-2xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-muted-foreground leading-relaxed">{archetype.description}</p>
        </motion.div>

        {/* Burnout Risk */}
        <motion.div
          className={`rounded-2xl p-6 bg-gradient-to-br ${burnoutBgColors[burnoutRisk.level]} border border-border/30`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-sm font-bold uppercase tracking-wider ${burnoutColors[burnoutRisk.level]}`}>
              {burnoutRisk.label}
            </div>
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-sm text-muted-foreground">Burnout Risk</span>
          </div>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {burnoutRisk.description}
          </p>
        </motion.div>

        {/* Dimension Breakdown */}
        <motion.div
          className="backdrop-blur-sm bg-card/50 border border-border/50 rounded-2xl p-6 space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Your Dimensions
          </h3>
          {dimensionScores.map((dim, i) => {
            const pct = (dim.score / dim.maxScore) * 100;
            return (
              <div key={dim.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-foreground">{dim.name}</span>
                  <span className="text-muted-foreground">
                    {dim.score}/{dim.maxScore}
                  </span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.7 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-1">
            Higher scores indicate greater cognitive load in that area.
          </p>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          className="backdrop-blur-sm bg-card/50 border border-border/50 rounded-2xl p-6 space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            What to do next
          </h3>
          {recommendations.map((rec, i) => (
            <motion.div
              key={i}
              className="flex gap-3 items-start"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
            >
              <span className="mt-0.5 w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-foreground/80 text-sm leading-relaxed">{rec}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Share & Retake */}
        <motion.div
          className="space-y-4 pt-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <ShareButtons archetype={archetype} />
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
