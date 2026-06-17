import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Top-right login menu shown on the homepage only.
 * Only existing paid users can sign in here. New users are directed to take the
 * assessment first (sign-in happens at the end of the quiz / after payment).
 */
const HomepageLoginMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      // Gate: only apply when the sign-in was initiated from THIS menu's button.
      // (Sign-ins from the quiz flow must NOT be revoked here — otherwise the
      // user is signed out before they pay and loses their session post-checkout.)
      if (event === "SIGNED_IN" && session?.user) {
        const fromMenu = sessionStorage.getItem("homepage_login_attempt") === "1";
        if (!fromMenu) return;
        sessionStorage.removeItem("homepage_login_attempt");
        const { data: row } = await supabase
          .from("subscribers")
          .select("status,current_period_end")
          .eq("user_id", session.user.id)
          .maybeSingle();
        const active =
          row &&
          ["active", "trialing"].includes(row.status ?? "") &&
          (!row.current_period_end || new Date(row.current_period_end) > new Date());
        if (!active) {
          await supabase.auth.signOut();
          setNoticeOpen(true);
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (user) return null;

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      sessionStorage.setItem("homepage_login_attempt", "1");
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (res.error) {
        sessionStorage.removeItem("homepage_login_attempt");
        toast.error("Google sign-in failed. Please try again.");
        setGoogleLoading(false);
      }
    } catch {
      sessionStorage.removeItem("homepage_login_attempt");
      toast.error("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setEmailOpen(false);
      // Subscription gate runs in onAuthStateChange. If active, route to dashboard.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: row } = await supabase
          .from("subscribers")
          .select("status")
          .eq("user_id", data.session.user.id)
          .maybeSingle();
        if (row && ["active", "trialing"].includes(row.status ?? "")) {
          toast.success("Signed in");
          navigate("/dashboard");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-card/90 backdrop-blur-md border border-border/60 shadow-sm text-xs sm:text-sm font-medium text-foreground hover:bg-card transition-colors disabled:opacity-60"
            aria-label="Sign in with Google"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.54 1 10.22 1 12s.43 3.46 1.18 4.96l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Google</span>
          </button>
          <button
            onClick={() => setEmailOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground shadow-sm text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
            aria-label="Sign in with Email"
          >
            <span className="hidden sm:inline">Sign in with Email</span>
            <span className="sm:hidden">Email</span>
          </button>
        </div>
        <p className="text-sm sm:text-base font-semibold tracking-wide text-right text-black">
          Returning Users
        </p>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in with Email</DialogTitle>
            <DialogDescription>
              Welcome back. Enter your details to continue.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : "Sign in"}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
              By continuing, you agree to our{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground" onClick={() => setEmailOpen(false)}>
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-center text-xs text-muted-foreground">
              New here? Take the assessment below to get started.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Take the assessment first</DialogTitle>
            <DialogDescription>
              Sign-in is for returning users with an active subscription. To get started,
              please take the assessment below — your account is created at the end.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="w-full"
            onClick={() => {
              setNoticeOpen(false);
              navigate("/");
            }}
          >
            Start the assessment
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HomepageLoginMenu;
