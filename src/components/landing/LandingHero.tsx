import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import heroImage from "@/assets/headroom-hero.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Brain,
  CalendarSync,
  Zap,
  ShieldAlert,
  Activity,
  TrendingUp,
  Users,
  Scale,
  Clock,
  ArrowRight,
} from "lucide-react";

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
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
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

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-20 text-center">
        <motion.img
          src="/headroom-logo.png"
          alt="Headroom"
          className="w-56 md:w-72 mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-foreground leading-[1.1] max-w-3xl tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Understand how your work impacts{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-warm-red">
            your mind
          </span>
          .
        </motion.h1>
        <motion.p
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Predict burnout risk, uncover your work patterns, and build a more sustainable way of working.
        </motion.p>
        {user && (
          <motion.p
            className="mt-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            Welcome{displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋
          </motion.p>
        )}
        <motion.button
          onClick={onStart}
          className="mt-10 w-full max-w-sm h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          Take Free Assessment
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </section>

      {/* Section 1 — Why do high performers burn out? */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              The Problem
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Why do high performers burn out?
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              { icon: Zap, label: "Too many context switches" },
              { icon: Users, label: "Meeting overload" },
              { icon: ShieldAlert, label: "Reactive work" },
              { icon: Clock, label: "Constant interruptions" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="flex items-center gap-4 p-5 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
                custom={i}
                variants={fadeUp}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="text-center mt-8 text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Headroom helps identify the specific drivers affecting{" "}
            <span className="text-foreground font-semibold">you</span>.
          </motion.p>
        </div>
      </section>

      {/* Section 2 — Your Personal Work Profile */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              The Assessment
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Your Personal Work Profile
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              { icon: Brain, title: "Work Archetype", desc: "Discover your unique cognitive pattern" },
              { icon: ShieldAlert, title: "Burnout Risk", desc: "See where you stand on the danger curve" },
              { icon: Zap, title: "Energy Drivers", desc: "What fuels you — and what drains you" },
              { icon: Activity, title: "Focus Patterns", desc: "When and how you do your best work" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="group p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
                custom={i}
                variants={fadeUp}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 3 — Continuous Tracking */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-golden/15 text-golden text-sm font-medium mb-4">
              Stay Ahead
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Continuous Tracking
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
              Connect your calendar and monitor:
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              { icon: Brain, title: "Cognitive Load", desc: "Real-time mental capacity score" },
              { icon: TrendingUp, title: "Burnout Risk Trends", desc: "Spot warning signs early" },
              { icon: CalendarSync, title: "Meeting Impact", desc: "How meetings shape your day" },
              { icon: Scale, title: "Workload Sustainability", desc: "Can you keep this pace?" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className={`p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-colors ${i === 3 ? "sm:col-start-2" : ""}`}
                custom={i}
                variants={fadeUp}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-warm-red/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 4 — Make Better Work Decisions */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-warm-red/10 text-warm-red text-sm font-medium mb-4">
              Take Action
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Make Better Work Decisions
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
              Know when to:
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              { icon: Users, label: "Reduce meeting load" },
              { icon: Clock, label: "Protect focus time" },
              { icon: Scale, label: "Rebalance priorities" },
              { icon: ShieldAlert, label: "Recover before burnout occurs" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="flex items-center gap-4 p-5 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
                custom={i}
                variants={fadeUp}
              >
                <div className="w-10 h-10 rounded-xl bg-warm-red/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-warm-red" />
                </div>
                <span className="text-foreground font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vignettes */}
      <section className="relative px-6 py-20 max-w-lg mx-auto space-y-6">
        <motion.p
          className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          You're not alone
        </motion.p>
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

      {/* Final CTA */}
      <motion.section
        className="relative px-6 pb-24 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-lg mx-auto">
          <p className="text-xl font-semibold text-foreground mb-2">
            Different jobs. Different titles.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-warm-red">
              Same problem.
            </span>
          </p>
          <p className="text-muted-foreground mb-8">
            Headroom gives you the clarity to fix it.
          </p>
          <motion.button
            onClick={onStart}
            className="w-full max-w-sm h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mx-auto"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Prevent Burnout & Reduce Workload
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
};

export default LandingHero;
