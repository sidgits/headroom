import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";

const KEY = "headroom_review_code";

/**
 * Frictionless entry point for app reviewers (e.g. the Google OAuth
 * verification team). Opening /reviewer?code=CODE stores the shared review
 * code and drops straight into the calendar screen, where the "Connect Google
 * Calendar" consent flow is available with no sign-up, payment or assessment.
 */
export default function Reviewer() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const c = params.get("code") || params.get("review") || localStorage.getItem(KEY);
      if (c) {
        localStorage.setItem(KEY, c);
        setCode(c);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const enter = () => {
    if (!code) return;
    navigate(`/dashboard/calendar?review=${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">App review access</p>
          <h1 className="text-2xl font-bold text-foreground">Headroom — reviewer entry</h1>
          <p className="text-sm text-muted-foreground">
            No sign-up, payment or phone verification is required. This link unlocks the full
            calendar experience for review.
          </p>
        </div>

        <ol className="space-y-3 text-sm text-foreground">
          {[
            "Click Enter review mode below.",
            "On the calendar screen, click Connect Google Calendar.",
            "Sign in with any Google account and approve the read-only calendar consent screen.",
            "You return to Headroom; your events are scored for cognitive load and burnout risk.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-border bg-card/40 p-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {code ? (
          <button
            onClick={enter}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Enter review mode
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Open this page using the full review link that includes ?code=… to continue.
          </div>
        )}

        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          Headroom requests <strong>calendar.readonly</strong> only. Event data is used solely to
          compute your cognitive load scores and is never used to train AI models.
        </p>
      </div>
    </div>
  );
}
