import { useState } from "react";

interface SprintCheckProps {
  onAnswer: (answerId: string) => void;
}

const SprintCheck = ({ onAnswer }: SprintCheckProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answerId: string) => {
    if (selected) return;
    setSelected(answerId);
    setTimeout(() => {
      onAnswer(answerId);
      setSelected(null);
    }, 300);
  };

  const options = [
    {
      id: "A",
      text: "Yes — I've been running at this pace for weeks and I can't slow down",
    },
    {
      id: "B",
      text: "No — this is temporary and I know it will ease up soon",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="max-w-md w-full">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-xl">⚡</span>
        </div>
        <h2 className="text-[22px] md:text-2xl font-bold text-foreground text-center leading-snug mb-3">
          One more thing…
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Your answers suggest you might be in a sprint pattern. Does this feel accurate?
        </p>

        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={!!selected}
                className={`w-full min-h-[56px] px-5 py-4 rounded-lg border text-left transition-all duration-300 active:scale-[0.98] ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:bg-secondary"
                } ${selected && !isSelected ? "opacity-50" : ""}`}
              >
                <span className="font-medium">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SprintCheck;
