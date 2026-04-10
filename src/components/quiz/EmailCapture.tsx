import { useState } from "react";
import { Input } from "@/components/ui/input";

interface EmailCaptureProps {
  onSubmit: (email: string) => void;
}

const EmailCapture = ({ onSubmit }: EmailCaptureProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email");
      return;
    }
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          Enter Email to Discover Your Pattern
        </h1>
        <div className="space-y-3">
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
            autoFocus
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
      </div>
    </div>
  );
};

export default EmailCapture;
