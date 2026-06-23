import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { roles } from "@/data/quizQuestions";

interface RoleSelectorProps {
  onSelect: (roleId: string) => void;
  onBack: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const RoleSelector = ({ onSelect, onBack }: RoleSelectorProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[50%] translate-x-[-50%] w-[120%] h-[50%] rounded-full bg-gradient-to-b from-primary/10 via-accent/5 to-transparent blur-3xl" />
      </div>

      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-10 w-10 h-10 rounded-full bg-card/80 border border-border/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-secondary hover:border-primary/40 transition-all shadow-sm"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <motion.p
        className="relative text-sm text-muted-foreground uppercase tracking-widest mb-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Step 1
      </motion.p>
      <motion.h2
        className="relative text-2xl md:text-3xl font-bold text-foreground text-center mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        What best describes your role?
      </motion.h2>
      <motion.p
        className="relative text-muted-foreground text-center mb-8 max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        This helps us tailor your results.
      </motion.p>

      <div className="relative w-full max-w-md space-y-3">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            onClick={() => onSelect(role.id)}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full min-h-[56px] px-5 py-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm text-left transition-colors hover:border-primary/60 hover:bg-secondary/80 shadow-sm hover:shadow-md hover:shadow-primary/10"
          >
            <span className="font-semibold text-foreground">{role.label}</span>
            <span className="block text-sm text-muted-foreground mt-0.5">
              {role.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
