import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Mail, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("headroom_assessment_email");
      if (stored) setEmail(stored);
    } catch {}
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) toast.error("Sign-in failed. Please try again.");
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for a sign-in link.");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-6">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[140%] h-[60%] rounded-full bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-3xl" />
      </div>

      <button
        onClick={() => navigate("/")}
        aria-label="Back to home"
        className="absolute top-6 left-6 w-10 h-10 rounded-full bg-card/60 backdrop-blur-sm border border-border/60 flex items-center justify-center text-foreground hover:bg-card/80 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative w-full max-w-sm flex flex-col items-center gap-3 text-center">
        <img src="/headroom-logo.png" alt="Headroom" className="w-44 mb-6" />
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to pick up where you left off — your assessment results are saved.
        </p>

        <button
          onClick={handleGoogle}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#fff" d="M21.35 11.1H12v3.8h5.35c-.23 1.5-1.72 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.57-2.48C16.66 4.9 14.53 4 12 4 6.98 4 3 7.98 3 13s3.98 9 9 9c5.19 0 8.62-3.65 8.62-8.79 0-.59-.06-1.04-.15-1.51z" />
          </svg>
          Sign in with Google
        </button>

        <form onSubmit={handleEmail} className="w-full flex flex-col gap-2 mt-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full h-12 px-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full h-12 rounded-xl bg-card/60 backdrop-blur-sm border border-border/60 text-foreground font-medium text-sm hover:bg-card/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {sending ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          New here? Take the free assessment
        </button>
      </div>
    </div>
  );
};

export default Login;
