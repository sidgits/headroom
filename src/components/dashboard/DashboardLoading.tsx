import { useEffect, useState } from "react";

const STEPS = [
  "Waking up your workspace…",
  "Fetching your assessment results…",
  "Crunching your cognitive load…",
  "Almost there — laying out your dashboard…",
];

interface DashboardLoadingProps {
  /** Overrides the rotating copy with a single fixed message. */
  message?: string | undefined;
}

/**
 * Friendly progressive loading state. Edge functions can cold-start for
 * ~8-12s, so we reassure the user instead of showing a bare "Loading…".
 */
const DashboardLoading = ({ message }: DashboardLoadingProps) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (message) return;
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 3000);
    return () => clearInterval(id);
  }, [message]);

  const progress = message ? 60 : ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground transition-opacity duration-500">
          {message ?? STEPS[step]}
        </p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground/70">
          First load can take a few seconds while we spin things up.
        </p>
      </div>
    </div>
  );
};

export default DashboardLoading;
