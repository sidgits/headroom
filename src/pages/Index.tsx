import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LandingHero from "@/components/landing/LandingHero";
import RoleSelector from "@/components/quiz/RoleSelector";
import Disclaimer from "@/components/quiz/Disclaimer";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import SprintCheck from "@/components/quiz/SprintCheck";
import ResultsScreen from "@/components/results/ResultsScreen";
import { quizQuestions } from "@/data/quizQuestions";
import { calculateResults, type ScoringResult } from "@/lib/scoring";

type Screen = "landing" | "role" | "disclaimer" | "quiz" | "sprinterCheck" | "results";

interface QuizState {
  role: string;
  answers: Record<number, string>;
  sprinterAnswer: string | null;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>({
    role: "",
    answers: {},
    sprinterAnswer: null,
  });
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);

  const handleStart = useCallback(() => setScreen("role"), []);

  const handleRoleSelect = useCallback((roleId: string) => {
    setQuizState((prev) => ({ ...prev, role: roleId }));
    setScreen("disclaimer");
  }, []);

  const handleDisclaimerStart = useCallback(() => {
    setCurrentQuestion(0);
    setScreen("quiz");
  }, []);

  const handleAnswer = useCallback(
    (answerId: string) => {
      const questionId = quizQuestions[currentQuestion].id;

      setQuizState((prev) => {
        const updatedAnswers = { ...prev.answers, [questionId]: answerId };

        if (currentQuestion < quizQuestions.length - 1) {
          return { ...prev, answers: updatedAnswers };
        }

        // Last question — check for sprinter pattern
        if (updatedAnswers[4] === "B" && updatedAnswers[6] === "A") {
          return { ...prev, answers: updatedAnswers };
        }

        // Calculate results
        const result = calculateResults(updatedAnswers, null);
        setScoringResult(result);
        return { ...prev, answers: updatedAnswers };
      });

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        const updatedAnswers = { ...quizState.answers, [questionId]: answerId };
        if (updatedAnswers[4] === "B" && updatedAnswers[6] === "A") {
          setScreen("sprinterCheck");
        } else {
          const result = calculateResults(updatedAnswers, null);
          setScoringResult(result);
          setScreen("results");
        }
      }
    },
    [currentQuestion, quizState.answers]
  );

  const handleSprinterAnswer = useCallback(
    (answerId: string) => {
      setQuizState((prev) => ({ ...prev, sprinterAnswer: answerId }));
      const result = calculateResults(quizState.answers, answerId);
      setScoringResult(result);
      setScreen("results");
    },
    [quizState.answers]
  );

  const handleRetake = useCallback(() => {
    setQuizState({ role: "", answers: {}, sprinterAnswer: null });
    setCurrentQuestion(0);
    setScoringResult(null);
    setScreen("landing");
  }, []);

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "landing" && (
        <motion.div key="landing" {...pageTransition}>
          <LandingHero onStart={handleStart} />
        </motion.div>
      )}
      {screen === "role" && (
        <motion.div key="role" {...pageTransition}>
          <RoleSelector onSelect={handleRoleSelect} />
        </motion.div>
      )}
      {screen === "disclaimer" && (
        <motion.div key="disclaimer" {...pageTransition}>
          <Disclaimer onStart={handleDisclaimerStart} />
        </motion.div>
      )}
      {screen === "quiz" && (
        <motion.div key={`quiz-${currentQuestion}`} {...pageTransition}>
          <QuizQuestion
            question={quizQuestions[currentQuestion]}
            current={currentQuestion + 1}
            total={quizQuestions.length}
            onAnswer={handleAnswer}
          />
        </motion.div>
      )}
      {screen === "sprinterCheck" && (
        <motion.div key="sprinterCheck" {...pageTransition}>
          <SprintCheck onAnswer={handleSprinterAnswer} />
        </motion.div>
      )}
      {screen === "results" && scoringResult && (
        <motion.div key="results" {...pageTransition}>
          <ResultsScreen
            result={scoringResult}
            role={quizState.role}
            onRetake={handleRetake}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
