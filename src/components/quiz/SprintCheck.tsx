import { useState } from "react";
import { motion } from "framer-motion";

interface SprintCheckProps {
  onAnswer: (answerId: string) => void;
}

const SprintCheck = ({ onAnswer }: SprintCheckProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answerId: string) => {
    if (selected) return;
    setSelected(answerId);
    setTimeout(() => {
      onAnswer(answerId);
      setSelected(null);
    }, 300);
  };

  const options = [
    {
      id: "A",
      text: "Yes — I've been running at this pace for weeks and I can't slow down",
    },
    {
      id: "B",
      text: "No — this is temporary and I know it will ease up soon",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[50%] translate-x-[-50%] w-[90%] h-[40%] rounded-full bg-gradient-to-b from-accent/12 via-warm-red/8 to-transparent blur-3xl" />
      </div>

      <motion.div
        className="relative max-w-md w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-warm-red/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-2xl">⚡</span>
        </motion.div>
        <motion.h2
          className="text-[22px] md:text-2xl font-bold text-foreground text-center leading-snug mb-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          One more thing…
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Your answers suggest you might be in a sprint pattern. Does this feel accurate?
        </motion.p>

        <div className="space-y-3">
          {options.map((opt, i) => {
            const isSelected = selected === opt.id;
            return (
              <motion.button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={!!selected}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={!selected ? { scale: 1.02, y: -1 } : {}}
                whileTap={!selected ? { scale: 0.98 } : {}}
                className={`w-full min-h-[56px] px-5 py-4 rounded-xl border text-left transition-all duration-300 shadow-sm ${
                  isSelected
                    ? "border-primary bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                    : "border-border/60 bg-card/60 backdrop-blur-sm text-foreground hover:border-primary/60 hover:bg-secondary/80 hover:shadow-md hover:shadow-primary/10"
                } ${selected && !isSelected ? "opacity-40 scale-[0.98]" : ""}`}
              >
                <span className="font-medium">{opt.text}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SprintCheck;
