interface DisclaimerProps {
  onStart: () => void;
}

const Disclaimer = ({ onStart }: DisclaimerProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <span className="text-xl">🧠</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Before we begin
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          This isn't a personality test. There are no right or wrong answers. 
          Headroom measures the invisible weight your brain carries every day — 
          the friction, the complexity, and the space you have (or don't) to grow. 
          Answer honestly. The more truthful you are, the more useful your results will be.
        </p>
        <button
          onClick={onStart}
          className="w-full max-w-xs h-14 rounded-lg bg-primary text-primary-foreground font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Start the assessment
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;
