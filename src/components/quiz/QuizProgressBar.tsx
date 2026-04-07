interface QuizProgressBarProps {
  current: number;
  total: number;
}

const QuizProgressBar = ({ current, total }: QuizProgressBarProps) => {
  const progress = (current / total) * 100;

  return (
    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default QuizProgressBar;
