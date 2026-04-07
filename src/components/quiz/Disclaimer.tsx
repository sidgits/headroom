import { motion } from "framer-motion";

interface DisclaimerProps {
  onStart: () => void;
}

const Disclaimer = ({ onStart }: DisclaimerProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[50%] translate-x-[-50%] w-[80%] h-[40%] rounded-full bg-gradient-to-b from-primary/10 via-accent/5 to-transparent blur-3xl" />
      </div>

      <motion.div
        className="relative max-w-md text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-2xl">🧠</span>
        </motion.div>
        <motion.h2
          className="text-2xl font-bold text-foreground mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Before we begin
        </motion.h2>
        <motion.p
          className="text-muted-foreground leading-relaxed mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          This isn't a personality test. There are no right or wrong answers.
          Headroom measures the invisible weight your brain carries every day —
          the friction, the complexity, and the space you have (or don't) to grow.
          Answer honestly. The more truthful you are, the more useful your results will be.
        </motion.p>
        <motion.button
          onClick={onStart}
          className="w-full max-w-xs h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          Start the assessment
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Disclaimer;
