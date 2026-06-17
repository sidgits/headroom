import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Calendar, CheckCircle2, Download, Flame, Lock, MessageCircle, RefreshCw, Shield, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfileBadge from "@/components/auth/ProfileBadge";
import ShareButtons from "@/components/dashboard/ShareButtons";
import Footer from "@/components/Footer";
import { burnoutLevelStyles, getArchetypeMeta } from "@/lib/archetypeProfile";
import { buildResultFromMeta } from "@/lib/buildResultFromMeta";
import { generateResultsPDF } from "@/lib/generatePDF";

import type { ScoringResult } from "@/lib/scoring";

interface Completion {
  id: string;
  role: string;
  archetype_id: string;
  archetype_name: string;
  created_at: string;
  name: string | null;
  email: string | null;
  result_data?: unknown;
}

// Best-effort runtime check that a JSON blob matches the ScoringResult shape
// the PDF generator expects. Older completions may not have result_data, and
// stored shapes can drift over time, so we guard before passing to the PDF.
function isScoringResult(value: unknown): value is ScoringResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    !!v.archetype &&
    !!v.burnoutRisk &&
    Array.isArray(v.dimensionScores) &&
    Array.isArray(v.recommendations) &&
    !!v.mirror &&
    !!v.shadowArchetype
  );
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
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [recoveringIdentity, setRecoveringIdentity] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const isIndia = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return tz === "Asia/Kolkata" || tz === "Asia/Calcutta";
    } catch {
      return false;
    }
  })();

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      let storedEmail: string | null = null;
      try { storedEmail = localStorage.getItem("headroom_assessment_email"); } catch {}
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: storedEmail ? { email: storedEmail } : {},
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("checkout failed", e);
      toast.error("Could not start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const sessionId = params.get("session_id");

    const cleanUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    };

    if (checkout === "success") {
      setShowCheckoutSuccess(true);
      // Recover identity from Stripe if we have a session_id and no local email.
      const hasLocalEmail = (() => {
        try { return !!localStorage.getItem("headroom_assessment_email"); } catch { return false; }
      })();
      if (sessionId && !hasLocalEmail) {
        setRecoveringIdentity(true);
        // Use fetch directly so we can pass session_id as a query param.
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`;
        fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
          .then((r) => r.json())
          .then((data) => {
            if (data?.email) {
              try { localStorage.setItem("headroom_assessment_email", data.email); } catch {}
              // Trigger reload so the main load() effect picks up the identity.
              cleanUrl();
              window.location.reload();
            } else {
              setRecoveringIdentity(false);
            }
          })
          .catch(() => setRecoveringIdentity(false));
      } else {
        cleanUrl();
      }
      const t = setTimeout(() => setShowCheckoutSuccess(false), 5000);
      return () => clearTimeout(t);
    }
    if (checkout === "cancelled") {
      toast.info("Checkout cancelled.");
      cleanUrl();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      // Resolve identity: session email, else fall back to stored email from the quiz flow.
      let identityEmail: string | null = session?.user?.email ?? null;
      if (!identityEmail) {
        try { identityEmail = localStorage.getItem("headroom_assessment_email"); } catch {}
      }

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else if (identityEmail) {
        // Email-only user — synthesise a minimal user object so the dashboard renders.
        setUser({ id: "email-only", email: identityEmail });
      } else {
        // No identity at all — let them take the assessment first.
        setLoading(false);
        return;
      }

      // Daily checkin marker (avoid duplicate inserts per browser per day)
      const markerId = session?.user?.id ?? identityEmail ?? "anon";
      const marker = `dashboard_checkin:${markerId}:${new Date().toDateString()}`;
      const alreadyChecked = !!sessionStorage.getItem(marker);
      if (!alreadyChecked) sessionStorage.setItem(marker, "1");

      if (session?.user) {
        if (!alreadyChecked) {
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
            .select("id, role, archetype_id, archetype_name, created_at, name, email, result_data")
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

        // Subscription status (drives the upgrade CTA visibility).
        const { data: subRow } = await supabase
          .from("subscribers")
          .select("status, current_period_end")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (
          subRow &&
          ["active", "trialing"].includes(subRow.status as string) &&
          (!subRow.current_period_end || new Date(subRow.current_period_end as string) > new Date())
        ) {
          setIsSubscribed(true);
        }
      } else if (identityEmail) {
        // Email-only path — fetch via edge function (service role bypasses RLS).
        const { data, error } = await supabase.functions.invoke("get-user-dashboard", {
          body: { email: identityEmail },
        });
        if (!isMounted) return;
        if (error) {
          console.error("get-user-dashboard failed", error);
        } else if (data) {
          if (Array.isArray(data.completions)) setCompletions(data.completions as Completion[]);
          if (Array.isArray(data.checkins)) setCheckins(data.checkins as Checkin[]);
        }
      }

      setLoading(false);
    };

    load();
    return () => { isMounted = false; };
  }, []);

  if (loading || recoveringIdentity) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">
          {recoveringIdentity ? "Finalizing your subscription…" : "Loading…"}
        </div>
      </div>
    );
  }

  if (!user) {
    return <NoAssessmentGate />;
  }


  const latest = completions[0];
  const archetypeProfile = latest ? getArchetypeMeta(latest.archetype_id, latest.archetype_name) : null;
  const totalCheckins = checkins.length;
  const progressPct = Math.min(100, (completions.length / MIN_LONGITUDINAL_CHECKINS) * 100);

  const burnoutStyle = archetypeProfile ? burnoutLevelStyles[archetypeProfile.defaultBurnout.level] : null;

  // Secondary tiles (below the two hero highlights)
  const tiles: Array<{
    key: string;
    title: string;
    icon: typeof TrendingUp;
    tint: string;
    body: React.ReactNode;
  }> = [
    {
      key: "longitudinal",
      title: "Pattern Shifts",
      icon: TrendingUp,
      tint: "bg-accent/10 border-accent/30 text-accent",
      body: (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            <span className="text-2xl font-bold">{completions.length}</span>
            <span className="text-muted-foreground"> / {MIN_LONGITUDINAL_CHECKINS} assessments</span>
          </p>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "checkins",
      title: "Check-Ins",
      icon: CheckCircle2,
      tint: "bg-[hsl(var(--golden)/0.15)] border-[hsl(var(--golden)/0.4)] text-[hsl(var(--golden))]",
      body: (
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-foreground leading-none">{totalCheckins}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {checkins[0] ? `Last: ${new Date(checkins[0].created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : "First today"}
          </p>
        </div>
      ),
    },
    {
      key: "calendar",
      title: "Calendar",
      icon: Calendar,
      tint: "bg-[hsl(var(--deep-orange)/0.12)] border-[hsl(var(--deep-orange)/0.35)] text-[hsl(var(--deep-orange))]",
      body: isSubscribed ? (
        <Link to="/dashboard/calendar" className="text-sm font-semibold underline underline-offset-4">
          Open calendar view →
        </Link>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" /> Unlock with upgrade
        </div>
      ),
    },
    {
      key: "todays_burnout",
      title: "Today's Load",
      icon: Flame,
      tint: "bg-secondary border-border text-foreground",
      body: isSubscribed ? (
        <Link to="/dashboard/calendar" className="text-sm font-semibold text-primary underline underline-offset-4">
          See daily load score →
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground italic">Awaiting calendar</p>
      ),
    },
    {
      key: "chat",
      title: "AI Productivity Coach",
      icon: MessageCircle,
      tint: "bg-primary/10 border-primary/30 text-primary",
      body: isSubscribed ? (
        <Link to="/dashboard/coach" className="text-sm font-semibold underline underline-offset-4">
          Chat with your coach →
        </Link>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" /> Unlock with upgrade
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Dashboard — Headroom</title>
        <meta name="description" content="Your personal Headroom dashboard — track cognitive load, review past assessments, and see how your burnout patterns shift over time." />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://headroomapp.co/dashboard" />
        <meta property="og:title" content="Dashboard — Headroom" />
        <meta property="og:description" content="Track your cognitive load and burnout patterns over time on your personal Headroom dashboard." />
        <meta property="og:url" content="https://headroomapp.co/dashboard" />
      </Helmet>
      <ProfileBadge />

      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6 flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Headroom Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              Welcome{latest?.name ? `, ${latest.name.split(" ")[0]}` : ""} 👋
            </h1>
          </div>
          <motion.button
            onClick={() => {
              try { sessionStorage.setItem("headroom_retake", "1"); } catch {}
              navigate("/?retake=1");
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto py-2.5 px-4 rounded-xl border border-primary/40 bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/15 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Assessment for Free
          </motion.button>
        </motion.div>


        {/* HERO ROW — Archetype + Burnout Risk (the highlight) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Archetype Profile */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/5 p-5 sm:p-6 flex flex-col gap-4"
          >
            {archetypeProfile && latest ? (
              <>
                <div className="flex items-start gap-4">
                  <span className="text-5xl sm:text-6xl leading-none">{archetypeProfile.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">Your Archetype</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{archetypeProfile.name}</h2>
                    <p className="text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-warm-red font-semibold italic mt-1 leading-snug">
                      {archetypeProfile.headline}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-card/60 border border-border/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">At your best</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-5">{archetypeProfile.atYourBest}</p>
                  </div>
                  <div className="rounded-xl bg-card/60 border border-border/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-accent font-bold mb-1">Working against you</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-5">{archetypeProfile.workingAgainstYou}</p>
                  </div>
                  <div className="rounded-xl bg-card/60 border border-border/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-warm-red font-bold mb-1">Pattern unnoticed</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-5">{archetypeProfile.patternNotNoticed}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Your unlock</p>
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed">{archetypeProfile.unlock}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-start justify-center gap-3">
                <p className="text-sm text-muted-foreground">No assessment on file yet.</p>
                <button onClick={() => navigate("/")} className="text-sm font-semibold text-primary underline underline-offset-4">
                  Take the assessment →
                </button>
              </div>
            )}
          </motion.div>

          {/* Burnout Risk — detailed */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className={`rounded-2xl border p-5 sm:p-6 flex flex-col gap-4 bg-gradient-to-br ${burnoutStyle?.bg ?? "from-muted/20 to-muted/5"} ${burnoutStyle?.border ?? "border-border"}`}
          >
            {archetypeProfile ? (
              <>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-background/40 border ${burnoutStyle?.border}`}>
                    <AlertTriangle className={`w-6 h-6 sm:w-7 sm:h-7 ${burnoutStyle?.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] uppercase tracking-widest font-semibold ${burnoutStyle?.text}`}>Detailed Burnout Risk</p>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{archetypeProfile.defaultBurnout.label}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground italic mt-1">{archetypeProfile.defaultBurnout.signal}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-card/60 border border-border/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-foreground font-bold mb-1">What's happening</p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-6">{archetypeProfile.defaultBurnout.description}</p>
                </div>

                <div className={`rounded-xl border p-3 flex items-start gap-2 ${burnoutStyle?.tile}`}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold">Early intervention</p>
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed">{archetypeProfile.defaultBurnout.earlyIntervention}</p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground italic">
                  Shadow archetype under stress: <span className="text-foreground font-medium">{archetypeProfile.shadowName}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Complete the assessment to see your detailed burnout read.</p>
            )}
          </motion.div>
        </div>

        {/* UPGRADE CTA */}
        {!isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-accent/10 to-warm-red/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">Go deeper</p>
              <p className="text-sm sm:text-base text-foreground leading-snug">
                Unlock real-time cognitive load tracking from your work schedule, plus your personalised AI Productivity Coach.
              </p>
            </div>
            <motion.button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center text-center py-3 px-5 rounded-xl bg-gradient-to-r from-primary via-accent to-warm-red text-primary-foreground font-semibold text-sm sm:text-base shadow-lg shadow-primary/20 disabled:opacity-60 whitespace-normal sm:whitespace-nowrap"
            >
              {checkoutLoading
                ? "Redirecting…"
                : `Track real-time picture basis your work schedule for ${isIndia ? "₹300" : "$9"} (Personalized AI Productivity Coach included)`}
            </motion.button>
          </motion.div>
        )}

        {/* SECONDARY TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-3 min-h-[130px] ${t.tint}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider">{t.title}</h2>
                </div>
                <div className="flex-1">{t.body}</div>
              </motion.div>
            );
          })}
        </div>

        {/* SHARE + DOWNLOAD ROW */}
        {archetypeProfile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="rounded-2xl border border-border/50 bg-card/60 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Share your result</p>
              <ShareButtons archetypeName={archetypeProfile.name} />
            </div>
            <motion.button
              onClick={() => generateResultsPDF(
                isScoringResult(latest?.result_data) ? latest!.result_data : buildResultFromMeta(archetypeProfile),
                latest?.role ?? "—",
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download full profile
            </motion.button>
          </motion.div>
        )}
      </div>
      <Footer />

      <AnimatePresence>
        {showCheckoutSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm px-4"
            onClick={() => setShowCheckoutSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-2xl shadow-primary/20"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Payment successful</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your subscription is active. A confirmation email is on its way.
              </p>
              <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground/70">
                Closing automatically…
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

function NoAssessmentGate() {
  return (
    <div className="min-h-screen flex flex-col">
      <ProfileBadge />
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full space-y-5 bg-card/60 border border-border/50 rounded-2xl p-7 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-foreground">No assessment yet</h1>
            <p className="text-xs text-muted-foreground">
              Take the assessment first — your dashboard unlocks as soon as you finish.
            </p>
          </div>
          <Link
            to="/"
            className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm"
          >
            Take the assessment
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}


