import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

/**
 * Shown on the homepage only for returning users (detected via the
 * `headroom_assessment_email` cookie/localStorage left by a prior visit).
 * Not shown to first-time visitors or already-signed-in users.
 */
const STORAGE_KEY = "headroom_assessment_email";
const COOKIE_KEY = "hr_returning";

const readCookie = (name: string): string | null => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

const ReturningSignInMenu = () => {
  const [visible, setVisible] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) return; // already signed in
      const stored = (() => {
        try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
      })();
      const cookie = readCookie(COOKIE_KEY);
      if (stored || cookie) {
        if (stored) setEmail(stored);
        setVisible(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) toast.error("Sign-in failed. Please try again.");
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a sign-in link.");
      setShowEmail(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
      <p className="text-[11px] uppercase tracking-wider text-white/70 font-medium">
        Returning user?
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEmail((s) => !s)}
          className="h-9 px-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/15 text-white text-xs font-medium hover:bg-white/10 transition-all flex items-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
          Email
        </button>
        <button
          onClick={handleGoogle}
          className="h-9 px-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/15 text-white text-xs font-medium hover:bg-white/10 transition-all flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.7 0 3.22.59 4.42 1.73l3.3-3.3C17.73 1.55 15.09.5 12 .5 7.36.5 3.35 3.16 1.4 7.05l3.84 2.98C6.18 7.15 8.87 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.5 12.28c0-.85-.08-1.67-.22-2.45H12v4.63h6.44c-.28 1.5-1.12 2.77-2.39 3.62l3.72 2.88c2.17-2 3.73-4.95 3.73-8.68z"/>
            <path fill="#FBBC05" d="M5.24 14.28a7.14 7.14 0 0 1 0-4.55L1.4 6.75a12 12 0 0 0 0 10.5l3.84-2.97z"/>
            <path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.07 7.94-2.91l-3.72-2.88c-1.03.69-2.36 1.09-4.22 1.09-3.13 0-5.82-2.11-6.76-4.99L1.4 16.79C3.35 20.68 7.36 23.5 12 23.5z"/>
          </svg>
          Google
        </button>
      </div>
      {showEmail && (
        <form
          onSubmit={handleEmail}
          className="flex items-center gap-2 mt-1 bg-white/5 backdrop-blur-sm border border-white/15 rounded-full pl-3 pr-1 py-1"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none w-44"
          />
          <button
            type="submit"
            disabled={sending}
            className="h-7 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
          >
            {sending ? "…" : "Send link"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReturningSignInMenu;
