import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import ProfileBadge from "@/components/auth/ProfileBadge";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash and emits PASSWORD_RECOVERY / SIGNED_IN
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. Heading to your dashboard.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Set your password — Headroom</title>
      </Helmet>
      <ProfileBadge />
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full space-y-5 bg-card/60 border border-border/50 rounded-2xl p-7">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold text-foreground">Set your password</h1>
            <p className="text-xs text-muted-foreground">
              {ready ? "Choose a password to access your dashboard." : "Verifying your reset link…"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              disabled={!ready}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 outline-none text-sm text-foreground disabled:opacity-50"
            />
            <input
              type="password"
              required
              disabled={!ready}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 outline-none text-sm text-foreground disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!ready || saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save password"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
