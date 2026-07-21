import { useState, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import PreAssessmentCheck from "@/components/quiz/PreAssessmentCheck";

import { quizQuestions } from "@/data/quizQuestions";
import { calculateResults, type ScoringResult } from "@/lib/scoring";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Screen = "landing" | "preAssessment" | "role" | "disclaimer" | "quiz" | "sprinterCheck" | "email" | "results";

interface QuizState {
  role: string;
  answers: Record<number, string>;
  sprinterAnswer: string | null;
}

const PENDING_KEY = "headroom_pending_quiz";

const Index = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("retake") === "1" || sessionStorage.getItem("headroom_retake") === "1") {
        sessionStorage.removeItem("headroom_retake");
        return "role";
      }
    } catch {}
    return "landing";
  });
  const returning = useReturningUserProfile();

  // Clean ?retake=1 from the URL once we've consumed it.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("retake")) {
        url.searchParams.delete("retake");
        window.history.replaceState({}, "", url.toString());
      }
    } catch {}
  }, []);

  // Returning signed-in users should land on their dashboard, not the marketing page,
  // unless they're mid-quiz (PENDING_KEY) or actively retaking (screen !== "landing").
  useEffect(() => {
    if (returning.loading) return;
    if (!returning.user) return;
    if (screen !== "landing") return;
    const hasPending = (() => {
      try { return !!sessionStorage.getItem(PENDING_KEY); } catch { return false; }
    })();
    if (hasPending) return;
    navigate("/dashboard", { replace: true });
  }, [returning.loading, returning.user, screen, navigate]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>({
    role: "",
    answers: {},
    sprinterAnswer: null,
  });
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Restore pending quiz state after OAuth redirect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) return;

      try {
        const parsed = JSON.parse(raw) as QuizState;
        sessionStorage.removeItem(PENDING_KEY);
        const email = session.user.email ?? "";
        const meta = session.user.user_metadata as Record<string, unknown> | undefined;
        const name =
          (typeof meta?.full_name === "string" && meta.full_name) ||
          (typeof meta?.name === "string" && meta.name) ||
          email.split("@")[0] ||
          "";

        const result = calculateResults(parsed.answers, parsed.sprinterAnswer);
        setQuizState(parsed);
        setScoringResult(result);
        setUserEmail(email);
        setUserName(String(name));
        try { localStorage.setItem("headroom_assessment_email", email); } catch {}
        try {
          await supabase.functions.invoke("log-assessment", {
            body: {
              role: parsed.role,
              archetype_id: result.archetype.id,
              archetype_name: result.archetype.name,
              email,
              name: String(name),
              result_data: result,
            },
          });
        } catch {}
        navigate("/dashboard", { replace: true });
      } catch {
        sessionStorage.removeItem(PENDING_KEY);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [isCorporate, setIsCorporate] = useState(false);

  const handleStart = useCallback(() => setScreen("preAssessment"), []);

  const handlePreBack = useCallback(() => setScreen("landing"), []);

  const handlePreIndividual = useCallback(() => {
    setIsCorporate(false);
    setUserName("");
    setUserEmail("");
    setScreen("role");
  }, []);

  const handlePreCorporate = useCallback(({ name, email }: { name: string; email: string }) => {
    setIsCorporate(true);
    setUserName(name);
    setUserEmail(email);
    try { localStorage.setItem("headroom_assessment_email", email); } catch {}
    setScreen("role");
  }, []);

  const handleBackFromRole = useCallback(() => setScreen("preAssessment"), []);

  const handleRoleSelect = useCallback((roleId: string) => {
    setQuizState((prev) => ({ ...prev, role: roleId }));
    setScreen("disclaimer");
  }, []);

  const handleBackFromDisclaimer = useCallback(() => setScreen("role"), []);

  const handleDisclaimerStart = useCallback(() => {
    setCurrentQuestion(0);
    setScreen("quiz");
  }, []);

  const handleBackFromQuiz = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else {
      setScreen("disclaimer");
    }
  }, [currentQuestion]);

  const handleBackFromSprintCheck = useCallback(() => {
    setScreen("quiz");
  }, []);

  const finalizeAssessment = useCallback(
    async (result: ScoringResult) => {
      // Corporate users skip the email capture screen — they already gave name/email
      // on the pre-assessment page and their domain is verified.
      if (isCorporate && userEmail && userName) {
        try {
          await supabase.functions.invoke("log-assessment", {
            body: {
              role: quizState.role,
              archetype_id: result.archetype.id,
              archetype_name: result.archetype.name,
              email: userEmail,
              name: userName,
              result_data: result,
            },
          });
        } catch {}
        navigate("/dashboard");
      } else {
        setScreen("email");
      }
    },
    [isCorporate, userEmail, userName, quizState.role, navigate]
  );

  const handleAnswer = useCallback(
    (answerId: string) => {
      const questionId = quizQuestions[currentQuestion].id;
      const updatedAnswers = { ...quizState.answers, [questionId]: answerId };

      setQuizState((prev) => ({ ...prev, answers: updatedAnswers }));

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        if (updatedAnswers[4] === "B" && updatedAnswers[6] === "A") {
          setScreen("sprinterCheck");
        } else {
          const result = calculateResults(updatedAnswers, null);
          setScoringResult(result);
          finalizeAssessment(result);
        }
      }
    },
    [currentQuestion, quizState.answers, finalizeAssessment]
  );

  const handleSprinterAnswer = useCallback(
    (answerId: string) => {
      setQuizState((prev) => ({ ...prev, sprinterAnswer: answerId }));
      const result = calculateResults(quizState.answers, answerId);
      setScoringResult(result);
      finalizeAssessment(result);
    },
    [quizState.answers, finalizeAssessment]
  );

  const handleEmailSubmit = useCallback(
    async ({ name, email }: { name: string; email: string }) => {
      setUserName(name);
      setUserEmail(email);
      try { localStorage.setItem("headroom_assessment_email", email); } catch {}
      // Persist the completion before sending the user to the dashboard.
      if (scoringResult) {
        try {
          await supabase.functions.invoke("log-assessment", {
            body: {
              role: quizState.role,
              archetype_id: scoringResult.archetype.id,
              archetype_name: scoringResult.archetype.name,
              email,
              name,
              result_data: scoringResult,
            },
          });
        } catch {}
      }
      navigate("/dashboard");
    },
    [scoringResult, quizState.role, navigate]
  );

  const handleGoogleSignIn = useCallback(async () => {
    // Persist current quiz state so we can restore after OAuth redirect.
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(quizState));
    } catch {}
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) {
      sessionStorage.removeItem(PENDING_KEY);
      toast.error("Sign-in failed. Please try again.");
    }
    // If redirected, browser navigates away.
  }, [quizState]);

  const handleRetake = useCallback(() => {
    setQuizState({ role: "", answers: {}, sprinterAnswer: null });
    setCurrentQuestion(0);
    setScoringResult(null);
    setIsCorporate(false);
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
    <div className="flex min-h-screen flex-col relative">
      
      <Helmet>
        <title>Headroom — Cognitive Load Assessment</title>
        <meta name="description" content="Your brain has a capacity. Nobody told you what's filling it!" />
        <link rel="canonical" href="https://headroomapp.co/" />
        <meta property="og:title" content="Headroom — Cognitive Load Assessment" />
        <meta property="og:description" content="Your brain has a capacity. Nobody told you what's filling it!" />
        <meta property="og:url" content="https://headroomapp.co/" />
      </Helmet>
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {screen === "landing" && (
            <motion.div key="landing" {...pageTransition}>
              {returning.loading ? (
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
          {screen === "preAssessment" && (
            <motion.div key="preAssessment" {...pageTransition}>
              <PreAssessmentCheck
                onIndividual={handlePreIndividual}
                onCorporateVerified={handlePreCorporate}
                onBack={handlePreBack}
              />
            </motion.div>
          )}
          {screen === "role" && (
            <motion.div key="role" {...pageTransition}>
              <RoleSelector onSelect={handleRoleSelect} onBack={handleBackFromRole} />
            </motion.div>
          )}
          {screen === "disclaimer" && (
            <motion.div key="disclaimer" {...pageTransition}>
              <Disclaimer onStart={handleDisclaimerStart} onBack={handleBackFromDisclaimer} />
            </motion.div>
          )}
          {screen === "quiz" && (
            <motion.div key={`quiz-${currentQuestion}`} {...pageTransition}>
              <QuizQuestion
                question={quizQuestions[currentQuestion]}
                current={currentQuestion + 1}
                total={quizQuestions.length}
                onAnswer={handleAnswer}
                onBack={handleBackFromQuiz}
              />
            </motion.div>
          )}
          {screen === "sprinterCheck" && (
            <motion.div key="sprinterCheck" {...pageTransition}>
              <SprintCheck onAnswer={handleSprinterAnswer} onBack={handleBackFromSprintCheck} />
            </motion.div>
          )}
          {screen === "email" && (
            <motion.div key="email" {...pageTransition}>
              <EmailCapture onSubmit={handleEmailSubmit} onGoogleSignIn={handleGoogleSignIn} />
            </motion.div>
          )}
          {screen === "results" && scoringResult && (
            <motion.div key="results" {...pageTransition}>
              <ResultsScreen
                result={scoringResult}
                role={quizState.role}
                email={userEmail}
                name={userName}
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
