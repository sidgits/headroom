import { useState } from "react";
import QuizProgressBar from "./QuizProgressBar";
import type { QuizQuestionData } from "@/data/quizQuestions";

interface QuizQuestionProps {
  question: QuizQuestionData;
  current: number;
  total: number;
  onAnswer: (answerId: string) => void;
}

const QuizQuestion = ({ question, current, total, onAnswer }: QuizQuestionProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answerId: string) => {
    if (selected) return;
    setSelected(answerId);
    setTimeout(() => {
      onAnswer(answerId);
      setSelected(null);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8 bg-background">
      <QuizProgressBar current={current} total={total} />

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <p className="text-sm text-muted-foreground mb-2">
          Question {current} of {total}
        </p>
        <h2 className="text-[22px] md:text-2xl font-bold text-foreground leading-snug mb-8">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.answers.map((answer) => {
            const isSelected = selected === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => handleSelect(answer.id)}
                disabled={!!selected}
                className={`w-full min-h-[56px] px-5 py-4 rounded-lg border text-left transition-all duration-300 active:scale-[0.98] ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:bg-secondary"
                } ${selected && !isSelected ? "opacity-50" : ""}`}
              >
                <span className="font-medium">{answer.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
