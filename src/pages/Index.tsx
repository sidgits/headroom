import { useState, useCallback } from "react";
import LandingHero from "@/components/landing/LandingHero";
import RoleSelector from "@/components/quiz/RoleSelector";
import Disclaimer from "@/components/quiz/Disclaimer";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import SprintCheck from "@/components/quiz/SprintCheck";
import { quizQuestions } from "@/data/quizQuestions";

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

      setQuizState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: answerId },
      }));

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        const updatedAnswers = {
          ...quizState.answers,
          [questionId]: answerId,
        };
        if (updatedAnswers[4] === "B" && updatedAnswers[6] === "A") {
          setScreen("sprinterCheck");
        } else {
          setScreen("results");
        }
      }
    },
    [currentQuestion, quizState.answers]
  );

  const handleSprinterAnswer = useCallback((answerId: string) => {
    setQuizState((prev) => ({ ...prev, sprinterAnswer: answerId }));
    setScreen("results");
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
      {screen === "results" && (
        <div className="min-h-screen flex items-center justify-center px-6 bg-background">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">✨</p>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Assessment complete
            </h2>
            <p className="text-muted-foreground">
              Your results are being prepared. Scoring engine coming in Phase 2.
            </p>
            <pre className="mt-6 p-4 bg-secondary rounded-lg text-left text-sm text-muted-foreground overflow-auto">
              {JSON.stringify(quizState, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
