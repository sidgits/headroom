import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface EmailCaptureProps {
  onSubmit: (data: { name: string; email: string }) => void;
  onGoogleSignIn: () => Promise<void>;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

const EmailCapture = ({ onSubmit, onGoogleSignIn }: EmailCaptureProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }
    if (trimmedName.length > 80) {
      setError("Name is too long");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email");
      return;
    }
    onSubmit({ name: trimmedName, email: trimmedEmail });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } finally {
      // If OAuth redirects, we never reach here; reset only on failure.
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          Discover your Pattern
        </h1>
        <p className="text-sm text-muted-foreground -mt-2">
          Sign in with Google or enter your details to see your results
        </p>

        <p className="text-xs text-muted-foreground italic leading-relaxed px-2">
          No data or response is shared with any company or employer. For the best unrestricted experience, continue with your personal email address or sign in via your Google account.
        </p>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium text-foreground disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            className="h-12 text-base text-center rounded-xl border-muted-foreground/20 focus:border-primary"
            maxLength={80}
          />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            className="h-12 text-base text-center rounded-xl border-muted-foreground/20 focus:border-primary"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
        >
          See My Results
        </button>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          By continuing, you agree to our{" "}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          . We only use your name and email to deliver your results.
        </p>
      </div>
    </div>
  );
};

export default EmailCapture;
