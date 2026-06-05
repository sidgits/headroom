import { useState } from "react";
import { Input } from "@/components/ui/input";

interface EmailCaptureProps {
  onSubmit: (data: { name: string; email: string }) => void;
}

const EmailCapture = ({ onSubmit }: EmailCaptureProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          Discover your Pattern
        </h1>
        <p className="text-sm text-muted-foreground -mt-4">
          Enter your name and email to see your results
        </p>
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
            autoFocus
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
      </div>
    </div>
  );
};

export default EmailCapture;
