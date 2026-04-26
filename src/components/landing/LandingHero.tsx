import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
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

const LandingHero = ({ onStart }: LandingHeroProps) => {
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
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;

  const handleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Warm radial gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[140%] h-[70%] rounded-full bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-gradient-to-tl from-warm-red/10 via-deep-orange/8 to-transparent blur-3xl" />
        <div className="absolute top-[30%] left-[-5%] w-[30%] h-[40%] rounded-full bg-golden/8 blur-3xl" />
      </div>

      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />

      {/* Top-right Sign in / User */}
      <div className="absolute top-4 right-4 z-10">
        {user ? (
          <div className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 shadow-sm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-7 h-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline text-xs sm:text-sm font-medium text-foreground max-w-[140px] truncate">
              {displayName}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1 underline-offset-2 hover:underline"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs sm:text-sm font-medium text-foreground shadow-sm"
            aria-label="Sign in with Google"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Sign in</span>
          </button>
        )}
      </div>

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
        <motion.button
          onClick={onStart}
          className="mt-8 w-full max-w-xs h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          Click to Discover your Pattern
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
};

export default LandingHero;
