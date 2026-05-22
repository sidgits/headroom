import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";
import { AnimatePresence, motion } from "framer-motion";
import LandingHero from "@/components/landing/LandingHero";
import ReturningUserHome, { useReturningUserProfile } from "@/components/landing/ReturningUserHome";
import RoleSelector from "@/components/quiz/RoleSelector";
import Disclaimer from "@/components/quiz/Disclaimer";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import SprintCheck from "@/components/quiz/SprintCheck";
import ResultsScreen from "@/components/results/ResultsScreen";
import EmailCapture from "@/components/quiz/EmailCapture";
import ProfileBadge from "@/components/auth/ProfileBadge";
import { quizQuestions } from "@/data/quizQuestions";
import { calculateResults, type ScoringResult } from "@/lib/scoring";

type Screen = "landing" | "role" | "disclaimer" | "quiz" | "sprinterCheck" | "email" | "results";

interface QuizState {
  role: string;
  answers: Record<number, string>;
  sprinterAnswer: string | null;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const returning = useReturningUserProfile();
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
      const updatedAnswers = { ...quizState.answers, [questionId]: answerId };

      setQuizState((prev) => ({ ...prev, answers: updatedAnswers }));

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        // Last question — check for sprinter pattern: Q4=B AND Q6=A
        if (updatedAnswers[4] === "B" && updatedAnswers[6] === "A") {
          setScreen("sprinterCheck");
        } else {
          const result = calculateResults(updatedAnswers, null);
          setScoringResult(result);
          setScreen("email");
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
      setScreen("email");
    },
    [quizState.answers]
  );

  const [userEmail, setUserEmail] = useState("");

  const handleEmailSubmit = useCallback(
    (email: string) => {
      setUserEmail(email);
      setScreen("results");
    },
    []
  );

  const handleRetake = useCallback(() => {
    setQuizState({ role: "", answers: {}, sprinterAnswer: null });
    setCurrentQuestion(0);
    setScoringResult(null);
    // Force the returning-user hook to refetch the latest completion when we land back.
    returning.refresh();
    setScreen("landing");
  }, [returning]);

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>Headroom — Cognitive Load Assessment</title>
        <meta name="description" content="Discover your Work Pattern archetype by assessing your Cognitive Load." />
        <link rel="canonical" href="https://headroomapp.co/" />
        <meta property="og:title" content="Headroom — Cognitive Load Assessment" />
        <meta property="og:description" content="Discover your Work Pattern archetype by assessing your Cognitive Load." />
        <meta property="og:url" content="https://headroomapp.co/" />
      </Helmet>
      <ProfileBadge />
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {screen === "landing" && (
            <motion.div key="landing" {...pageTransition}>
              {returning.loading ? (
                // Avoid flashing LandingHero before we know whether the user has a past completion.
                <div className="min-h-screen bg-background" aria-hidden />
              ) : returning.user && returning.completion ? (
                <ReturningUserHome
                  user={returning.user}
                  completion={returning.completion}
                  onRetake={handleStart}
                />
              ) : (
                <LandingHero onStart={handleStart} />
              )}
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
          {screen === "email" && (
            <motion.div key="email" {...pageTransition}>
              <EmailCapture onSubmit={handleEmailSubmit} />
            </motion.div>
          )}
          {screen === "results" && scoringResult && (
            <motion.div key="results" {...pageTransition}>
              <ResultsScreen
                result={scoringResult}
                role={quizState.role}
                email={userEmail}
                onRetake={handleRetake}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
