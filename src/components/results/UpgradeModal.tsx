import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, TrendingUp, CheckSquare, Calendar, Activity, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const features = [
  { icon: User, title: "Full Archetype Profile", desc: "Complete work pattern analysis with burnout markers." },
  { icon: TrendingUp, title: "Pattern Shifts Over Time", desc: "Longitudinal trend tracking across retakes." },
  { icon: CheckSquare, title: "Check-In Tracker", desc: "Daily headroom status logging." },
  { icon: Calendar, title: "Calendar Integration", desc: "Google Calendar or .ics upload for load scoring." },
  { icon: Activity, title: "Daily Cognitive Load Analysis", desc: "CLT-based burnout risk classification." },
  { icon: MessageCircle, title: "Burnout Mitigation Chat", desc: "CLT-grounded chat agent." },
];

const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Skip Stripe on preview domains for testing
      if (typeof window !== "undefined" && window.location.hostname.includes("lovable.app")) {
        window.location.href = "/dashboard";
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("checkout failed", e);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-card border border-border rounded-3xl max-w-lg w-full my-8 p-6 sm:p-8"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-foreground mb-1">Access the Headroom Dashboard</h2>
            <p className="text-sm text-muted-foreground mb-6">Everything you unlock as a member.</p>

            <div className="space-y-3 mb-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 items-start bg-secondary/40 border border-border/50 rounded-xl p-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary via-accent to-warm-red text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : "Subscribe now — Monthly billing"}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3">Cancel anytime.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
