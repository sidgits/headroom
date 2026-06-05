import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Calendar, CheckCircle2, LineChart, Lock, MessageCircle, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import ProfileBadge from "@/components/auth/ProfileBadge";
import Footer from "@/components/Footer";
import { getArchetypeMeta } from "@/lib/archetypeProfile";

interface Completion {
  id: string;
  role: string;
  archetype_id: string;
  archetype_name: string;
  created_at: string;
  name: string | null;
  email: string | null;
}

interface Checkin {
  id: string;
  created_at: string;
}

const MIN_LONGITUDINAL_CHECKINS = 5;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser({ id: session.user.id, email: session.user.email });

      // Log this dashboard visit as a check-in (one per session marker)
      const marker = `dashboard_checkin:${session.user.id}:${new Date().toDateString()}`;
      if (!sessionStorage.getItem(marker)) {
        sessionStorage.setItem(marker, "1");
        supabase.from("dashboard_checkins").insert({
          user_id: session.user.id,
          email: session.user.email ?? null,
        }).then(({ error }) => {
          if (error) console.error("checkin insert failed", error);
        });
      }

      const [completionsRes, checkinsRes] = await Promise.all([
        supabase
          .from("assessment_completions")
          .select("id, role, archetype_id, archetype_name, created_at, name, email")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("dashboard_checkins")
          .select("id, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (!isMounted) return;
      if (completionsRes.data) setCompletions(completionsRes.data as Completion[]);
      if (checkinsRes.data) setCheckins(checkinsRes.data as Checkin[]);
      setLoading(false);
    };

    load();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading your dashboard…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <ProfileBadge />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center space-y-6 bg-card/60 border border-border/50 rounded-2xl p-8">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Sign in to access your dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Your full archetype, burnout markers, longitudinal pattern view, calendar analysis and chat agent live here.
              </p>
            </div>
            <button
              onClick={async () => {
                const res = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin + "/dashboard",
                });
                if (res.error) toast.error("Sign-in failed. Please try again.");
              }}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-sm font-medium text-foreground"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Sign in with Google
            </button>
            <Link to="/" className="block text-xs text-muted-foreground underline underline-offset-4">
              Back to home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const latest = completions[0];
  const archetypeProfile = latest ? getArchetypeMeta(latest.archetype_id, latest.archetype_name) : null;
  const totalCheckins = checkins.length;
  const hasEnoughForLongitudinal = completions.length >= MIN_LONGITUDINAL_CHECKINS;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Dashboard — Headroom</title>
        <meta name="description" content="Your full Headroom cognitive-load dashboard." />
      </Helmet>
      <ProfileBadge />

      <div className="flex-1 max-w-3xl w-full mx-auto px-5 py-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-1"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your Headroom Dashboard</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome{latest?.name ? `, ${latest.name}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your work pattern, cognitive load and burnout signal over time.
          </p>
        </motion.div>

        {/* a. Full Archetype + Burnout */}
        <section className="bg-card/60 border border-border/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Your Work Pattern Archetype</h2>
          </div>
          {latest && archetypeProfile ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-4xl">{archetypeProfile.emoji}</div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{archetypeProfile.name}</h3>
                  <p className="text-sm italic text-muted-foreground">{archetypeProfile.headline}</p>
                </div>
              </div>
              <p className="text-[15px] text-foreground/85 leading-relaxed">{archetypeProfile.headline}</p>
              <div className="pt-3 border-t border-border/40">
                <p className="text-xs font-bold uppercase tracking-wider text-warm-red mb-1">Burnout marker</p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {archetypeProfile.defaultBurnout.label} — {archetypeProfile.defaultBurnout.signal}
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retake assessment
              </button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground space-y-3">
              <p>You haven't completed an assessment yet.</p>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Take the assessment
              </button>
            </div>
          )}
        </section>

        {/* b. Longitudinal view */}
        <section className="bg-card/60 border border-border/50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-accent">
            <TrendingUp className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Pattern Shifts Over Time</h2>
          </div>
          {hasEnoughForLongitudinal ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground/80">
                {completions.length} completed assessments. Trend chart coming soon.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {completions.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    <span className="text-foreground/70">{c.archetype_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your longitudinal pattern view unlocks after <span className="text-foreground font-medium">{MIN_LONGITUDINAL_CHECKINS} completed assessments</span>.
                You're at <span className="text-foreground font-medium">{completions.length} / {MIN_LONGITUDINAL_CHECKINS}</span>.
              </p>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${Math.min(100, (completions.length / MIN_LONGITUDINAL_CHECKINS) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground italic">
                Retake the assessment periodically — fortnightly works well — to surface how your work pattern is shifting.
              </p>
            </div>
          )}
        </section>

        {/* c. Check-in tracker */}
        <section className="bg-card/60 border border-border/50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Check-In Tracker</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalCheckins === 0
              ? "This is your first check-in."
              : `${totalCheckins} check-in${totalCheckins === 1 ? "" : "s"} so far.`}
          </p>
          {checkins.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1 max-h-48 overflow-y-auto">
              {checkins.slice(0, 12).map((c) => (
                <li key={c.id} className="flex justify-between border-b border-border/30 py-1">
                  <span>{new Date(c.created_at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span>{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* d. Calendar integration */}
        <section className="bg-card/60 border border-border/50 rounded-2xl p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-accent">
            <Calendar className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Calendar Integration</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Sync your schedule so Headroom can score the cognitive load of your day.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <button
              disabled
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 text-sm text-muted-foreground/70 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" /> Connect Google Calendar
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 text-sm text-muted-foreground/70 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" /> Upload .ics file
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground italic">Coming next.</p>
        </section>

        {/* e. Daily CLT analysis */}
        <section className="bg-card/60 border border-border/50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-warm-red">
            <LineChart className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Today's Cognitive Load</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Once your calendar is connected, Headroom will classify each day's burnout risk using Cognitive Load Theory
            (Extraneous / Intrinsic / Germane) and suggest what to cut, reorder or protect.
          </p>
          <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground italic">
            Awaiting calendar data
          </div>
        </section>

        {/* f. Chat agent */}
        <section className="bg-card/60 border border-border/50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <MessageCircle className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Burnout Mitigation Chat</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A CLT-grounded chat agent that knows your archetype and helps you reduce cognitive load in real time.
          </p>
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 text-sm text-muted-foreground/70 cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" /> Chat agent — coming soon
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
