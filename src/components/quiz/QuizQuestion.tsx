import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuizProgressBar from "./QuizProgressBar";
import type { QuizQuestionData } from "@/data/quizQuestions";

interface QuizQuestionProps {
  question: QuizQuestionData;
  current: number;
  total: number;
  onAnswer: (answerId: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const QuizQuestion = ({ question, current, total, onAnswer }: QuizQuestionProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answerId: string) => {
    if (selected) return;
    setSelected(answerId);
    setTimeout(() => {
      onAnswer(answerId);
      setSelected(null);
    }, 350);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[100%] h-[40%] rounded-full bg-gradient-to-b from-primary/8 via-accent/5 to-transparent blur-3xl" />
      </div>

      <div className="relative">
        <QuizProgressBar current={current} total={total} />
      </div>

      <div className="relative flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <motion.p
          className="text-sm text-muted-foreground mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Question {current} of {total}
        </motion.p>
        <motion.h2
          className="text-[22px] md:text-2xl font-bold text-foreground leading-snug mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {question.question}
        </motion.h2>

        <div className="space-y-3">
          {question.answers.map((answer, i) => {
            const isSelected = selected === answer.id;
            return (
              <motion.button
                key={answer.id}
                onClick={() => handleSelect(answer.id)}
                disabled={!!selected}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                whileHover={!selected ? { scale: 1.02, y: -1 } : {}}
                whileTap={!selected ? { scale: 0.98 } : {}}
                className={`w-full min-h-[56px] px-5 py-4 rounded-xl border text-left transition-all duration-300 shadow-sm ${
                  isSelected
                    ? "border-primary bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                    : "border-border/60 bg-card/80 text-foreground hover:border-primary/60 hover:bg-secondary/80 hover:shadow-md hover:shadow-primary/10"
                } ${selected && !isSelected ? "opacity-40 scale-[0.98]" : ""}`}
              >
                <span className="font-medium">{answer.text}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
