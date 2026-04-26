import { forwardRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface LandingHeroProps {
  onStart: () => void;
}

const vignettes = [
  {
    name: "Sarah",
    text: "runs a 12-person team. She hasn't had a lunch break in three weeks. Not because she's lazy — because the work never stops arriving.",
  },
  {
    name: "James",
    text: "is a senior developer. He's brilliant at his craft, but spends 60% of his day in meetings he didn't ask for. His best thinking happens at midnight.",
  },
  {
    name: "Aisha",
    text: "founded her company two years ago. She went from building the product to managing everything else. She can't remember the last time she felt creative.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const LandingHero = forwardRef<HTMLDivElement, LandingHeroProps>(({ onStart }, ref) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "";

  return (
    <div ref={ref} className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Warm radial gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[140%] h-[70%] rounded-full bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-gradient-to-tl from-warm-red/10 via-deep-orange/8 to-transparent blur-3xl" />
        <div className="absolute top-[30%] left-[-5%] w-[30%] h-[40%] rounded-full bg-golden/8 blur-3xl" />
      </div>

      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />

      {/* Sign-in / profile chip is rendered globally by <ProfileBadge /> in Index.tsx */}


      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <motion.img
          src="/headroom-logo.png"
          alt="Headroom"
          className="w-64 md:w-80 mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.h1
          className="text-3xl md:text-5xl font-bold text-foreground leading-tight max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Your brain has a capacity.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-warm-red">
            Nobody told you what's filling it.
          </span>
        </motion.h1>
        <motion.p
          className="mt-5 text-3xl md:text-4xl text-muted-foreground max-w-xl font-semibold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          A 2-minute assessment that reveals your cognitive load pattern — and what to do about it.
        </motion.p>
        {user && (
          <motion.p
            className="mt-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            Welcome{displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋
          </motion.p>
        )}
        <motion.button
          onClick={onStart}
          className="mt-8 w-full max-w-xs h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          {user ? "Discover your Pattern" : "Click to Discover your Pattern"}
        </motion.button>
      </section>

      {/* Vignettes */}
      <section className="relative px-6 pb-12 max-w-lg mx-auto space-y-6">
        {vignettes.map((v, i) => (
          <motion.p
            key={v.name}
            className="text-base text-muted-foreground italic leading-relaxed backdrop-blur-sm bg-card/40 rounded-xl px-5 py-4 border border-border/50"
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
          >
            <span className="font-semibold text-foreground not-italic">{v.name}</span>{" "}
            {v.text}
          </motion.p>
        ))}
      </section>

      {/* Second CTA */}
      <motion.section
        className="relative px-6 pb-16 text-center max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xl font-semibold text-foreground mb-6">
          Different jobs. Different titles.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-warm-red">
            Same problem.
          </span>
        </p>
        <motion.button
          onClick={onStart}
          className="w-full max-w-xs h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          Take the assessment
        </motion.button>
      </motion.section>
    </div>
  );
});
LandingHero.displayName = "LandingHero";

export default LandingHero;
