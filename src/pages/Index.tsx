import { useState, useCallback } from "react";
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

  return (
    <>
      {screen === "landing" && <LandingHero onStart={handleStart} />}
      {screen === "role" && <RoleSelector onSelect={handleRoleSelect} />}
      {screen === "disclaimer" && <Disclaimer onStart={handleDisclaimerStart} />}
      {screen === "quiz" && (
        <QuizQuestion
          key={currentQuestion}
          question={quizQuestions[currentQuestion]}
          current={currentQuestion + 1}
          total={quizQuestions.length}
          onAnswer={handleAnswer}
        />
      )}
      {screen === "sprinterCheck" && (
        <SprintCheck onAnswer={handleSprinterAnswer} />
      )}
      {screen === "results" && scoringResult && (
        <ResultsScreen
          result={scoringResult}
          role={quizState.role}
          onRetake={handleRetake}
        />
      )}
    </>
  );
};

export default Index;
