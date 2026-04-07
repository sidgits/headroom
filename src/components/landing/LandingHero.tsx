interface LandingHeroProps {
  onStart: () => void;
}

const vignettes = [
  {
    name: "Sarah",
    text: "runs a 12-person team. She hasn't had a lunch break in three weeks. Not because she's lazy — because the work never stops arriving.",
  },
  {
    name: "James",
    text: "is a senior developer. He's brilliant at his craft, but spends 60% of his day in meetings he didn't ask for. His best thinking happens at midnight.",
  },
  {
    name: "Aisha",
    text: "founded her company two years ago. She went from building the product to managing everything else. She can't remember the last time she felt creative.",
  },
];

const LandingHero = ({ onStart }: LandingHeroProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <img
          src="/headroom-logo.png"
          alt="Headroom"
          className="w-48 md:w-64 mb-10"
        />
        <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight max-w-2xl">
          Your brain has a capacity.{" "}
          <span className="text-primary">Nobody told you what's filling it.</span>
        </h1>
        <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-lg">
          A 2-minute assessment that reveals your cognitive load pattern — and what to do about it.
        </p>
        <button
          onClick={onStart}
          className="mt-8 w-full max-w-xs h-14 rounded-lg bg-primary text-primary-foreground font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Discover your pattern
        </button>
      </section>

      {/* Vignettes */}
      <section className="px-6 pb-12 max-w-lg mx-auto space-y-6">
        {vignettes.map((v) => (
          <p key={v.name} className="text-base text-muted-foreground italic leading-relaxed">
            <span className="font-semibold text-foreground not-italic">{v.name}</span>{" "}
            {v.text}
          </p>
        ))}
      </section>

      {/* Second CTA */}
      <section className="px-6 pb-16 text-center max-w-lg mx-auto">
        <p className="text-xl font-semibold text-foreground mb-6">
          Different jobs. Different titles.{" "}
          <span className="text-primary">Same problem.</span>
        </p>
        <button
          onClick={onStart}
          className="w-full max-w-xs h-14 rounded-lg bg-primary text-primary-foreground font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Take the assessment
        </button>
      </section>
    </div>
  );
};

export default LandingHero;
