import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Building2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface PreAssessmentCheckProps {
  onIndividual: () => void;
  onCorporateVerified: (data: { name: string; email: string }) => void;
  onBack: () => void;
}

type Mode = "choice" | "corporate";

const PreAssessmentCheck = ({ onIndividual, onCorporateVerified, onBack }: PreAssessmentCheckProps) => {
  const [mode, setMode] = useState<Mode>("choice");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleVerify = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    setError("");
    if (!trimmedName) return setError("Please enter your name");
    if (trimmedName.length > 80) return setError("Name is too long");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return setError("Please enter a valid email");

    const domain = trimmedEmail.split("@")[1];
    setChecking(true);
    try {
      const { data, error: queryError } = await supabase
        .from("corporate_domains")
        .select("domain")
        .ilike("domain", domain)
        .maybeSingle();
      if (queryError) {
        setError("Could not verify your domain. Please try again.");
        return;
      }
      if (!data) {
        setError("Unrecognized Domain");
        return;
      }
      onCorporateVerified({ name: trimmedName, email: trimmedEmail });
    } finally {
      setChecking(false);
    }
  };

  const handleBack = () => {
    if (mode === "corporate") {
      setMode("choice");
      setError("");
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[50%] translate-x-[-50%] w-[120%] h-[50%] rounded-full bg-gradient-to-b from-primary/10 via-accent/5 to-transparent blur-3xl" />
      </div>

      <button
        onClick={handleBack}
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
        Pre-Assessment Check
      </motion.p>

      {mode === "choice" ? (
        <>
          <motion.h2
            className="relative text-2xl md:text-3xl font-bold text-foreground text-center mb-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            How are you taking this assessment?
          </motion.h2>
          <motion.p
            className="relative text-muted-foreground text-center mb-8 max-w-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Pick the option that best describes you.
          </motion.p>

          <div className="relative w-full max-w-md space-y-3">
            <motion.button
              onClick={onIndividual}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full min-h-[64px] px-5 py-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm text-left transition-colors hover:border-primary/60 hover:bg-secondary/80 shadow-sm hover:shadow-md hover:shadow-primary/10 flex items-start gap-3"
            >
              <User className="w-5 h-5 mt-0.5 text-primary shrink-0" />
              <span>
                <span className="block font-semibold text-foreground">Individual</span>
                <span className="block text-sm text-muted-foreground mt-0.5">
                  Taking this on your own.
                </span>
              </span>
            </motion.button>

            <motion.button
              onClick={() => setMode("corporate")}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.45 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full min-h-[64px] px-5 py-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm text-left transition-colors hover:border-primary/60 hover:bg-secondary/80 shadow-sm hover:shadow-md hover:shadow-primary/10 flex items-start gap-3"
            >
              <Building2 className="w-5 h-5 mt-0.5 text-primary shrink-0" />
              <span>
                <span className="block font-semibold text-foreground">Corporate Employee</span>
                <span className="block text-sm text-muted-foreground mt-0.5">
                  Referred by your employer.
                </span>
              </span>
            </motion.button>
          </div>
        </>
      ) : (
        <motion.div
          className="relative w-full max-w-md space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Verify your employer
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your work email. We only accept domains of companies contracted with Digital Lexicon.
            </p>
          </div>

          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className="h-12 text-base text-center rounded-xl border-muted-foreground/20 focus:border-primary"
              maxLength={80}
            />
            <Input
              type="email"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerify();
              }}
              className="h-12 text-base text-center rounded-xl border-muted-foreground/20 focus:border-primary"
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <button
            onClick={handleVerify}
            disabled={checking}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {checking ? "Verifying…" : "Continue"}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default PreAssessmentCheck;
